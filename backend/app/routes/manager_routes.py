from typing import List, Optional
from datetime import date, time, datetime  # FIX #8: Add datetime import
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import UUID4

from app.database import get_db
from app.auth import require_manager, check_manager_court_access
from app.models import (
    User, Venue, Court, CourtManager, CourtRecurringAvailability,
    CourtDateOverride, PricingRule, Booking
)
from app.schemas import (
    CourtResponse, CourtCreate, CourtUpdate,
    RecurringAvailabilityCreate, DateOverrideCreate,
    PricingRuleCreate, PricingRuleResponse,
    BookingResponse, BookingStatusUpdate
)

router = APIRouter(prefix="/manager")


@router.get("/courts", response_model=List[CourtResponse])
def get_manager_courts(
    request: Request,
    current_user: User = Depends(require_manager()),
    db: Session = Depends(get_db)
):
    """List courts managed by the current user"""
    organization_id = request.state.organization_id
    
    if current_user.role == "SUPER_ADMIN":
        # Super admin sees all courts in organization
        courts = db.query(Court).join(Venue).filter(
            Venue.organization_id == organization_id,
            Court.is_active == True
        ).all()
    else:
        # Manager sees only assigned courts
        courts = db.query(Court).join(CourtManager).filter(
            CourtManager.manager_id == current_user.id,
            Court.is_active == True
        ).all()
    
    return courts


@router.get("/dashboard-metrics")
def get_dashboard_metrics(
    request: Request,
    current_user: User = Depends(require_manager()),
    db: Session = Depends(get_db)
):
    """
    Get key metrics for manager dashboard.
    FIX #8: Correct datetime comparison
    """
    # Get managed court IDs
    if current_user.role == "SUPER_ADMIN":
        organization_id = request.state.organization_id
        court_ids = [c.id for c in db.query(Court.id).join(Venue).filter(
            Venue.organization_id == organization_id
        ).all()]
    else:
        court_ids = [cm.court_id for cm in db.query(CourtManager).filter(
            CourtManager.manager_id == current_user.id
        ).all()]
    
    if not court_ids:
        return {
            "total_courts": 0,
            "total_bookings_today": 0,
            "total_revenue_today": 0.0,
            "total_revenue_month": 0.0,
            "pending_bookings": 0,
            "confirmed_bookings_today": 0
        }
    
    # FIX #8: Use datetime objects for proper comparison
    from datetime import timezone
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(date.today(), time.min).replace(tzinfo=timezone.utc)
    today_end = datetime.combine(date.today(), time.max).replace(tzinfo=timezone.utc)
    
    # Get month boundaries
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    if now.month == 12:
        month_end = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
    
    # Total bookings today
    total_bookings_today = db.query(Booking).filter(
        Booking.court_id.in_(court_ids),
        Booking.status == "CONFIRMED",
        Booking.start_time >= today_start,
        Booking.start_time < today_end
    ).count()
    
    # Revenue today
    revenue_today_query = db.query(Booking.total_price).filter(
        Booking.court_id.in_(court_ids),
        Booking.status == "CONFIRMED",
        Booking.start_time >= today_start,
        Booking.start_time < today_end
    ).all()
    total_revenue_today = sum([r[0] for r in revenue_today_query])
    
    # Revenue this month
    revenue_month_query = db.query(Booking.total_price).filter(
        Booking.court_id.in_(court_ids),
        Booking.status == "CONFIRMED",
        Booking.start_time >= month_start,
        Booking.start_time < month_end
    ).all()
    total_revenue_month = sum([r[0] for r in revenue_month_query])
    
    # Pending bookings
    pending_bookings = db.query(Booking).filter(
        Booking.court_id.in_(court_ids),
        Booking.status == "PENDING_PAYMENT"
    ).count()
    
    # Upcoming confirmed bookings (FIX #8: proper datetime comparison)
    upcoming_bookings = db.query(Booking).filter(
        Booking.court_id.in_(court_ids),
        Booking.status == "CONFIRMED",
        Booking.start_time > now  # FIX #8: Compare datetime with datetime
    ).count()
    
    return {
        "total_courts": len(court_ids),
        "total_bookings_today": total_bookings_today,
        "total_revenue_today": float(total_revenue_today),
        "total_revenue_month": float(total_revenue_month),
        "pending_bookings": pending_bookings,
        "confirmed_bookings_today": total_bookings_today,
        "upcoming_bookings": upcoming_bookings
    }


