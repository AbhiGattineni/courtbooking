# Court Booking System - Complete Project Plan

## 📊 System Overview

A comprehensive court booking platform enabling users to book sports facilities with real-time availability, secure payments, and role-based management.

## 🎯 Core Features

### 1. Public Access (No Login Required)
- Browse all active courts
- Filter by sport type (Cricket, Football, Tennis, Badminton, Basketball)
- View court details, pricing, and facilities
- See real-time slot availability
- Login required only when clicking "Book Now"

### 2. User Features (Logged In)
- Book available 30-minute time slots
- Pay via Indian payment gateways (Razorpay/PhonePe)
- View booking history
- Cancel bookings (with refund)
- Manage profile

### 3. Manager Features
- Dashboard for assigned courts only
- Set operating hours for each day of week
- Add special dates (holidays, maintenance)
- View bookings for managed courts
- Generate revenue reports

### 4. Super Admin Features
- Full system dashboard
- CRUD operations on all courts
- Assign/remove managers from courts
- Promote users to manager role
- View system-wide analytics
- Access all booking logs
- Manage user accounts

## 🗄️ Database Schema

### Collections Structure

#### users/
{
userId: "auto-generated",
email: "user@example.com",
displayName: "John Doe",
phone: "+919876543210",
role: "user", // 'user', 'manager', 'superadmin'
managedCourtIds: [], // For managers only
createdAt: Timestamp,
updatedAt: Timestamp
}

#### courts/
{
courtId: "auto-generated",
name: "City Cricket Ground",
sportType: "cricket", // cricket, football, tennis, badminton, basketball
location: "Downtown, Mumbai",
address: "123 Main St, Mumbai",
pricePerSlot: 500, // in INR
slotDuration: 30, // in minutes
images: ["url1", "url2"],
facilities: ["Floodlights", "Parking", "Washroom", "Locker Room"],
managerIds: ["userId1", "userId2"], // Multiple managers supported
isActive: true,
createdAt: Timestamp,
updatedAt: Timestamp
}

#### schedules/
{
courtId: "same-as-court-id", // Document ID
operatingHours: {
monday: { open: "06:00", close: "22:00", isOpen: true },
tuesday: { open: "06:00", close: "22:00", isOpen: true },
wednesday: { open: "06:00", close: "22:00", isOpen: true },
thursday: { open: "06:00", close: "22:00", isOpen: true },
friday: { open: "06:00", close: "22:00", isOpen: true },
saturday: { open: "07:00", close: "23:00", isOpen: true },
sunday: { open: "08:00", close: "21:00", isOpen: true }
},
specialDates: [
{
date: "2025-12-25",
isClosed: true,
reason: "Christmas Holiday",
hours: null // or custom hours if partially open
}
],
updatedAt: Timestamp
}


#### bookings/
{
bookingId: "auto-generated",
userId: "user-id",
userName: "John Doe",
userEmail: "user@example.com",
courtId: "court-id",
courtName: "City Cricket Ground",
sportType: "cricket",
date: "2025-12-15", // YYYY-MM-DD
startTime: "10:00", // HH:MM
endTime: "10:30", // HH:MM
duration: 30, // minutes
amount: 500, // INR
paymentStatus: "pending", // pending, completed, failed, refunded
paymentId: "razorpay_payment_id",
razorpayOrderId: "order_id",
bookingStatus: "reserved", // reserved, pending, confirmed, cancelled, completed
cancelReason: null,
createdAt: Timestamp,
updatedAt: Timestamp,
cancelledAt: Timestamp // if cancelled
}


#### bookingLogs/
{
logId: "auto-generated",
bookingId: "related-booking-id",
courtId: "court-id",
userId: "user-id",
action: "slot_reserved", // created, slot_reserved, payment_initiated,
// payment_completed, payment_failed, cancelled,
// refunded, slot_changed, reservation_expired
performedBy: "user-id", // Who performed the action
performedByRole: "user", // user, manager, superadmin, system
oldData: {}, // Previous state (for updates)
newData: {}, // New state
reason: "User cancelled booking", // For cancellations
timestamp: Timestamp,
metadata: {
ipAddress: "192.168.1.1",
userAgent: "Mozilla/5.0...",
paymentMethod: "UPI"
}
}

