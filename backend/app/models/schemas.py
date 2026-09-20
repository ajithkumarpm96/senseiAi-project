"""
Pydantic Schemas — Define the shape of API request and response data.

Pydantic is like TypeScript interfaces for Python.
When a request comes in, FastAPI automatically validates it against these schemas.
If the data doesn't match, it returns a 422 error (like a type error in TypeScript).

Naming convention:
  XxxCreate  = data needed to CREATE something (incoming request)
  XxxUpdate  = data needed to UPDATE something (incoming request)
  XxxOut     = data sent back to the frontend (outgoing response)
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ---- Auth ----

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    theme: str
    created_at: datetime
    
    class Config:
        from_attributes = True  # Allows converting SQLAlchemy models to Pydantic

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Projects ----

class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    difficulty_level: Optional[str] = "beginner"

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty_level: Optional[str] = None

class ProjectOut(BaseModel):
    id: int
    title: str
    description: str
    difficulty_level: Optional[str] = "beginner"
    created_at: datetime
    
    class Config:
        from_attributes = True


# ---- Chapters ----

class ChapterCreate(BaseModel):
    title: str
    order_num: int

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    order_num: Optional[int] = None
    status: Optional[str] = None

class ChapterOut(BaseModel):
    id: int
    title: str
    order_num: int
    progress: float
    status: str
    ai_generated: bool
    
    class Config:
        from_attributes = True


# ---- Chat ----

class ChatMessage(BaseModel):
    message: str
    mood: str = "focused"  # chill | focused | tired | hyped
    conversation_id: Optional[int] = None
    chapter_id: Optional[int] = None

class ChatStreamRequest(BaseModel):
    message: str
    project_id: int
    chapter_id: Optional[int] = None
    mood: str = "focused"
    theme: Optional[str] = None
    study_mode: str = "chill"  # "chill" | "serious"
    difficulty_level: Optional[str] = "beginner"  # "beginner" | "intermediate" | "advanced"
    target_agent: Optional[str] = None  # "sensei" | "challenger" | "hype"

class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ---- Admin ----

class TokenUsageOut(BaseModel):
    date: str
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    
    class Config:
        from_attributes = True

class KillSwitchToggle(BaseModel):
    active: bool
