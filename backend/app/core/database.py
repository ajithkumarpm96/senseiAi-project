"""
Database Connection — SQLAlchemy setup for SQLite.

SQLAlchemy is Python's most popular ORM (Object-Relational Mapper).
Think of it like this:
  - A Python class = a database table
  - A class instance = a row in that table
  - Class attributes = columns

So instead of writing raw SQL like:
  INSERT INTO users (username, password) VALUES ('ajith', 'hash123')

You write Python:
  user = User(username='ajith', password_hash='hash123')
  db.add(user)
  db.commit()
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Format database URL properly for SQLAlchemy
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    # SQLAlchemy 2.0 requires postgresql:// instead of postgres://
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Configure engine arguments based on DB type
engine_kwargs = {
    "echo": settings.DEBUG,
}

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL (Neon / Supabase) connection resilience
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(db_url, **engine_kwargs)

# SessionLocal is a factory that creates database sessions
# A session is like a "conversation" with the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class for all our database models
Base = declarative_base()


def create_tables():
    """Create all database tables (if they don't already exist)"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """
    Dependency that provides a database session.
    
    This is used in FastAPI routes like this:
        @router.get("/users")
        def get_users(db: Session = Depends(get_db)):
            ...
    
    The 'yield' ensures the session is properly closed after the request.
    Think of it like a try/finally block.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
