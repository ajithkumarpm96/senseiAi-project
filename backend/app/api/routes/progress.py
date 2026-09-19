"""
Progress Routes — Learning and chapter progress tracking.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.db_models import User, Project, Chapter

router = APIRouter()


class ChapterProgressItem(BaseModel):
    id: int
    title: str
    order_num: int
    status: str
    progress: float


class ProjectProgressOut(BaseModel):
    project_id: int
    total_chapters: int
    completed_chapters: int
    completion_percentage: float
    chapters: List[ChapterProgressItem]


class UpdateChapterProgressRequest(BaseModel):
    status: str  # 'completed' | 'in_progress' | 'not_started'
    progress: Optional[float] = None


@router.get("/{project_id}", response_model=ProjectProgressOut)
def get_project_progress(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculates overall progress for a study project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    chapters = (
        db.query(Chapter)
        .filter(Chapter.project_id == project_id)
        .order_by(Chapter.order_num.asc())
        .all()
    )

    total = len(chapters)
    completed = sum(1 for c in chapters if c.status == "completed")
    pct = round((completed / total * 100), 1) if total > 0 else 0.0

    items = [
        ChapterProgressItem(
            id=c.id,
            title=c.title,
            order_num=c.order_num,
            status=c.status or "not_started",
            progress=c.progress or 0.0
        )
        for c in chapters
    ]

    return ProjectProgressOut(
        project_id=project_id,
        total_chapters=total,
        completed_chapters=completed,
        completion_percentage=pct,
        chapters=items
    )


@router.put("/{project_id}/chapters/{chapter_id}", response_model=ChapterProgressItem)
def update_chapter_progress(
    project_id: int,
    chapter_id: int,
    data: UpdateChapterProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quick toggle or update for chapter completion status."""
    chapter = db.query(Chapter).filter(
        Chapter.id == chapter_id,
        Chapter.project_id == project_id
    ).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    chapter.status = data.status
    if data.progress is not None:
        chapter.progress = data.progress
    elif data.status == "completed":
        chapter.progress = 1.0
    elif data.status == "not_started":
        chapter.progress = 0.0

    db.commit()
    db.refresh(chapter)

    return ChapterProgressItem(
        id=chapter.id,
        title=chapter.title,
        order_num=chapter.order_num,
        status=chapter.status,
        progress=chapter.progress or 0.0
    )

