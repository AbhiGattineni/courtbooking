"""
Authentication Routes
Google OAuth login and current user endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

from app.database import get_db
from app.models import User
from app.schemas import GoogleLoginRequest, TokenResponse, UserResponse, UserCreate, UserLogin
from app.auth import verify_google_token, create_access_token, get_current_user, get_password_hash, verify_password
from app.middleware import require_organization

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/google-login", response_model=TokenResponse)
async def google_login(
    request: Request,
    login_request: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Google OAuth login endpoint.
    Flow:
    1. Frontend gets Google ID token
    2. Backend verifies token with Google
    3. Upsert user in database
    4. Return JWT token
    """
    # FIX #1: Get organization from request state for tenant isolation
    organization_id = getattr(request.state, 'organization_id', None)
    
    # Verify Google token
    google_user_info = await verify_google_token(login_request.google_token)
    
    google_id = google_user_info.get('sub')
    email = google_user_info.get('email')
    first_name = google_user_info.get('given_name', '')
    last_name = google_user_info.get('family_name', '')
    
    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google token data"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.google_id == google_id).first()
    
    if not user:
        # Check by email (in case user registered differently)
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            # Update with Google ID
            user.google_id = google_id
        else:
            # Create new user with proper organization isolation
            user = User(
                google_id=google_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                organization_id=organization_id,  # FIX #1: Force tenant isolation
                role="USER",  # Default role
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"New user registered: {email} in org {organization_id}")
    else:
        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"User logged in: {email}")
    
    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    """
    return UserResponse.from_orm(current_user)


@router.post("/register", response_model=TokenResponse)
async def register(
    request: Request,
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register new user with email and password.
    """
    # FIX #1: Get organization from request state for tenant isolation
    organization_id = getattr(request.state, 'organization_id', None)
    
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if not user_in.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required for registration"
        )
    
    # Create new user with proper organization isolation
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        address=user_in.address,
        pincode=user_in.pincode,
        organization_id=organization_id,  # FIX #1: Force tenant isolation
        role=user_in.role if user_in.role else "USER",
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"New user registered via email: {user.email} in org {organization_id}")
    
    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    user_in: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    """
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not user.password_hash or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    logger.info(f"User logged in via email: {user.email}")
    
    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )
