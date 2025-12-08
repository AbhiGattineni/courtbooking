"""
Database initialization and seed data script
Creates sample organizations, venues, courts, and users for testing
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
from datetime import time, date, timedelta
from decimal import Decimal

from app.database import SessionLocal, init_db
from app.models import (
    Organization, User, Venue, Court, CourtManager,
    CourtRecurringAvailability, PricingRule
)
from app.config import settings


def create_sample_data():
    """Create sample data for testing"""
    db = SessionLocal()
    
    try:
        print("\\n" + "="*60)
        print("Creating Sample Data for Box Cricket Booking System")
        print("="*60 + "\\n")
        
        # 1. Create Organizations
        print("[1/7] Creating organizations...")
        org1 = Organization(
            name="Cricket Hub Mumbai",
            slug="mumbai",
            is_active=True
        )
        org2 = Organization(
            name="Delhi Cricket Arena",
            slug="delhi",
            is_active=True
        )
        db.add_all([org1, org2])
        db.commit()
        db.refresh(org1)
        db.refresh(org2)
        print(f"   [OK] Created {org1.slug}.domainname.com")
        print(f"   [OK] Created {org2.slug}.domainname.com")
        
        # 2. Create Users
        print("\\n[2/7] Creating users...")
        
        # Super Admin
        super_admin = User(
            email=settings.SUPER_ADMIN_EMAIL,
            first_name="Super",
            last_name="Admin",
            role="SUPER_ADMIN",
            is_active=True
        )
        
        # Manager for Mumbai
        manager1 = User(
            organization_id=org1.id,
            email="manager@mumbai.com",
            first_name="Raj",
            last_name="Sharma",
            phone="+91 98765 43210",
            role="MANAGER",
            is_active=True
        )
        
        # Manager for Delhi
        manager2 = User(
            organization_id=org2.id,
            email="manager@delhi.com",
            first_name="Amit",
            last_name="Kumar",
            phone="+91 98765 43211",
            role="MANAGER",
            is_active=True
        )
        
        # Regular users
        user1 = User(
            organization_id=org1.id,
            email="user1@example.com",
            first_name="Virat",
            last_name="Patel",
            role="USER",
            is_active=True
        )
        
        user2 = User(
            organization_id=org2.id,
            email="user2@example.com",
            first_name="Rohit",
            last_name="Singh",
            role="USER",
            is_active=True
        )
        
        db.add_all([super_admin, manager1, manager2, user1, user2])
        db.commit()
        print(f"   [OK] Created Super Admin: {super_admin.email}")
        print(f"   [OK] Created Manager: {manager1.email}")
        print(f"   [OK] Created Manager: {manager2.email}")
        print(f"   [OK] Created Users: {user1.email}, {user2.email}")
        
        # 3. Create Venues
        print("\\n[3/7] Creating venues...")
        venue1 = Venue(
            organization_id=org1.id,
            name="Andheri Sports Complex",
            address_line1="123 Western Express Highway",
            city="Mumbai",
            state="Maharashtra",
            pincode="400053",
            latitude=Decimal("19.1136"),
            longitude=Decimal("72.8697"),
            is_active=True
        )
        
        venue2 = Venue(
            organization_id=org2.id,
            name="Connaught Place Arena",
            address_line1="456 CP Inner Circle",
            city="New Delhi",
            state="Delhi",
            pincode="110001",
            latitude=Decimal("28.6315"),
            longitude=Decimal("77.2167"),
            is_active=True
        )
        
        db.add_all([venue1, venue2])
        db.commit()
        db.refresh(venue1)
        db.refresh(venue2)
        print(f"   [OK] Created venue: {venue1.name}")
        print(f"   [OK] Created venue: {venue2.name}")
        
        # 4. Create Courts
        print("\\n[4/7] Creating courts...")
        court1 = Court(
            venue_id=venue1.id,
            name="Court A - Premium",
            description="Premium indoor court with turf",
            min_booking_minutes=30,
            max_booking_minutes=180,
            is_active=True
        )
        
        court2 = Court(
            venue_id=venue1.id,
            name="Court B - Standard",
            description="Standard outdoor court",
            min_booking_minutes=30,
            max_booking_minutes=120,
            is_active=True
        )
        
        court3 = Court(
            venue_id=venue2.id,
            name="Delhi Court 1",
            description="Indoor air-conditioned court",
            min_booking_minutes=30,
            max_booking_minutes=180,
            is_active=True
        )
        
        db.add_all([court1, court2, court3])
        db.commit()
        db.refresh(court1)
        db.refresh(court2)
        db.refresh(court3)
        print(f"   [OK] Created {court1.name}")
        print(f"   [OK] Created {court2.name}")
        print(f"   [OK] Created {court3.name}")
        
        # 5. Assign Managers to Courts
        print("\\n[5/7] Assigning managers to courts...")
        assignment1 = CourtManager(court_id=court1.id, manager_id=manager1.id)
        assignment2 = CourtManager(court_id=court2.id, manager_id=manager1.id)
        assignment3 = CourtManager(court_id=court3.id, manager_id=manager2.id)
        
        db.add_all([assignment1, assignment2, assignment3])
        db.commit()
        print(f"   [OK] Assigned {manager1.email} to Court A & B")
        print(f"   [OK] Assigned {manager2.email} to Delhi Court 1")
        
        # 6. Create Recurring Availability (Mon-Sun 6:00-22:00)
        print("\\n[6/7] Creating availability schedules...")
        for court in [court1, court2, court3]:
            for day in range(7):  # 0=Monday, 6=Sunday
                availability = CourtRecurringAvailability(
                    court_id=court.id,
                    day_of_week=day,
                    start_time=time(6, 0),
                    end_time=time(22, 0),
                    is_active=True
                )
                db.add(availability)
        db.commit()
        print("   [OK] Set availability Mon-Sun 6:00 AM - 10:00 PM for all courts")
        
        # 7. Create Pricing Rules
        print("\\n[7/7] Creating pricing rules...")
        
        # Court 1 - Premium pricing
        # Base price (off-peak)
        rule1 = PricingRule(
            court_id=court1.id,
            organization_id=org1.id,
            rule_type="RECURRING",
            day_of_week=None,  # All days
            start_time=time(6, 0),
            end_time=time(18, 0),
            price_per_30_min=Decimal("600.00"),
            is_peak=False,
            priority=0
        )
        
        # Peak hours (6 PM - 10 PM)
        for day in range(7):
            rule = PricingRule(
                court_id=court1.id,
                organization_id=org1.id,
                rule_type="RECURRING",
                day_of_week=day,
                start_time=time(18, 0),
                end_time=time(22, 0),
                price_per_30_min=Decimal("1000.00"),
                is_peak=True,
                priority=10
            )
            db.add(rule)
        
        # Court 2 - Standard pricing
        rule2 = PricingRule(
            court_id=court2.id,
            organization_id=org1.id,
            rule_type="RECURRING",
            day_of_week=None,
            start_time=time(6, 0),
            end_time=time(22, 0),
            price_per_30_min=Decimal("400.00"),
            is_peak=False,
            priority=0
        )
        
        # Court 3 - Delhi pricing
        rule3 = PricingRule(
            court_id=court3.id,
            organization_id=org2.id,
            rule_type="RECURRING",
            day_of_week=None,
            start_time=time(6, 0),
            end_time=time(22, 0),
            price_per_30_min=Decimal("500.00"),
            is_peak=False,
            priority=0
        )
        
        db.add_all([rule1, rule2, rule3])
        db.commit()
        print("   [OK] Court A: Rs 600/30min (off-peak), Rs 1000/30min (6PM-10PM)")
        print("   [OK] Court B: Rs 400/30min (all times)")
        print("   [OK] Delhi Court 1: Rs 500/30min (all times)")
        
        print("\\n" + "="*60)
        print("[SUCCESS] Sample data created successfully!")
        print("="*60)
        print("\\nTest with:")
        print(f"- Organization 1: http://localhost:3000?org=mumbai")
        print(f"- Organization 2: http://localhost:3000?org=delhi")
        print(f"\\nSuper Admin: {super_admin.email}")
        print(f"Manager 1: {manager1.email}")
        print(f"Manager 2: {manager2.email}")
        print("\\n")
        
    except Exception as e:
        print(f"\\n[ERROR] Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    try:
        print("Initializing database schema...")
        init_db()
        print("Database schema initialized\\n")
        
        create_sample_data()
    except Exception as e:
        print(f"\\n[ERROR]: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
