"""
Shared Dependencies — Reusable functions injected into routes.

FastAPI's Depends() system is like React's Context:
- You define a provider (this file)
- Routes consume it via Depends()
- It automatically runs before the route handler

The most important one here is get_current_user:
  It reads the JWT token from the request header,
  validates it, and returns the user object.
  If the token is invalid, it returns 401 Unauthorized.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.db_models import User

# This tells FastAPI where to look for the token
# The frontend sends it in the header: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Extract and validate the JWT token from the request.
    Returns the User object if valid, raises 401 if not.
    
    Usage in routes:
        @router.get("/me")
        def get_me(user: User = Depends(get_current_user)):
            return user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_raw = payload.get("sub")
        if user_id_raw is None:
            raise credentials_exception
        user_id = int(user_id_raw)
    except (JWTError, ValueError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user
