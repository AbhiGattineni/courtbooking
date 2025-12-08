# Box Cricket Booking System - Setup Script
# Run this script to set up the project quickly

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "Box Cricket Booking System - Quick Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if Python is installed
Write-Host "`n[1/6] Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
Write-Host "`n[2/6] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Setup Backend
Write-Host "`n[3/6] Setting up backend..." -ForegroundColor Yellow
Set-Location backend

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "⚠ Please edit backend/.env with your database and API credentials" -ForegroundColor Yellow
}

Set-Location ..

# Setup Frontend
Write-Host "`n[4/6] Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

# Create .env.local if not exists
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file from template..." -ForegroundColor Cyan
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "⚠ Please edit frontend/.env.local with your API URL and OAuth credentials" -ForegroundColor Yellow
}

Set-Location ..

# Summary
Write-Host "`n[5/6] Setup Summary" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure PostgreSQL database" -ForegroundColor White
Write-Host "2. Edit backend/.env with database credentials" -ForegroundColor White
Write-Host "3. Edit frontend/.env.local with API URL" -ForegroundColor White
Write-Host "4. Initialize database:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python -c 'from app.database import init_db; init_db()'" -ForegroundColor Gray
Write-Host "5. Run backend:" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host "6. Run frontend (new terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host "`n[6/6] Setup complete! 🎉" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
