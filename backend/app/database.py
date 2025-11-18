"""
Database connection და Session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# ✅ Database URL გარემოს ცვლადებიდან
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{os.getenv('POSTGRES_USER', 'postgres')}:"
    f"{os.getenv('POSTGRES_PASSWORD', 'postgres')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:"
    f"{os.getenv('POSTGRES_PORT', '5432')}/"
    f"{os.getenv('POSTGRES_DB', 'dedaena_db')}"
)

print(f"📊 Database URL: {SQLALCHEMY_DATABASE_URL}")

# ✅ SQLAlchemy Engine (Database connection pool)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # ამოწმებს connection-ის სიცოცხლეს
    echo=False           # SQL queries-ის logging (True = დაბეჭდავს ყველა query-ს)
)

# ✅ Session Factory (Database session-ების შესაქმნელად)
SessionLocal = sessionmaker(
    autocommit=False,    # არ შეინახოს ავტომატურად
    autoflush=False,     # არ გააგზავნოს ავტომატურად
    bind=engine
)

# ✅ Base Class (ყველა Model-ის მშობელი კლასი)
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
    print("🔌 Database connection established")
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