from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from pydantic import UUID4
import logging

from app.database import get_db
from app.auth import get_current_user, require_authenticated
from app.models import User, Venue, Court, Booking, Payment
from app.schemas import (
    VenueResponse, CourtResponse, AvailabilityResponse,
    BookingCreate, BookingResponse, PaymentCreate, PaymentResponse
)
from app.services.booking_service import BookingService
from app.services.pricing_service import PricingService
from app.services.payment_service import payment_service
from app.services.invoice_service import invoice_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/venues", response_model=List[VenueResponse])
def get_venues(
    request: Request,
    db: Session = Depends(get_db)
):
    """List all venues for the current organization"""
    organization_id = request.state.organization_id
    venues = db.query(Venue).filter(
        Venue.organization_id == organization_id,
        Venue.is_active == True
    ).all()
    return venues


@router.get("/courts", response_model=List[CourtResponse])
def get_courts(
    request: Request,
    venue_id: Optional[UUID4] = None,
    db: Session = Depends(get_db)
):
    """List courts, optionally filtered by venue"""
    organization_id = request.state.organization_id
    query = db.query(Court).join(Venue).filter(
        Venue.organization_id == organization_id,
        Court.is_active == True
    )
    
    if venue_id:
        query = query.filter(Court.venue_id == venue_id)
    
    return query.all()


