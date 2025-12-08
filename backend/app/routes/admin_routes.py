from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import UUID4

from app.database import get_db
from app.auth import require_super_admin
from app.models import (
    Organization, User, Venue, Court, CourtManager, Booking, Payment
)
from app.schemas import (
    OrganizationCreate, OrganizationResponse,
    VenueCreate, VenueResponse,
    CourtCreate, CourtResponse,
    UserRoleUpdate, ManagerAssignment
)

router = APIRouter(prefix="/admin")

@router.post("/organizations", response_model=OrganizationResponse)
def create_organization(
    org_data: OrganizationCreate,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Create a new organization (tenant)"""
    # Check if slug exists
    existing = db.query(Organization).filter(Organization.slug == org_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization slug already exists")
        
    org = Organization(
        name=org_data.name,
        slug=org_data.slug,
        is_active=True
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/organizations", response_model=List[OrganizationResponse])
def get_organizations(
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """List all organizations"""
    return db.query(Organization).filter(Organization.is_active == True).all()

@router.post("/organizations/{org_id}/managers")
def assign_manager(
    org_id: UUID4,
    assignment: ManagerAssignment,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Assign a manager to specific courts"""
    # Verify manager exists and is in organization
    manager = db.query(User).filter(
        User.id == assignment.manager_id,
        User.organization_id == org_id
    ).first()
    
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found in this organization")
        
    if manager.role != "MANAGER":
        raise HTTPException(status_code=400, detail="User is not a manager")
        
    # Assign to courts
    for court_id in assignment.court_ids:
        # Check if already assigned
        exists = db.query(CourtManager).filter(
            CourtManager.court_id == court_id,
            CourtManager.manager_id == manager.id
        ).first()
        
        if not exists:
            cm = CourtManager(court_id=court_id, manager_id=manager.id)
            db.add(cm)
            
    db.commit()
    return {"status": "success"}

@router.post("/venues", response_model=VenueResponse)
def create_venue(
    venue_data: VenueCreate,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Create a new venue"""
    venue = Venue(**venue_data.dict())
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue

@router.post("/courts", response_model=CourtResponse)
def create_court(
    court_data: CourtCreate,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Create a new court"""
    court = Court(**court_data.dict())
    db.add(court)
    db.commit()
    db.refresh(court)
    return court

@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: UUID4,
    role_update: UserRoleUpdate,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Update a user's role"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = role_update.role
    db.commit()
    return {"status": "success"}

@router.get("/exports/bookings")
def export_bookings(
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Export all bookings as CSV"""
    # Simplified export
    bookings = db.query(Booking).all()
    
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'User', 'Court', 'Start Time', 'End Time', 'Price', 'Status'])
    
    for b in bookings:
        writer.writerow([
            str(b.id), str(b.user_id), str(b.court_id),
            str(b.start_time), str(b.end_time), str(b.total_price), b.status
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bookings.csv"}
    )

@router.get("/exports/payments")
def export_payments(
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Export all payments as CSV"""
    payments = db.query(Payment).all()
    
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Booking ID', 'Amount', 'Status', 'Gateway ID', 'Date'])
    
    for p in payments:
        writer.writerow([
            str(p.booking_id), str(p.amount), p.status,
            p.gateway_payment_id, str(p.created_at)
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payments.csv"}
    )
