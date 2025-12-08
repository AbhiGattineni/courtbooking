"""
Application configuration with centralized database settings.
Change DATABASE_TYPE in .env to switch between postgresql and mysql.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings with database abstraction"""
    
    # Database Configuration - SINGLE SOURCE OF TRUTH
    DATABASE_TYPE: str = "postgresql"  # postgresql or mysql
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = "password"
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "box_cricket_db"
    
    # Application
    APP_NAME: str = "Box Cricket Booking System"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    TIMEZONE: str = "Asia/Kolkata"
    
    # Security
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Super Admin
    SUPER_ADMIN_EMAIL: str = "admin@example.com"
    
    @property
    def DATABASE_URL(self) -> str:
        """
        Construct database URL based on DATABASE_TYPE.
        This allows easy switching between PostgreSQL and MySQL.
        """
        if self.DATABASE_TYPE.lower() == "postgresql":
            driver = "postgresql"
            port = self.DATABASE_PORT or 5432
        elif self.DATABASE_TYPE.lower() == "mysql":
            driver = "mysql+pymysql"
            port = self.DATABASE_PORT or 3306
        else:
            raise ValueError(f"Unsupported database type: {self.DATABASE_TYPE}")
        
        return f"{driver}://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{port}/{self.DATABASE_NAME}"
    
    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Print database configuration on startup
print(f"\n{'='*60}")
print(f"Database Configuration:")
print(f"  Type: {settings.DATABASE_TYPE}")
print(f"  URL: {settings.DATABASE_URL.replace(settings.DATABASE_PASSWORD, '***')}")
print(f"{'='*60}\n")