@router.get("/courts/{court_id}", response_model=CourtResponse)
def get_court(
    court_id: UUID4,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get specific court details"""
    organization_id = request.state.organization_id
    court = db.query(Court).join(Venue).filter(
        Court.id == court_id,
        Venue.organization_id == organization_id,
        Court.is_active == True
    ).first()
    
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
    
    return court


@router.get("/availability")
def get_availability(
    court_id: UUID4,
    target_date: date,
    db: Session = Depends(get_db)
):
    """Get available slots for a court on a specific date"""
    slots = BookingService.get_available_slots(db, str(court_id), target_date)
    
    # Convert to response format with pricing
    slot_responses = []
    for start_time, end_time in slots:
        try:
            price = PricingService.calculate_booking_price(
                db, str(court_id), start_time, end_time
            )
            rule = PricingService.get_applicable_pricing_rule(
                db, str(court_id), start_time
            )
            
            slot_responses.append({
                "start_time": start_time,
                "end_time": end_time,
                "price_per_30_min": float(rule.price_per_30_min) if rule else 0,
                "is_peak": rule.is_peak if rule else False
            })
        except ValueError:
            # Skip slots without pricing
            continue
    
    return {
        "date": target_date,
        "court_id": court_id,
        "slots": slot_responses
    }


@router.post("/bookings/initiate", response_model=BookingResponse)
def initiate_booking(
    booking_data: BookingCreate,
    request: Request,
    current_user: User = Depends(require_authenticated()),
    db: Session = Depends(get_db)
):
    """
    Initiate a booking and create a pending payment.
    FIX #3: Uses row-level locking to prevent race conditions
    FIX #4: Properly sets organization_id
    FIX #6: Validates booking duration
    """
    organization_id = request.state.organization_id
    
    if not organization_id:
        raise HTTPException(
            status_code=400,
            detail="Organization context required"
        )
    
    try:
        # Start transaction with row locking
        # FIX #3: Lock relevant rows to prevent concurrent booking conflicts
        
        # 1. Validate court belongs to organization
        court = db.query(Court).join(Venue).filter(
            Court.id == booking_data.court_id,
            Venue.organization_id == organization_id
        ).with_for_update().first()  # Lock court row
        
        if not court:
            raise HTTPException(status_code=404, detail="Court not found")
        
        # FIX #6: Validate booking duration
        is_valid, error_msg = BookingService.validate_booking_duration(
            db,
            str(booking_data.court_id),
            booking_data.start_time,
            booking_data.end_time
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # 2. Check for overlapping bookings with row lock
        # FIX #3: Query with FOR UPDATE to lock conflicting bookings
        overlapping_query = db.query(Booking).filter(
            Booking.court_id == booking_data.court_id,
            Booking.status.in_(['PENDING_PAYMENT', 'CONFIRMED']),
            or_(
                # New booking starts during existing booking
                and_(
                    Booking.start_time <= booking_data.start_time,
                    Booking.end_time > booking_data.start_time
                ),
                # New booking ends during existing booking
                and_(
                    Booking.start_time < booking_data.end_time,
                    Booking.end_time >= booking_data.end_time
                ),
                # New booking completely contains existing booking
                and_(
                    Booking.start_time >= booking_data.start_time,
                    Booking.end_time <= booking_data.end_time
                )
            )
        ).with_for_update().first()  # Lock overlapping bookings
        
        if overlapping_query:
            raise HTTPException(
                status_code=400,
                detail="Selected time slot is already booked"
            )
        
        # 3. Calculate price
        try:
            price = PricingService.calculate_booking_price(
                db,
                str(booking_data.court_id),
                booking_data.start_time,
                booking_data.end_time
            )
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Pricing error: {str(e)}"
            )
        
        # 4. Create booking record
        # FIX #4: Include organization_id
        booking = Booking(
            organization_id=organization_id,  # FIX #4: Set organization_id
            user_id=current_user.id,
            court_id=booking_data.court_id,
            venue_id=court.venue_id,
            start_time=booking_data.start_time,
            end_time=booking_data.end_time,
            total_price=price,
            status="PENDING_PAYMENT",
            notes=booking_data.notes
        )
        
        db.add(booking)
        db.flush()  # Get booking ID without committing
        
        # 5. Create payment record
        payment = Payment(
            booking_id=booking.id,
            amount=price,
            currency="INR",
            status="CREATED"
        )
        
        db.add(payment)
        db.commit()
        db.refresh(booking)
        
        logger.info(
            f"Booking {booking.id} initiated for user {current_user.id} "
            f"in org {organization_id}"
        )
        
        return booking
        
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error in booking creation: {e}")
        raise HTTPException(
            status_code=400,
            detail="Booking conflict - slot may have been booked by another user"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in booking creation: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create booking"
        )


@router.post("/payments/create")
def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(require_authenticated()),
    db: Session = Depends(get_db)
):
    """
    Create a Razorpay order for a booking.
    FIX #5: Properly handles payment creation flow
    """
    # Get booking with payment
    booking = db.query(Booking).filter(
        Booking.id == payment_data.booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != "PENDING_PAYMENT":
        raise HTTPException(
            status_code=400,
            detail="Booking is not in pending payment state"
        )
    
    # FIX #5: Get existing payment or create if missing
    payment = db.query(Payment).filter(
        Payment.booking_id == booking.id
    ).first()
    
    if not payment:
        # Create payment if it doesn't exist
        payment = Payment(
            booking_id=booking.id,
            amount=booking.total_price,
            currency="INR",
            status="CREATED"
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
    
    # Create Razorpay order
    try:
        order = payment_service.create_order(db, payment)
        
        # Return order details in Razorpay format
        return {
            "order_id": order.get('id'),
            "amount": order.get('amount'),
            "currency": order.get('currency'),
            "key_id": payment_service.client.auth[0] if payment_service.client else "",
            "booking_id": str(booking.id),
            "payment_id": str(payment.id)
        }
    except Exception as e:
        logger.error(f"Error creating payment order: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create payment order: {str(e)}"
        )


@router.post("/payments/webhook")
async def payment_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Razorpay webhooks"""
    # Verify signature
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    
    if not payment_service.verify_webhook_signature(payload.decode(), signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Process webhook
    data = await request.json()
    
    try:
        payment_service.process_webhook(db, data)  # FIX #2: Now implemented
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook processing failed: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.get("/bookings/history", response_model=List[BookingResponse])
def get_booking_history(
    request: Request,
    current_user: User = Depends(require_authenticated()),
    db: Session = Depends(get_db)
):
    """Get booking history for current user"""
    organization_id = request.state.organization_id
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id,
        Booking.organization_id == organization_id
    ).order_by(Booking.created_at.desc()).all()
    
    return bookings


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: UUID4,
    current_user: User = Depends(require_authenticated()),
    db: Session = Depends(get_db)
):
    """Get specific booking details"""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return booking


@router.get("/bookings/{booking_id}/invoice")
def get_invoice(
    booking_id: UUID4,
    current_user: User = Depends(require_authenticated()),
    db: Session = Depends(get_db)
):
    """Download invoice PDF"""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id,
        Booking.status == "CONFIRMED"
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Confirmed booking not found"
        )
    
    try:
        pdf_buffer = invoice_service.generate_invoice_pdf(booking)
        
        from fastapi.responses import Response
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{booking.invoice_number}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"Invoice generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate invoice"
        )
