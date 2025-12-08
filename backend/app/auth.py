"""
Authentication & Authorization
Google OAuth integration and JWT token management
Role-based access control decorators
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.config import settings
from app.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

# JWT Bearer token scheme
security = HTTPBearer()

# Password hashing
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token.
    
    Args:
        data: Payload to encode (usually {"sub": user_id})
        expires_delta: Token expiration time
    
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Verify and decode JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload
    
    Raises:
        HTTPException: If token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def verify_google_token(token: str) -> dict:
    """
    Verify Google OAuth ID token.
    
    Args:
        token: Google ID token from frontend
    
    Returns:
        Google user info dict with email, name, etc.
    
    Raises:
        HTTPException: If token is invalid
    """
    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # Token is valid
        return idinfo
        
    except Exception as e:
        logger.error(f"Google token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get currently authenticated user from JWT token.
    
    Dependency for protected endpoints.
    Usage: current_user: User = Depends(get_current_user)
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    
    return user


def require_role(allowed_roles: list[str]):
    """
    Role-based access control decorator.
    
    Usage:
        @app.get("/admin/users")
        async def get_users(
            current_user: User = Depends(require_role(["SUPER_ADMIN"]))
        ):
            ...
    
    Args:
        allowed_roles: List of role names allowed to access endpoint
    
    Returns:
        Dependency function that checks user role
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


# Convenience decorators for common role checks
def require_super_admin():
    """Require SUPER_ADMIN role"""
    return require_role(["SUPER_ADMIN"])


def require_manager():
    """Require MANAGER or SUPER_ADMIN role"""
    return require_role(["MANAGER", "SUPER_ADMIN"])


def require_authenticated():
    """Require any authenticated user (USER, MANAGER, or SUPER_ADMIN)"""
    return get_current_user


async def check_manager_court_access(
    user: User,
    court_id: str,
    db: Session
) -> bool:
    """
    Check if manager has access to specific court.
    SUPER_ADMIN has access to all courts.
    
    Args:
        user: Current user
        court_id: Court UUID
        db: Database session
    
    Returns:
        True if user has access, False otherwise
    """
    # Super admin has access to everything
    if user.role == "SUPER_ADMIN":
        return True
    
    # Manager must be assigned to this court
    if user.role == "MANAGER":
        from app.models import CourtManager
        
        assignment = db.query(CourtManager).filter(
            CourtManager.court_id == court_id,
            CourtManager.manager_id == user.id
        ).first()
        
        return assignment is not None
    
    return False