## 🔐 Security & Access Control

### Firestore Security Rules

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {

// Helper functions
function isAuthenticated() {
  return request.auth != null;
}

function hasRole(role) {
  return isAuthenticated() && request.auth.token.role == role;
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

function isManager() {
  return hasRole('manager');
}

function isSuperAdmin() {
  return hasRole('superadmin');
}

function managesThisCourt(courtId) {
  return isManager() && 
    get(/databases/$(database)/documents/users/$(request.auth.uid))
      .data.managedCourtIds.hasAny([courtId]);
}

// Users collection
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && isOwner(userId);
  allow update: if isOwner(userId) && 
    !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['role', 'managedCourtIds']) 
    || isSuperAdmin();
  allow delete: if isSuperAdmin();
}

// Courts collection
match /courts/{courtId} {
  allow read: if true; // Public read
  allow create: if isSuperAdmin();
  allow update: if isSuperAdmin() || managesThisCourt(courtId);
  allow delete: if isSuperAdmin();
}

// Schedules collection
match /schedules/{courtId} {
  allow read: if true; // Public read
  allow write: if isSuperAdmin() || managesThisCourt(courtId);
}

// Bookings collection
match /bookings/{bookingId} {
  allow read: if isAuthenticated() && (
    isOwner(resource.data.userId) ||
    managesThisCourt(resource.data.courtId) ||
    isSuperAdmin()
  );
  
  allow create: if isAuthenticated() && 
    isOwner(request.resource.data.userId) &&
    request.resource.data.bookingStatus == 'reserved';
  
  allow update: if isAuthenticated() && (
    isOwner(resource.data.userId) ||
    managesThisCourt(resource.data.courtId) ||
    isSuperAdmin()
  );
  
  allow delete: if isSuperAdmin();
}

// Booking logs
match /bookingLogs/{logId} {
  allow read: if isAuthenticated() && (
    isOwner(resource.data.userId) ||
    managesThisCourt(resource.data.courtId) ||
    isSuperAdmin()
  );
  allow write: if false; // Only Cloud Functions can write
}
}
}

## ⚡ Slot Availability Logic

### Real-Time Booking Flow

User selects court and date
↓

System generates all possible slots (operating hours ÷ 30 min)
↓

Fetch all bookings for that court + date
↓

Filter bookings:

Status = 'confirmed' → BLOCK

Status = 'reserved' + created < 5 min ago → BLOCK

Status = 'pending' + created < 10 min ago → BLOCK

Status = 'cancelled' → IGNORE
↓

Display available slots to user
↓

User clicks slot → Create 'reserved' booking (5-min hold)
↓

Redirect to payment → Update to 'pending' (10-min total)
↓
8a. Payment Success → Update to 'confirmed' (permanent block)
8b. Payment Failed/Timeout → Update to 'cancelled' (release slot)


### Preventing Double-Booking

**Client-Side**: Refresh available slots every 10 seconds

**Server-Side**: 
- Check availability before creating reservation
- Use Firestore transactions for atomic operations
- Cloud Function auto-expires reserved/pending bookings

## 🔧 Cloud Functions (Backend Logic)

### 1. Set User Role on Signup
exports.setUserRole = functions.auth.user().onCreate(async (user) => {
await admin.auth().setCustomUserClaims(user.uid, { role: 'user' });
await admin.firestore().collection('users').doc(user.uid).set({
email: user.email,
role: 'user',
createdAt: admin.firestore.FieldValue.serverTimestamp()
});
});

text

### 2. Clean Up Expired Reservations
exports.cleanupExpiredReservations = functions.pubsub
.schedule('every 5 minutes')
.onRun(async () => {
const fiveMinutesAgo = admin.firestore.Timestamp.fromMillis(
Date.now() - 5 * 60 * 1000
);

text
const expired = await admin.firestore()
  .collection('bookings')
  .where('bookingStatus', '==', 'reserved')
  .where('createdAt', '<', fiveMinutesAgo)
  .get();

const batch = admin.firestore().batch();

expired.forEach(doc => {
  batch.update(doc.ref, {
    bookingStatus: 'cancelled',
    cancelReason: 'Reservation expired'
  });
});

await batch.commit();
});


