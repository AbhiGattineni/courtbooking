"""
Database Models - Complete Entity Definitions
All models follow the specification with proper relationships and constraints.
"""
from sqlalchemy import (
    Column, String, Boolean, Integer, Numeric, Date, Time,
    DateTime, Text, ForeignKey, CheckConstraint, UniqueConstraint,
    SmallInteger, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime, timezone
import uuid

from app.database import Base


# Database-agnostic UUID type
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    
    Uses PostgreSQL's UUID type when available, otherwise uses CHAR(36).
    Stores as string in MySQL, native UUID in PostgreSQL.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value


def get_utc_now():
    """Get current UTC timestamp"""
    return datetime.now(timezone.utc)


class Organization(Base):
    """
    Organizations (Businesses) - Multi-tenant table
    Each organization gets a subdomain (slug)
    Example: abc.domainname.com -> slug = 'abc'
    """
    __tablename__ = "organizations"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # Subdomain
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    venues = relationship("Venue", back_populates="organization", cascade="all, delete-orphan")
    pricing_rules = relationship("PricingRule", back_populates="organization")
    bookings = relationship("Booking", back_populates="organization")
    
    def __repr__(self):
        return f"<Organization(id={self.id}, name={self.name}, slug={self.slug})>"


class User(Base):
    """
    Users - All system users with role-based access
    Roles: SUPER_ADMIN, MANAGER, USER
    """
    __tablename__ = "users"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID, ForeignKey("organizations.id"), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # For email/password login
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    pincode = Column(String(10), nullable=True)
    role = Column(String(20), nullable=False, default="USER")
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    __table_args__ = (
        CheckConstraint(
            "role IN ('SUPER_ADMIN', 'MANAGER', 'USER')",
            name="check_user_role"
        ),
    )
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    managed_courts = relationship("CourtManager", back_populates="manager")
    bookings = relationship("Booking", back_populates="user")
    created_overrides = relationship("CourtDateOverride", back_populates="created_by_user")
    created_pricing_rules = relationship("PricingRule", back_populates="created_by_user")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class Venue(Base):
    """
    Venues - Physical locations within an organization
    Each venue can have multiple courts
    """
    __tablename__ = "venues"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    # Relationships
    organization = relationship("Organization", back_populates="venues")
    courts = relationship("Court", back_populates="venue", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="venue")
    
    def __repr__(self):
        return f"<Venue(id={self.id}, name={self.name}, city={self.city})>"


class Court(Base):
    """
    Courts - Individual booking units within a venue
    Each court has availability, pricing, and managers assigned
    """
    __tablename__ = "courts"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    venue_id = Column(GUID, ForeignKey("venues.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    min_booking_minutes = Column(Integer, nullable=False, default=30)
    max_booking_minutes = Column(Integer, nullable=False, default=180)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    # Relationships
    venue = relationship("Venue", back_populates="courts")
    managers = relationship("CourtManager", back_populates="court", cascade="all, delete-orphan")
    recurring_availability = relationship("CourtRecurringAvailability", back_populates="court", cascade="all, delete-orphan")
    date_overrides = relationship("CourtDateOverride", back_populates="court", cascade="all, delete-orphan")
    pricing_rules = relationship("PricingRule", back_populates="court", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="court")
    
    def __repr__(self):
        return f"<Court(id={self.id}, name={self.name}, venue_id={self.venue_id})>"


class CourtManager(Base):
    """
    Court Managers - Many-to-many relationship
    Managers can be assigned to multiple courts
    """
    __tablename__ = "court_managers"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    court_id = Column(GUID, ForeignKey("courts.id"), nullable=False)
    manager_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('court_id', 'manager_id', name='unique_court_manager'),
    )
    
    # Relationships
    court = relationship("Court", back_populates="managers")
    manager = relationship("User", back_populates="managed_courts")
    
    def __repr__(self):
        return f"<CourtManager(court_id={self.court_id}, manager_id={self.manager_id})>"


class CourtRecurringAvailability(Base):
    """
    Recurring Availability - Weekly schedule for courts
    day_of_week: 0=Monday, 6=Sunday
    """
    __tablename__ = "court_recurring_availability"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    court_id = Column(GUID, ForeignKey("courts.id"), nullable=False)
    day_of_week = Column(SmallInteger, nullable=False)  # 0-6
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    __table_args__ = (
        CheckConstraint('day_of_week >= 0 AND day_of_week <= 6', name='check_day_of_week'),
    )
    
    # Relationships
    court = relationship("Court", back_populates="recurring_availability")
    
    def __repr__(self):
        return f"<CourtRecurringAvailability(court_id={self.court_id}, day={self.day_of_week}, {self.start_time}-{self.end_time})>"


class CourtDateOverride(Base):
    """
    Date Overrides - One-time schedule changes
    override_type: OPEN (special hours), CLOSE (blocked/maintenance/tournament)
    """
    __tablename__ = "court_date_overrides"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    court_id = Column(GUID, ForeignKey("courts.id"), nullable=False)
    date = Column(Date, nullable=False)
    override_type = Column(String(10), nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    reason = Column(String(255), nullable=True)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    __table_args__ = (
        CheckConstraint("override_type IN ('OPEN', 'CLOSE')", name='check_override_type'),
    )
    
    # Relationships
    court = relationship("Court", back_populates="date_overrides")
    created_by_user = relationship("User", back_populates="created_overrides")
    
    def __repr__(self):
        return f"<CourtDateOverride(court_id={self.court_id}, date={self.date}, type={self.override_type})>"


class PricingRule(Base):
    """
    Pricing Rules - Dynamic pricing with peak/off-peak support
    rule_type: RECURRING (weekly pattern), ONE_TIME (specific date)
    Higher priority rules override lower priority
    """
    __tablename__ = "pricing_rules"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    court_id = Column(GUID, ForeignKey("courts.id"), nullable=False)
    organization_id = Column(GUID, ForeignKey("organizations.id"), nullable=False)
    rule_type = Column(String(20), nullable=False)
    day_of_week = Column(SmallInteger, nullable=True)  # For RECURRING rules
    date = Column(Date, nullable=True)  # For ONE_TIME rules
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    price_per_30_min = Column(Numeric(10, 2), nullable=False)
    is_peak = Column(Boolean, default=False)
    priority = Column(Integer, default=0)  # Higher = more priority
    is_active = Column(Boolean, default=True)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    __table_args__ = (
        CheckConstraint("rule_type IN ('RECURRING', 'ONE_TIME')", name='check_rule_type'),
    )
    
    # Relationships
    court = relationship("Court", back_populates="pricing_rules")
    organization = relationship("Organization", back_populates="pricing_rules")
    created_by_user = relationship("User", back_populates="created_pricing_rules")
    
    def __repr__(self):
        return f"<PricingRule(court_id={self.court_id}, type={self.rule_type}, price={self.price_per_30_min})>"


class Booking(Base):
    """
    Bookings - User reservations for court time slots
    Status flow: PENDING_PAYMENT -> CONFIRMED (on payment) or FAILED
    CANCELLED_MANUAL for admin/manager cancellations
    """
    __tablename__ = "bookings"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    court_id = Column(GUID, ForeignKey("courts.id"), nullable=False)
    venue_id = Column(GUID, ForeignKey("venues.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(String(30), nullable=False, default="PENDING_PAYMENT")
    invoice_number = Column(String(50), nullable=True, unique=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING_PAYMENT', 'CONFIRMED', 'FAILED', 'CANCELLED_MANUAL')",
            name='check_booking_status'
        ),
    )
    
    # Relationships
    organization = relationship("Organization", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
    court = relationship("Court", back_populates="bookings")
    venue = relationship("Venue", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Booking(id={self.id}, court_id={self.court_id}, status={self.status}, {self.start_time}-{self.end_time})>"


class Payment(Base):
    """
    Payments - Payment gateway transactions
    Tracks Razorpay order/payment IDs and status
    """
    __tablename__ = "payments"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    booking_id = Column(GUID, ForeignKey("bookings.id"), nullable=False, unique=True)
    gateway = Column(String(50), nullable=True)  # razorpay, cashfree, etc.
    gateway_order_id = Column(String(255), nullable=True, index=True)
    gateway_payment_id = Column(String(255), nullable=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="INR")
    status = Column(String(20), nullable=False, default="CREATED")
    raw_request = Column(JSON, nullable=True)
    raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    __table_args__ = (
        CheckConstraint("status IN ('CREATED', 'SUCCESS', 'FAILED')", name='check_payment_status'),
    )
    
    # Relationships
    booking = relationship("Booking", back_populates="payment")
    
    def __repr__(self):
        return f"<Payment(id={self.id}, booking_id={self.booking_id}, status={self.status}, amount={self.amount})>"
