"""
Project Routes — Create, Read, Update, Delete study projects.

A "project" is a study subject like "Learn JavaScript" or "Master Python".
Each project has chapters that the AI generates (or the user creates manually).
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.db_models import User, Project, Chapter, Conversation, Message
from app.models.schemas import ProjectCreate, ProjectUpdate, ProjectOut, ChapterCreate, ChapterUpdate, ChapterOut

router = APIRouter()


def migrate_unassigned_conversations_to_chapter(project_id: int, target_chapter_id: int, db: Session):
    """
    Migrates any general/unassigned conversations (chapter_id IS NULL) for a project
    to the specified chapter (typically Chapter 1) so chat history is never lost.
    """
    unassigned_convs = (
        db.query(Conversation)
        .filter(Conversation.project_id == project_id, Conversation.chapter_id.is_(None))
        .all()
    )
    if not unassigned_convs:
        return

    chapter_conv = (
        db.query(Conversation)
        .filter(Conversation.project_id == project_id, Conversation.chapter_id == target_chapter_id)
        .first()
    )

    for u_conv in unassigned_convs:
        if not chapter_conv:
            u_conv.chapter_id = target_chapter_id
            chapter_conv = u_conv
        else:
            for msg in u_conv.messages:
                msg.conversation_id = chapter_conv.id
            db.delete(u_conv)
    db.commit()


@router.get("/", response_model=List[ProjectOut])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects for the current user"""
    return db.query(Project).filter(Project.user_id == current_user.id).all()


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new study project"""
    project = Project(
        user_id=current_user.id,
        title=project_data.title,
        description=project_data.description,
        difficulty_level=project_data.difficulty_level or "beginner"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a project's title or description"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_data.title is not None:
        project.title = project_data.title
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.difficulty_level is not None:
        project.difficulty_level = project_data.difficulty_level
    
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project and all its chapters, conversations, and messages"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()


def reorder_project_chapters(project_id: int, db: Session):
    """Ensures all chapters for a project have strict sequential order_num (1, 2, 3... N)."""
    chapters = (
        db.query(Chapter)
        .filter(Chapter.project_id == project_id)
        .order_by(Chapter.order_num.asc(), Chapter.id.asc())
        .all()
    )
    for index, chapter in enumerate(chapters, start=1):
        chapter.order_num = index
    db.commit()


# ---- Chapter routes (nested under projects) ----

@router.get("/{project_id}/chapters", response_model=List[ChapterOut])
def list_chapters(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chapters for a project, ordered strictly by order_num (1..N)"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reorder_project_chapters(project_id, db)
    return (
        db.query(Chapter)
        .filter(Chapter.project_id == project_id)
        .order_by(Chapter.order_num.asc(), Chapter.id.asc())
        .all()
    )


@router.post("/{project_id}/chapters", response_model=ChapterOut, status_code=status.HTTP_201_CREATED)
def create_chapter(
    project_id: int,
    chapter_data: ChapterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually add a chapter to a project with sanitized title and sequential order"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    from app.agents.tools.chapters import clean_chapter_title
    cleaned_title = clean_chapter_title(chapter_data.title) or chapter_data.title.strip()

    count = db.query(Chapter).filter(Chapter.project_id == project_id).count()
    chapter = Chapter(
        project_id=project_id,
        title=cleaned_title,
        order_num=count + 1,
        ai_generated=False
    )
    db.add(chapter)
    db.commit()
    reorder_project_chapters(project_id, db)
    db.refresh(chapter)

    # If this is the first chapter created, migrate any past unassigned messages to it
    if count == 0:
        migrate_unassigned_conversations_to_chapter(project_id, chapter.id, db)

    return chapter


@router.post("/{project_id}/generate-chapters")
async def generate_project_chapters(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invokes the AI Chapter Architect to generate or enhance syllabus.
    - If project has NO chapters: inserts the verified core chapters sequentially (1..N) and migrates any chat history.
    - If project ALREADY has chapters: preserves them completely, and puts new recommended
      topics into optional electives so the user can choose to add them.
    """
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    from app.agents.tools.chapters import generate_chapters_for_project, clean_chapter_title
    result = await generate_chapters_for_project(
        topic_title=project.title,
        topic_description=project.description,
        theme=current_user.theme or "anime",
        difficulty_level=project.difficulty_level or "beginner"
    )

    core_titles = [clean_chapter_title(t) for t in result.get("core_chapters", []) if clean_chapter_title(t)]
    optional_titles = [clean_chapter_title(t) for t in result.get("optional_chapters", []) if clean_chapter_title(t)]

    existing_chapters = (
        db.query(Chapter)
        .filter(Chapter.project_id == project_id)
        .order_by(Chapter.order_num.asc(), Chapter.id.asc())
        .all()
    )

    if existing_chapters:
        # User already has chapters! Preserve existing work and progress.
        # Sanitize and reorder existing chapters to 1..N
        for ch in existing_chapters:
            ch.title = clean_chapter_title(ch.title)
        db.commit()
        reorder_project_chapters(project_id, db)

        existing_titles_set = {ch.title.strip().lower() for ch in existing_chapters}

        # Any core or optional topics from the new AI generation that aren't yet in existing chapters
        # become available under "Optional Electives"
        additional_suggestions = []
        for t in core_titles + optional_titles:
            if t.lower() not in existing_titles_set and t.lower() not in [s.lower() for s in additional_suggestions]:
                additional_suggestions.append(t)

        refreshed_chapters = (
            db.query(Chapter)
            .filter(Chapter.project_id == project_id)
            .order_by(Chapter.order_num.asc())
            .all()
        )

        return {
            "core_chapters": [ChapterOut.model_validate(c) for c in refreshed_chapters],
            "optional_chapters": additional_suggestions
        }

    # Brand new project with no chapters: insert generated core chapters cleanly 1..N
    created_chapters = []
    for idx, title in enumerate(core_titles, start=1):
        chap = Chapter(
            project_id=project_id,
            title=title,
            order_num=idx,
            ai_generated=True
        )
        db.add(chap)
        created_chapters.append(chap)

    db.commit()
    for c in created_chapters:
        db.refresh(c)

    # Seamlessly migrate any existing unassigned messages to Chapter 1 so no chat history is lost
    if created_chapters:
        migrate_unassigned_conversations_to_chapter(project_id, created_chapters[0].id, db)

    return {
        "core_chapters": [ChapterOut.model_validate(c) for c in created_chapters],
        "optional_chapters": optional_titles
    }


@router.put("/{project_id}/chapters/{chapter_id}", response_model=ChapterOut)
def update_chapter(
    project_id: int,
    chapter_id: int,
    chapter_data: ChapterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a chapter's title, order, or status"""
    chapter = db.query(Chapter).filter(
        Chapter.id == chapter_id,
        Chapter.project_id == project_id
    ).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    from app.agents.tools.chapters import clean_chapter_title
    if chapter_data.title is not None:
        chapter.title = clean_chapter_title(chapter_data.title) or chapter_data.title.strip()
    if chapter_data.order_num is not None:
        chapter.order_num = chapter_data.order_num
    if chapter_data.status is not None:
        chapter.status = chapter_data.status
    
    db.commit()
    reorder_project_chapters(project_id, db)
    db.refresh(chapter)
    return chapter


@router.delete("/{project_id}/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(
    project_id: int,
    chapter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chapter and re-sequence remaining chapters"""
    chapter = db.query(Chapter).filter(
        Chapter.id == chapter_id,
        Chapter.project_id == project_id
    ).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    db.delete(chapter)
    db.commit()
    reorder_project_chapters(project_id, db)

