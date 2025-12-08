"""
Subdomain Middleware - Multi-tenant Routing
Extracts organization from subdomain and attaches to request state
"""
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
import re

from app.database import SessionLocal
from app.models import Organization


class SubdomainMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract subdomain and resolve organization.
    
    Flow:
    1. Extract subdomain from Host header
    2. Query organizations table by slug
    3. Attach organization_id to request.state for downstream use
    
    For localhost development, supports:
    - Query parameter: ?org=abc
    - Custom header: X-Organization-Slug: abc
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get database session
        db: Session = SessionLocal()
        
        try:
            organization = None
            org_slug = None
            
            # Method 1: Extract from Host header (production)
            host = request.headers.get("host", "").lower()
            
            # Remove port if present
            host = host.split(":")[0]
            
            # Match subdomain pattern: abc.domain.com
            subdomain_match = re.match(r"^([a-z0-9-]+)\.", host)
            
            if subdomain_match and subdomain_match.group(1) not in ['www', 'localhost']:
                org_slug = subdomain_match.group(1)
            
            # Method 2: Development fallbacks
            if not org_slug:
                # Try query parameter
                org_slug = request.query_params.get("org")
                
                # Try custom header
                if not org_slug:
                    org_slug = request.headers.get("x-organization-slug")
            
            # Resolve organization from slug
            if org_slug:
                organization = db.query(Organization).filter(
                    Organization.slug == org_slug,
                    Organization.is_active == True
                ).first()
                
                if not organization:
                    # Organization not found
                    request.state.organization_id = None
                    request.state.organization_slug = org_slug
                    request.state.organization_error = f"Organization '{org_slug}' not found"
                else:
                    # Organization found
                    request.state.organization_id = organization.id
                    request.state.organization_slug = organization.slug
                    request.state.organization = organization
            else:
                # No organization specified (admin panel, public routes)
                request.state.organization_id = None
                request.state.organization_slug = None
            
            # Continue processing request
            response = await call_next(request)
            return response
            
        finally:
            db.close()


def get_organization_id(request: Request) -> Optional[str]:
    """
    Get organization ID from request state.
    Returns None if no organization context.
    """
    return getattr(request.state, "organization_id", None)


def require_organization(request: Request) -> str:
    """
    Require organization context.
    Raises 400 if no organization found.
    
    Usage in endpoints:
        org_id = require_organization(request)
    """
    org_id = get_organization_id(request)
    
    if not org_id:
        error_msg = getattr(request.state, "organization_error", "Organization not specified")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    return org_id
