"""
Pydantic Schemas for Request/Response Validation
Organized by entity and operation type
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date, time
from decimal import Decimal
import uuid


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    """Base user fields"""
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None


class UserCreate(UserBase):
    """User creation"""
    password: Optional[str] = None  # Optional for Google login, required for Email signup
    organization_id: Optional[uuid.UUID] = None
    role: str = "USER"


class UserLogin(BaseModel):
    """User login with email/password"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User update"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None


class UserResponse(UserBase):
    """User response"""
    id: uuid.UUID
    organization_id: Optional[uuid.UUID]
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
        
# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class GoogleLoginRequest(BaseModel):
    """Google OAuth login request"""
    google_token: str = Field(..., description="Google ID token from frontend")


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ============================================================================
# ORGANIZATION SCHEMAS
# ============================================================================

class OrganizationBase(BaseModel):
    """Base organization fields"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9-]+$")


class OrganizationCreate(OrganizationBase):
    """Organization creation"""
    pass


class OrganizationUpdate(BaseModel):
    """Organization update"""
    name: Optional[str] = None
    is_active: Optional[bool] = None


class OrganizationResponse(OrganizationBase):
    """Organization response"""
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# VENUE SCHEMAS
# ============================================================================

class VenueBase(BaseModel):
    """Base venue fields"""
    name: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None


class VenueCreate(VenueBase):
    """Venue creation"""
    organization_id: uuid.UUID


class VenueUpdate(BaseModel):
    """Venue update"""
    name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    is_active: Optional[bool] = None


class VenueResponse(VenueBase):
    """Venue response"""
    id: uuid.UUID
    organization_id: uuid.UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# COURT SCHEMAS
# ============================================================================

class CourtBase(BaseModel):
    """Base court fields"""
    name: str
    description: Optional[str] = None
    min_booking_minutes: int = 30
    max_booking_minutes: int = 180


class CourtCreate(CourtBase):
    """Court creation"""
    venue_id: uuid.UUID
    manager_ids: Optional[List[uuid.UUID]] = []


class CourtUpdate(BaseModel):
    """Court update"""
    name: Optional[str] = None
    description: Optional[str] = None
    min_booking_minutes: Optional[int] = None
    max_booking_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class CourtResponse(CourtBase):
    """Court response"""
    id: uuid.UUID
    venue_id: uuid.UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# AVAILABILITY SCHEMAS
# ============================================================================

class RecurringAvailabilityCreate(BaseModel):
    """Recurring availability creation"""
    court_id: uuid.UUID
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time


class RecurringAvailabilityResponse(BaseModel):
    """Recurring availability response"""
    id: uuid.UUID
    court_id: uuid.UUID
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool
    
    class Config:
        from_attributes = True


class DateOverrideCreate(BaseModel):
    """Date override creation"""
    court_id: uuid.UUID
    date: date
    override_type: str = Field(..., pattern="^(OPEN|CLOSE)$")
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None


class DateOverrideResponse(BaseModel):
    """Date override response"""
    id: uuid.UUID
    court_id: uuid.UUID
    date: date
    override_type: str
    start_time: Optional[time]
    end_time: Optional[time]
    reason: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# PRICING SCHEMAS
# ============================================================================

class PricingRuleCreate(BaseModel):
    """Pricing rule creation"""
    court_id: uuid.UUID
    rule_type: str = Field(..., pattern="^(RECURRING|ONE_TIME)$")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    date: Optional[date] = None
    start_time: time
    end_time: time
    price_per_30_min: Decimal = Field(..., gt=0)
    is_peak: bool = False
    priority: int = 0


class PricingRuleUpdate(BaseModel):
    """Pricing rule update"""
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    price_per_30_min: Optional[Decimal] = None
    is_peak: Optional[bool] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class PricingRuleResponse(BaseModel):
    """Pricing rule response"""
    id: uuid.UUID
    court_id: uuid.UUID
    organization_id: uuid.UUID
    rule_type: str
    day_of_week: Optional[int]
    date: Optional[date]
    start_time: time
    end_time: time
    price_per_30_min: Decimal
    is_peak: bool
    priority: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# BOOKING SCHEMAS
# ============================================================================

class BookingInitiate(BaseModel):
    """Initiate booking request"""
    court_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None


class BookingCreate(BookingInitiate):
    """Booking creation"""
    pass


class BookingResponse(BaseModel):
    """Booking response"""
    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    court_id: uuid.UUID
    venue_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    total_price: Decimal
    status: str
    invoice_number: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BookingWithDetails(BookingResponse):
    """Booking with related entity details"""
    court_name: Optional[str] = None
    venue_name: Optional[str] = None
    user_name: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    """Update booking status"""
    status: str = Field(..., pattern="^(CONFIRMED|FAILED|CANCELLED_MANUAL)$")
    notes: Optional[str] = None


# ============================================================================
# PAYMENT SCHEMAS
# ============================================================================

class PaymentCreate(BaseModel):
    """Create payment order"""
    booking_id: uuid.UUID


class PaymentResponse(BaseModel):
    """Payment response"""
    id: uuid.UUID
    booking_id: uuid.UUID
    gateway: Optional[str]
    gateway_order_id: Optional[str]
    gateway_payment_id: Optional[str]
    amount: Decimal
    currency: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class RazorpayOrderResponse(BaseModel):
    """Razorpay order creation response"""
    order_id: str
    amount: int  # Paise
    currency: str
    key_id: str


class PaymentWebhookData(BaseModel):
    """Payment webhook payload"""
    event: str
    payload: dict


# ============================================================================
# AVAILABILITY QUERY SCHEMAS
# ============================================================================

class AvailabilitySlot(BaseModel):
    """Available time slot"""
    start_time: datetime
    end_time: datetime
    price_per_30_min: Decimal
    is_peak: bool


class AvailabilityResponse(BaseModel):
    """Availability for a specific date"""
    date: date
    court_id: uuid.UUID
    slots: List[AvailabilitySlot]


# ============================================================================
# DASHBOARD SCHEMAS
# ============================================================================

class ManagerDashboardMetrics(BaseModel):
    """Manager dashboard metrics"""
    total_courts: int
    total_bookings_today: int
    total_revenue_today: Decimal
    total_revenue_month: Decimal
    pending_bookings: int
    confirmed_bookings_today: int


class AdminDashboardMetrics(BaseModel):
    """Admin dashboard metrics"""
    total_organizations: int
    total_venues: int
    total_courts: int
    total_bookings: int
    total_revenue: Decimal
    active_users: int


# ============================================================================
# ALIASES FOR ROUTE COMPATIBILITY
# ============================================================================

# Aliases for availability schemas
AvailabilityCreate = RecurringAvailabilityCreate
OverrideCreate = DateOverrideCreate

# Additional schemas for admin/manager operations
class UserRoleUpdate(BaseModel):
    """Update user role"""
    role: str = Field(..., pattern="^(SUPER_ADMIN|MANAGER|USER)$")


class ManagerAssignment(BaseModel):
    """Assign manager to courts"""
    manager_id: uuid.UUID
    court_ids: List[uuid.UUID]
