# 🏏 Box Cricket Booking System

A comprehensive multi-tenant SaaS platform for box cricket court booking with role-based access control, dynamic pricing, and online payments.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Testing the Application](#testing-the-application)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [User Roles](#user-roles)
- [Deployment](#deployment)

---

## 🎯 Overview

This system enables box cricket facility owners to manage their venues, courts, and bookings through a modern web interface. Each business gets its own subdomain (e.g., `abc.yourdomain.com`) for a fully branded experience.

### Key Features

✅ **Multi-Tenant Architecture** - Subdomain-based organization isolation  
✅ **Role-Based Access** - Super Admin, Manager, and User roles  
✅ **Dynamic Pricing** - Peak/off-peak pricing with rule priority  
✅ **Online Payments** - Razorpay integration for Indian payments  
✅ **PDF Invoicing** - Automated invoice generation with QR codes  
✅ **Real-time Availability** - Smart slot management  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  

---

## 🚀 Quick Start

### For New Users (Clone & Setup)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/courtbooking.git
cd courtbooking

# 2. Setup Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env  # Edit this file with your settings
python -c "from app.database import init_db; init_db()"
python -m uvicorn app.main:app --reload

# 3. Setup Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local  # Edit if needed
npm run dev
```

**That's it!** 🎉

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000

---

## 📁 Project Structure

```
courtbooking/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── routes/            # API endpoints (auth, user, manager, admin)
│   │   │   ├── auth_routes.py          # Authentication & Google OAuth
│   │   │   ├── user_routes.py          # User booking endpoints
│   │   │   ├── manager_routes.py       # Manager dashboard endpoints
│   │   │   └── admin_routes.py         # Super admin endpoints
│   │   ├── services/          # Business logic layer
│   │   │   ├── availability_service.py # Slot generation & checking
│   │   │   ├── booking_service.py      # Booking management
│   │   │   └── pricing_service.py      # Price calculation
│   │   ├── models.py          # SQLAlchemy database models
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # JWT authentication & authorization
│   │   ├── middleware.py      # Subdomain routing middleware
│   │   ├── config.py          # Environment configuration
│   │   ├── database.py        # Database connection & initialization
│   │   └── main.py            # FastAPI application entry point
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
│
├── frontend/                  # Next.js Frontend
│   ├── src/
│   │   ├── app/              # Next.js 14 App Router pages
│   │   │   ├── page.tsx                    # Homepage (venue grid)
│   │   │   ├── HeroSection.tsx             # Hero component
│   │   │   ├── VenuesGrid.tsx              # Venues listing
│   │   │   ├── venues/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx            # Venue detail page
│   │   │   │       └── courts/[courtId]/book/
│   │   │   │           └── page.tsx        # Time slot selection
│   │   │   └── book/
│   │   │       ├── confirm/page.tsx        # Booking confirmation
│   │   │       └── success/page.tsx        # Success page
│   │   ├── components/       # Reusable React components
│   │   │   └── ui/          # UI component library (Button, Card, etc.)
│   │   ├── utils/           # Utility functions
│   │   │   ├── api.ts       # API client with all endpoints
│   │   │   └── organization.ts  # Subdomain utilities
│   │   └── styles/
│   │       └── globals.css  # Global styles & design system
│   ├── package.json         # Node dependencies
│   └── .env.local.example  # Frontend environment variables
│
├── docs/                     # Documentation
│   └── extracted_design.txt # API specification & business rules
│
└── README.md                # This file
```

### Folder Descriptions

| Folder | Purpose |
|--------|---------|
| **backend/app/routes/** | API endpoints organized by user role |
| **backend/app/services/** | Business logic separated from routes |
| **backend/app/models.py** | Database schema (10 tables) |
| **frontend/src/app/** | Pages using Next.js App Router |
| **frontend/src/utils/** | API client & helper functions |
| **frontend/src/components/ui/** | Reusable UI components |
| **docs/** | Technical documentation & API specs |

---

## ⚙️ Setup Instructions

### Prerequisites

- **Python 3.10+** - Backend
- **Node.js 18+** - Frontend
- **MySQL/PostgreSQL** - Database (MySQL recommended)
- **Google OAuth** - For authentication ([Setup Guide](https://console.cloud.google.com))
- **Razorpay Account** - For payments ([Get Keys](https://dashboard.razorpay.com))

### Backend Setup (Detailed)

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   **Edit `.env` file:**
   ```bash
   # Database (MySQL default)
   DATABASE_TYPE=mysql
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   DATABASE_USER=root
   DATABASE_PASSWORD=yourpassword
   DATABASE_NAME=courtbooking

   # JWT Secret (generate random string)
   SECRET_KEY=your-secret-key-here

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Razorpay
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   ```

5. **Initialize Database**
   ```bash
   python -c "from app.database import init_db; init_db()"
   ```

6. **Run Server**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup (Detailed)

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   ```
   
   **Edit `.env.local` file:**
   ```bash
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:8000

   # Development Organization (for local testing)
   NEXT_PUBLIC_DEV_ORG=abc

   # Google OAuth (same as backend)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

   # Razorpay (same as backend)
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

---

## 🧪 Testing the Application

### Test URLs

Once both servers are running, test each page:

#### 1. **Homepage** - Venue Grid
```
http://localhost:3000
```
Shows list of all venues (will be empty until you add data)

#### 2. **Venue Detail** - Courts & Info
```
http://localhost:3000/venues/test-venue-id
```
Shows venue details and available courts

#### 3. **Time Slot Selection** - Timeslot Display
```
http://localhost:3000/venues/test-venue/courts/test-court/book
```
Date selector + time slot grid (mock data enabled for testing)

#### 4. **Booking Confirmation** - Payment
```
http://localhost:3000/book/confirm?court=test-court&price=500
```
3-step progress, price breakdown, payment methods

#### 5. **Success Page** - Booking Confirmed
```
http://localhost:3000/book/success?booking=TEST123
```
Confirmation with booking reference and invoice download

### API Documentation

Test all backend endpoints interactively:
```
http://localhost:8000/docs
```

---

## 🎨 Features

### For Users
- Browse venues in their organization
- View real-time court availability
- Select multiple time slots (30-min increments)
- Pay online via Razorpay
- Download PDF invoices with QR codes
- View booking history

### For Managers
- Configure court availability (weekly + date overrides)
- Set pricing rules (peak/off-peak)
- View bookings and revenue
- Manually manage bookings

### For Super Admin
- Create organizations with subdomains
- Manage all venues and courts
- Assign managers to courts
- View system-wide analytics
- Export data

---

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **MySQL** - Primary database (PostgreSQL supported)
- **Google OAuth 2.0** - Authentication
- **Razorpay** - Payment processing
- **ReportLab** - PDF generation
- **JWT** - Token-based auth

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Inline Styles** - No external CSS dependencies
- **Custom Design System** - Tailored UI components

---

## 👥 User Roles

### 🔴 SUPER_ADMIN
- Create organizations & assign subdomains
- Manage all venues and courts
- Assign managers
- System-wide analytics

### 🟡 MANAGER
- Configure court availability
- Set pricing rules
- Manage bookings for assigned courts
- View revenue reports

### 🟢 USER
- Browse and book courts
- Make online payments
- View booking history
- Download invoices

---

## 🌐 Deployment

### Production Checklist

#### Backend
```bash
cd backend
pip install -r requirements.txt

# Set production environment variables
export DATABASE_URL=your-production-db
export SECRET_KEY=strong-random-secret
export GOOGLE_CLIENT_ID=prod-client-id
export RAZORPAY_KEY_ID=prod-razorpay-key

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

#### Frontend
```bash
cd frontend
npm run build
npm start

# Or deploy to Vercel
vercel --prod
```

---

## 📄 License

This project is proprietary software for box cricket booking management.

---
