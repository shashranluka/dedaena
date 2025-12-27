"""
Database connection და Session management
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ✅ .env ფაილის ჩატვირთვა
load_dotenv()

# ✅ Database URL მხოლოდ .env-დან (hardcoded default-ების გარეშე)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set in .env for database connection.")

print(f"📊 Database URL: {SQLALCHEMY_DATABASE_URL}")

# ✅ SQLAlchemy Engine (Database connection pool)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

# ✅ Session Factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ✅ Base Class
Base = declarative_base()


# ✅ Dependency Function (FastAPI-ს მიაწვდის Database Session-ს)
def get_db():
    """
    Database Session Dependency
    
    FastAPI-ში გამოიყენება ასე:
    
    @router.get("/users")
    async def get_users(db: Session = Depends(get_db)):
        users = db.query(User).all()
        return users
    
    Yields:
        SessionLocal: Database session
    """
    db = SessionLocal()
    try:
        yield db  # ← FastAPI მიიღებს ამ session-ს
    finally:
        db.close()  # ← request-ის შემდეგ ავტომატურად დაიხურება


# ✅ Database-ის ინიციალიზაცია (ცხრილების შექმნა)
def init_db():
    """
    Database ცხრილების შექმნა
    
    ეშვება მხოლოდ პირველ გაშვებაზე ან migration-ების გარეშე.
    """
    import app.models  # ყველა Model-ის import
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


# ✅ Database კავშირის შემოწმება
def check_db_connection():
    """
    Database-თან კავშირის შემოწმება
    """
    try:
        # Test connection
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False