import pymysql
from app.config import settings

def create_database():
    print(f"Connecting to MySQL at {settings.DATABASE_HOST}...")
    try:
        # Connect without database selected
        conn = pymysql.connect(
            host=settings.DATABASE_HOST,
            user=settings.DATABASE_USER,
            password=settings.DATABASE_PASSWORD,
            port=settings.DATABASE_PORT
        )
        cursor = conn.cursor()
        
        db_name = settings.DATABASE_NAME
        print(f"Creating database '{db_name}' if it doesn't exist...")
        
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        print("Database created successfully!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()
