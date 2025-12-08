import os
import psycopg2
from dotenv import load_dotenv

# ✅ .env ფაილის ჩატვირთვა
load_dotenv()

# Database configuration (ყველა მნიშვნელობა .env-დან, default-ების გარეშე)
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")


def get_db_connection():
    """Get a database connection"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        return conn
    except psycopg2.Error as e:
        print(f"❌ Database connection error: {e}")
        raise