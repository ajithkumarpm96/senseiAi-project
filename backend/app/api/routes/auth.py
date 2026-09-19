"""
Auth Routes — Register and Login

How JWT auth works (simplified):
1. User registers (username + password) → password gets hashed and stored
2. User logs in (username + password) → server checks password hash
3. If correct → server creates a JWT token (a signed string containing user ID)
4. Frontend stores the token and sends it with every request
5. Backend validates the token on protected routes

Analogy: JWT is like a concert wristband. You show ID at the gate (login),
get a wristband (token), and then just flash the wristband for every area.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.core.database import get_db
from app.models.db_models import User
from app.models.schemas import UserCreate, UserOut, Token
from app.api.deps import get_current_user

router = APIRouter()

# Password hashing — bcrypt is the industry standard
# It's a one-way hash: you can hash a password, but can't un-hash it
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(user_id: int) -> str:
    """Create a JWT token containing the user's ID (sub must be a string per RFC 7519)"""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    # Check if username already exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Hash the password and create the user
    user = User(
        username=user_data.username,
        password_hash=pwd_context.hash(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)  # Reload from DB to get the auto-generated ID
    return user


@router.post("/login", response_model=Token)
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    """Login and get a JWT token"""
    user = db.query(User).filter(User.username == user_data.username).first()
    
    if not user or not pwd_context.verify(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently logged-in user's info"""
    return current_user