### 3. Payment Verification
exports.verifyPayment = functions.https.onCall(async (data, context) => {
// Verify Razorpay signature
const isValid = verifyRazorpaySignature(data);

if (isValid) {
await admin.firestore()
.collection('bookings')
.doc(data.bookingId)
.update({
bookingStatus: 'confirmed',
paymentStatus: 'completed',
paymentId: data.paymentId
});

return { success: true };
}

throw new functions.https.HttpsError('invalid-argument', 'Invalid payment');
});


### 4. Promote User to Manager
exports.promoteToManager = functions.https.onCall(async (data, context) => {
// Check if caller is superadmin
if (context.auth.token.role !== 'superadmin') {
throw new functions.https.HttpsError('permission-denied');
}

await admin.auth().setCustomUserClaims(data.userId, {
role: data.role
});

await admin.firestore()
.collection('users')
.doc(data.userId)
.update({ role: data.role });

return { success: true };
});


## 🎨 UI/UX Design Principles

### Color Scheme (Light Mode)
- Background: `#F3F4F6` (gray-100)
- Cards: `#FFFFFF` (white)
- Primary: `#2563EB` (blue-600)
- Accent: `#8B5CF6` (purple-600)
- Text: `#1F2937` (gray-800)
- Muted Text: `#6B7280` (gray-500)

### Component Hierarchy
HomePage
├── Navbar (sticky)
├── HeroSection
└── CourtsList
├── SportTypeFilter
└── CourtCard[]

CourtDetailsPage
├── Navbar
├── CourtInfo
├── DatePicker
└── SlotSelector
└── SlotButton[]

UserDashboard
├── Sidebar
├── MyBookings
└── BookingCard[]

ManagerDashboard
├── Sidebar
├── MyCourts
├── ScheduleManager
└── BookingsList

AdminDashboard
├── Sidebar
├── StatsCards
├── CourtManagement
├── ManagerAssignment
└── SystemLogs

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px (1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3 columns)

### Mobile-First Approach
- Stack elements vertically on mobile
- Larger touch targets (min 44px)
- Simplified navigation
- Bottom navigation bar for mobile

## 🚀 Development Phases

### Phase 1: Foundation
- Firebase project setup
- Authentication with custom claims
- Firestore database structure
- Slot availability service
- Date/time utilities

### Phase 2: Public UI
- Homepage with hero section
- Courts listing with filters
- Court details page
- Sport type filtering
- Responsive design

###  Phase 3: User Booking
- Date picker component
- Slot selector with real-time updates
- Booking form
- Booking confirmation
- My bookings page

### Phase 4: Manager Dashboard
- Manager layout
- Schedule management UI
- Set operating hours
- Add special dates
- View bookings calendar
- Revenue reports

### Phase 5: Admin Dashboard
- Admin layout
- Courts CRUD interface
- Manager assignment UI
- User role management
- System analytics
- Booking logs viewer

### Phase 6: Cloud Functions
- User role assignment
- Auto-expire reservations
- Booking validation
- Email notifications

### Phase 7: Payment Integration
- Payment gateway setup (Razorpay/PhonePe)
- Payment verification Cloud Function
- Payment status handling (webhooks)
- Invoice generation

### Phase 8: Testing & Polish
- Unit tests for services
- Integration tests
- Security testing
- Performance optimization
- Bug fixes

### Phase 9: Deployment
- Production Firestore rules
- Environment configuration
- Firebase Hosting deployment
- Documentation
- Launch

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] User can sign up and login
- [ ] Public pages load without login
- [ ] Slots show correct availability
- [ ] Booking creates correct status
- [ ] Payment flow works end-to-end
- [ ] Manager can set schedules
- [ ] Admin can manage courts
- [ ] Roles enforce permissions

### Automated Tests (Future)
- Jest for utility functions
- React Testing Library for components
- Cypress for E2E testing

## 📊 Performance Targets

- Page Load: < 2 seconds
- Slot Availability Query: < 500ms
- Real-time Updates: < 1 second
- Payment Processing: < 5 seconds