@router.post("/availability/recurring")
async def set_recurring_availability(
    availability: RecurringAvailabilityCreate,
    current_user: User = Depends(require_manager()),
    db: Session = Depends(get_db)
):
    """Set recurring weekly availability for a court"""
    # Check access
    if not await check_manager_court_access(current_user, str(availability.court_id), db):
        raise HTTPException(status_code=403, detail="Not authorized for this court")
    
    # Delete existing for this day
    db.query(CourtRecurringAvailability).filter(
        CourtRecurringAvailability.court_id == availability.court_id,
        CourtRecurringAvailability.day_of_week == availability.day_of_week
    ).delete()
    
    # Create new
    new_avail = CourtRecurringAvailability(
        court_id=availability.court_id,
        day_of_week=availability.day_of_week,
        start_time=availability.start_time,
        end_time=availability.end_time,
        is_active=True
    )
    
    db.add(new_avail)
    db.commit()
    
    return {"status": "success"}


@router.post("/availability/override")
async def set_date_override(
    override: DateOverrideCreate,
    current_user: User = Depends(require_manager()),
    db: Session = Depends(get_db)
):
    """Set one-time availability override"""
    if not await check_manager_court_access(current_user, str(override.court_id), db):
        raise HTTPException(status_code=403, detail="Not authorized for this court")
    
    new_override = CourtDateOverride(
        court_id=override.court_id,
        date=override.date,
        override_type=override.override_type,
        start_time=override.start_time,
        end_time=override.end_time,
        reason=override.reason,
        created_by=current_user.id
    )
    
    db.add(new_override)
    db.commit()
    
    return {"status": "success"}


@router.post("/pricing-rules", response_model=PricingRuleResponse)
async def create_pricing_rule(
    rule_data: PricingRuleCreate,
    request: Request,
    current_user: User = Depends(require_manager()),
    db: Session = Depends(get_db)
):
    """Create a new pricing rule"""
    if not await check_manager_court_access(current_user, str(rule_data.court_id), db):
        raise HTTPException(status_code=403, detail="Not authorized for this court")
    
    rule = PricingRule(
        court_id=rule_data.court_id,
        organization_id=request.state.organization_id,
        rule_type=rule_data.rule_type,
        day_of_week=rule_data.day_of_week,
        date=rule_data.date,
        start_time=rule_data.start_time,
        end_time=rule_data.end_time,
        price_per_30_min=rule_data.price_per_30_min,
        is_peak=rule_data.is_peak,
        priority=rule_data.priority,
        created_by=current_user.id
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return rule


@router.get("/pricing-rules", response_model=List[PricingRuleResponse])
def get_pricing_rules(
    court_id: Optional[UUID4] = None,
    current_user: User = Depends(require_manager()),
    db: Session = Depends(get_db)
):
    """Get pricing rules for managed courts"""
    query = db.query(PricingRule)
    
    if court_id:
        query = query.filter(PricingRule.court_id == court_id)
    
    return query.filter(PricingRule.is_active == True).all()


@router.get("/bookings", response_model=List[BookingResponse])
def get_manager_bookings(
    request: Request,
    court_id: Optional[UUID4] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_manager()),
    db: Session = Depends(get_db)
):
    """List bookings for managed courts"""
    organization_id = request.state.organization_id
    
    query = db.query(Booking).filter(
        Booking.organization_id == organization_id
    )
    
    # Filter by managed courts for non-super-admins
    if current_user.role != "SUPER_ADMIN":
        managed_court_ids = [cm.court_id for cm in db.query(CourtManager).filter(
            CourtManager.manager_id == current_user.id
        ).all()]
        query = query.filter(Booking.court_id.in_(managed_court_ids))
    
    if court_id:
        query = query.filter(Booking.court_id == court_id)
    
    if status:
        query = query.filter(Booking.status == status)
    
    return query.order_by(Booking.start_time.desc()).all()


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: UUID4,
    status_update: BookingStatusUpdate,
    current_user: User = Depends(require_manager()),
    db: Session = Depends(get_db)
):
    """Update booking status (e.g. cancel)"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not await check_manager_court_access(current_user, str(booking.court_id), db):
        raise HTTPException(status_code=403, detail="Not authorized for this booking")
    
    booking.status = status_update.status
    if status_update.notes:
        booking.notes = status_update.notes
    
    db.commit()
    
    return {"status": "success", "booking_id": str(booking.id)}
