"""
Database Models — These classes define the database tables.

Each class here becomes a table in SQLite.
Each attribute becomes a column.

Relationships:
  users --(has many)--> projects --(has many)--> chapters
  projects --(has many)--> conversations --(has many)--> messages
  users --(has many)--> token_usage
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    theme = Column(String(20), default="anime")  # marvel | anime | harry_potter
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships — lets you do user.projects to get all projects
    projects = relationship("Project", back_populates="owner")
    token_usage = relationship("TokenUsage", back_populates="user")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)  # e.g. "Learn JavaScript"
    description = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
    
    owner = relationship("User", back_populates="projects")
    chapters = relationship("Chapter", back_populates="project", order_by="Chapter.order_num")
    conversations = relationship("Conversation", back_populates="project")


class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(200), nullable=False)  # e.g. "Closures"
    order_num = Column(Integer, nullable=False)
    progress = Column(Float, default=0.0)  # 0.0 to 1.0
    status = Column(String(20), default="not_started")  # not_started | in_progress | completed
    ai_generated = Column(Boolean, default=False)
    
    project = relationship("Project", back_populates="chapters")
    conversations = relationship("Conversation", back_populates="chapter")


class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True)  # Can be null for general project chat
    mood = Column(String(20), default="focused")  # chill | focused | tired | hyped
    summary = Column(Text, default="")  # LLM-generated summary of older messages
    created_at = Column(DateTime, server_default=func.now())
    
    project = relationship("Project", back_populates="conversations")
    chapter = relationship("Chapter", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user | sensei | challenger | hype | system
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")


class TokenUsage(Base):
    __tablename__ = "token_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD format
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    estimated_cost_usd = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="token_usage")
