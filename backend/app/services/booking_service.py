"""
Booking Service - Core booking logic
Handles availability checking, overlap validation, and slot management
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, date, time, timedelta
from typing import List, Tuple, Optional
import logging

from app.models import (
    Booking, Court, CourtRecurringAvailability,
    CourtDateOverride
)
from app.schemas import AvailabilitySlot

logger = logging.getLogger(__name__)


class BookingService:
    """Service for booking-related operations"""
    
    @staticmethod
    def check_overlap(
        db: Session,
        court_id: str,
        start_time: datetime,
        end_time: datetime,
        exclude_booking_id: Optional[str] = None
    ) -> bool:
        """
        Check if proposed booking overlaps with existing bookings.
        Only PENDING_PAYMENT and CONFIRMED bookings block slots.
        FAILED and CANCELLED_MANUAL bookings do not block.
        
        Args:
            db: Database session
            court_id: Court UUID
            start_time: Proposed start time
            end_time: Proposed end time
            exclude_booking_id: Booking ID to exclude (for updates)
        
        Returns:
            True if overlap exists, False otherwise
        """
        query = db.query(Booking).filter(
            Booking.court_id == court_id,
            Booking.status.in_(['PENDING_PAYMENT', 'CONFIRMED']),
            or_(
                # New booking starts during existing booking
                and_(
                    Booking.start_time <= start_time,
                    Booking.end_time > start_time
                ),
                # New booking ends during existing booking
                and_(
                    Booking.start_time < end_time,
                    Booking.end_time >= end_time
                ),
                # New booking completely contains existing booking
                and_(
                    Booking.start_time >= start_time,
                    Booking.end_time <= end_time
                )
            )
        )
        
        if exclude_booking_id:
            query = query.filter(Booking.id != exclude_booking_id)
        
        overlapping = query.first()
        return overlapping is not None
    
    @staticmethod
    def validate_booking_duration(
        db: Session,
        court_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate booking duration against court constraints.
        
        Args:
            db: Database session
            court_id: Court UUID
            start_time: Proposed start time
            end_time: Proposed end time
        
        Returns:
            (is_valid, error_message)
        """
        court = db.query(Court).filter(Court.id == court_id).first()
        
        if not court:
            return False, "Court not found"
        
        if not court.is_active:
            return False, "Court is not active"
        
        # Calculate duration in minutes
        duration_minutes = (end_time - start_time).total_seconds() / 60
        
        # Check alignment to 30-minute slots
        if duration_minutes % 30 != 0:
            return False, "Booking duration must be in 30-minute increments"
        
        # Check minimum duration
        if duration_minutes < court.min_booking_minutes:
            return False, f"Minimum booking duration is {court.min_booking_minutes} minutes"
        
        # Check maximum duration
        if duration_minutes > court.max_booking_minutes:
            return False, f"Maximum booking duration is {court.max_booking_minutes} minutes"
        
        return True, None
    
    @staticmethod
    def get_court_availability(
        db: Session,
        court_id: str,
        target_date: date
    ) -> List[Tuple[time, time]]:
        """
        Get available time ranges for a court on a specific date.
        Considers recurring availability and date overrides.
        
        Args:
            db: Database session
            court_id: Court UUID
            target_date: Date to check
        
        Returns:
            List of (start_time, end_time) tuples
        """
        # Check for date override first
        override = db.query(CourtDateOverride).filter(
            CourtDateOverride.court_id == court_id,
            CourtDateOverride.date == target_date
        ).first()
        
        if override:
            if override.override_type == 'CLOSE':
                # Court is closed
                return []
            elif override.override_type == 'OPEN' and override.start_time and override.end_time:
                # Special hours
                return [(override.start_time, override.end_time)]
        
        # Get recurring availability for day of week
        day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
        
        recurring = db.query(CourtRecurringAvailability).filter(
            CourtRecurringAvailability.court_id == court_id,
            CourtRecurringAvailability.day_of_week == day_of_week,
            CourtRecurringAvailability.is_active == True
        ).all()
        
        if not recurring:
            return []
        
        # Return all time ranges
        time_ranges = [(r.start_time, r.end_time) for r in recurring]
        return time_ranges
    
    @staticmethod
    def get_available_slots(
        db: Session,
        court_id: str,
        target_date: date,
        slot_duration_minutes: int = 30
    ) -> List[Tuple[datetime, datetime]]:
        """
        Get list of available booking slots for a court on a specific date.
        Excludes already booked slots.
        
        Args:
            db: Database session
            court_id: Court UUID
            target_date: Date to check
            slot_duration_minutes: Slot size in minutes (default 30)
        
        Returns:
            List of (start_datetime, end_datetime) tuples for available slots
        """
        # Get court operating hours
        time_ranges = BookingService.get_court_availability(db, court_id, target_date)
        
        if not time_ranges:
            return []
        
        # Generate all possible slots
        all_slots = []
        
        for start_time, end_time in time_ranges:
            current_time = datetime.combine(target_date, start_time)
            end_datetime = datetime.combine(target_date, end_time)
            
            while current_time + timedelta(minutes=slot_duration_minutes) <= end_datetime:
                slot_end = current_time + timedelta(minutes=slot_duration_minutes)
                all_slots.append((current_time, slot_end))
                current_time = slot_end
        
        # Filter out booked slots
        available_slots = []
        
        for slot_start, slot_end in all_slots:
            # Check if slot is available
            if not BookingService.check_overlap(db, court_id, slot_start, slot_end):
                available_slots.append((slot_start, slot_end))
        
        return available_slots
    
    @staticmethod
    def generate_invoice_number(organization_id: str) -> str:
        """
        Generate unique invoice number.
        Format: ORG-YYYYMMDD-XXXXXX
        
        Args:
            organization_id: Organization UUID
        
        Returns:
            Invoice number string
        """
        import random
        import string
        
        today = datetime.now().strftime("%Y%m%d")
        org_prefix = str(organization_id)[:8].upper()
        random_suffix = ''.join(random.choices(string.digits, k=6))
        
        return f"INV-{org_prefix}-{today}-{random_suffix}"
