# Court Booking Web Application

Court booking application built with **React (frontend)** and **Firebase (Auth, Firestore, Functions)**.  
This README explains how a new developer can clone the repo, configure environment variables, install dependencies, set up functions (without node_modules committed), and run everything locally.

---

## 1. Clone the Repository

git clone https://github.com/<your-org-or-user>/courtbooking.git
cd courtbooking


> Replace the URL above with the actual GitHub repo URL.

---

## 2. Frontend Setup (React)

All frontend code lives in the `frontend` folder.

### 2.1. Go to frontend folder

cd frontend


### 2.2. Create environment file

Create a `.env` file inside `frontend`:

cp .env.example .env


If `.env.example` is not present, create `.env` manually:

src/services/firebase.js will read from these
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

Payment etc (if used later)
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key


Fill these values from your Firebase project’s web app settings.

### 2.3. Install frontend dependencies

From inside `frontend`:

npm install


This installs React, Firebase SDK, React Router, Tailwind, etc.

### 2.4. Run the frontend dev server

npm start


The app will run at:

- http://localhost:3000

---

## 3. Firebase Functions Setup

Functions code lives in the top-level `court-booking-functions` folder.  
Only source files are committed (no `node_modules`), so each new developer must install dependencies locally.

> Make sure you are back at the **project root** before running the following:

cd .. # if you are still inside frontend
cd court-booking-functions # go into functions folder


### 3.1. Install functions dependencies

Inside `court-booking-functions`:

npm install


This installs packages listed in `court-booking-functions/package.json` (e.g., `firebase-functions`, `firebase-admin`, `razorpay`, etc.).

### 3.2. Check / configure Firebase project

Ensure the Firebase project is already linked (normally via `.firebaserc`):

- `.firebaserc` should contain the default project id.
- `firebase.json` should contain hosting / functions config.

If you need to log in:

firebase login


To verify functions locally (optional):

firebase emulators:start --only functions