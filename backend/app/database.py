"""
Database connection and session management.
Supports both PostgreSQL and MySQL based on config.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from typing import Generator
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Create database engine with appropriate configuration
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI.
    Provides a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_database_if_not_exists():
    """Create database if it doesn't exist"""
    from sqlalchemy import text
    from sqlalchemy.engine.url import make_url

    url = make_url(settings.DATABASE_URL)
    database_name = url.database
    
    # Create a URL without the database name to connect to the server
    # We need to replace the database with None, but _replace returns a new URL object
    # For SQLAlchemy 1.4+, use set() or construct a new URL
    # Simpler approach: construct string
    
    # Extract connection info
    drivername = url.drivername
    username = url.username
    password = url.password
    host = url.host
    port = url.port
    
    # Create temporary engine to connect to server (no db)
    # Using 'mysql+pymysql' format
    server_url = f"{drivername}://{username}:{password}@{host}:{port}"
    
    engine = create_engine(server_url)
    
    try:
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SHOW DATABASES LIKE '{database_name}'"))
            if not result.fetchone():
                logger.info(f"Database '{database_name}' does not exist. Creating...")
                # Disable autocommit for DDL if needed, but for CREATE DATABASE usually fine
                # In some drivers/versions we need execution_options(isolation_level="AUTOCOMMIT")
                conn.execution_options(isolation_level="AUTOCOMMIT").execute(text(f"CREATE DATABASE {database_name}"))
                logger.info(f"Database '{database_name}' created successfully")
            else:
                logger.info(f"Database '{database_name}' already exists")
    except Exception as e:
        logger.error(f"Error checking/creating database: {e}")
        # Don't raise here, let the main connection try and fail if it must
        pass
    finally:
        engine.dispose()


def init_db():
    """
    Initialize database - create all tables.
    Called on application startup.
    """
    logger.info(f"Initializing database: {settings.DATABASE_TYPE}")
    
    try:
        # Ensure database exists
        create_database_if_not_exists()

        # Import all models to register them with Base
        from app.models import (
            Organization,
            User,
            Venue,
            Court,
            CourtManager,
            CourtRecurringAvailability,
            CourtDateOverride,
            PricingRule,
            Booking,
            Payment
        )
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def get_db_info():
    """Get database connection information for debugging"""
    return {
        "type": settings.DATABASE_TYPE,
        "host": settings.DATABASE_HOST,
        "port": settings.DATABASE_PORT,
        "database": settings.DATABASE_NAME,
        "url_masked": settings.DATABASE_URL.replace(settings.DATABASE_PASSWORD, "***")
    }
