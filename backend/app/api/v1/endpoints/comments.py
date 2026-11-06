import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Comment, CommentStatus, Post, User, UserRole

router = APIRouter()

class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)
    parent_id: uuid.UUID | None = None

class CommentUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)

class CommentResponse(BaseModel):
    id: uuid.UUID
    post_id: uuid.UUID
    author_id: uuid.UUID
    parent_id: uuid.UUID | None
    body: str
    status: CommentStatus
    model_config = {'from_attributes': True}

@router.get('/posts/{post_id}/comments', response_model=list[CommentResponse])
def list_comments(post_id: uuid.UUID, db: Session = Depends(get_db)):
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=404, detail='Post not found')
    return db.scalars(select(Comment).where(Comment.post_id == post_id, Comment.status == CommentStatus.VISIBLE, Comment.deleted_at.is_(None)).order_by(Comment.created_at)).all()

@router.post('/posts/{post_id}/comments', response_model=CommentResponse, status_code=201)
def create_comment(post_id: uuid.UUID, payload: CommentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = db.get(Post, post_id)
    if post is None or post.deleted_at is not None:
        raise HTTPException(status_code=404, detail='Post not found')
    if payload.parent_id:
        parent = db.get(Comment, payload.parent_id)
        if parent is None or parent.post_id != post_id:
            raise HTTPException(status_code=400, detail='Invalid parent comment')
    comment = Comment(post_id=post_id, author_id=user.id, parent_id=payload.parent_id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

@router.put('/comments/{comment_id}', response_model=CommentResponse)
def update_comment(comment_id: uuid.UUID, payload: CommentUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    comment = db.get(Comment, comment_id)
    if comment is None or comment.deleted_at is not None:
        raise HTTPException(status_code=404, detail='Comment not found')
    if comment.author_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail='You cannot modify this comment')
    comment.body = payload.body
    db.commit()
    db.refresh(comment)
    return comment

@router.delete('/comments/{comment_id}', status_code=204)
def delete_comment(comment_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail='Comment not found')
    if comment.author_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail='You cannot delete this comment')
    comment.status = CommentStatus.HIDDEN
    comment.deleted_at = __import__('datetime').datetime.now(__import__('datetime').timezone.utc).replace(tzinfo=None)
    db.commit()
    return None
