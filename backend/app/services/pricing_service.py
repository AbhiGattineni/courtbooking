"""
Pricing Service - Dynamic pricing calculation
Handles peak/off-peak pricing, priority-based rule selection
"""
from sqlalchemy.orm import Session
from datetime import datetime, date, time
from decimal import Decimal
from typing import Optional, List
import logging

from app.models import PricingRule

logger = logging.getLogger(__name__)


class PricingService:
    """Service for pricing-related operations"""
    
    @staticmethod
    def get_applicable_pricing_rule(
        db: Session,
        court_id: str,
        target_datetime: datetime
    ) -> Optional[PricingRule]:
        """
        Get the most applicable pricing rule for a specific time.
        Priority order:
        1. ONE_TIME rules for the specific date (highest priority first)
        2. RECURRING rules for the day of week (highest priority first)
        
        Args:
            db: Database session
            court_id: Court UUID
            target_datetime: Target date and time
        
        Returns:
            PricingRule or None
        """
        target_date = target_datetime.date()
        target_time = target_datetime.time()
        day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
        
        # First, try ONE_TIME rules for this specific date
        one_time_rule = db.query(PricingRule).filter(
            PricingRule.court_id == court_id,
            PricingRule.rule_type == 'ONE_TIME',
            PricingRule.date == target_date,
            PricingRule.start_time <= target_time,
            PricingRule.end_time > target_time,
            PricingRule.is_active == True
        ).order_by(
            PricingRule.priority.desc()
        ).first()
        
        if one_time_rule:
            return one_time_rule
        
        # Fall back to RECURRING rules for this day of week
        recurring_rule = db.query(PricingRule).filter(
            PricingRule.court_id == court_id,
            PricingRule.rule_type == 'RECURRING',
            PricingRule.day_of_week == day_of_week,
            PricingRule.start_time <= target_time,
            PricingRule.end_time > target_time,
            PricingRule.is_active == True
        ).order_by(
            PricingRule.priority.desc()
        ).first()
        
        return recurring_rule
    
    @staticmethod
    def calculate_booking_price(
        db: Session,
        court_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> Decimal:
        """
        Calculate total price for a booking based on pricing rules.
        Breaks booking into 30-minute slots and applies pricing for each.
        
        Args:
            db: Database session
            court_id: Court UUID
            start_time: Booking start time
            end_time: Booking end time
        
        Returns:
            Total price as Decimal
        
        Raises:
            ValueError: If no pricing rules found
        """
        from datetime import timedelta
        
        total_price = Decimal('0.00')
        current_time = start_time
        slot_duration = timedelta(minutes=30)
        
        # Calculate price for each 30-minute slot
        while current_time < end_time:
            # Get applicable pricing rule for this slot
            rule = PricingService.get_applicable_pricing_rule(
                db, court_id, current_time
            )
            
            if not rule:
                raise ValueError(
                    f"No pricing rule found for court {court_id} "
                    f"at {current_time.strftime('%Y-%m-%d %H:%M')}"
                )
            
            total_price += rule.price_per_30_min
            current_time += slot_duration
        
        return total_price
    
    @staticmethod
    def get_pricing_breakdown(
        db: Session,
        court_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[dict]:
        """
        Get detailed pricing breakdown for a booking.
        
        Args:
            db: Database session
            court_id: Court UUID
            start_time: Booking start time
            end_time: Booking end time
        
        Returns:
            List of dicts with slot details
        """
        from datetime import timedelta
        
        breakdown = []
        current_time = start_time
        slot_duration = timedelta(minutes=30)
        
        while current_time < end_time:
            rule = PricingService.get_applicable_pricing_rule(
                db, court_id, current_time
            )
            
            if rule:
                slot_end = current_time + slot_duration
                breakdown.append({
                    "start_time": current_time,
                    "end_time": slot_end,
                    "price": float(rule.price_per_30_min),
                    "is_peak": rule.is_peak,
                    "rule_type": rule.rule_type
                })
            
            current_time += slot_duration
        
        return breakdown
    
    @staticmethod
    def get_default_pricing_for_court(
        db: Session,
        court_id: str
    ) -> Optional[Decimal]:
        """
        Get default (base) pricing for a court.
        Returns the lowest-priority recurring rule price, if available.
        
        Args:
            db: Database session
            court_id: Court UUID
        
        Returns:
            Default price per 30 minutes, or None
        """
        default_rule = db.query(PricingRule).filter(
            PricingRule.court_id == court_id,
            PricingRule.rule_type == 'RECURRING',
            PricingRule.is_active == True,
            PricingRule.is_peak == False
        ).order_by(
            PricingRule.priority.asc()
        ).first()
        
        if default_rule:
            return default_rule.price_per_30_min
        
        return None
