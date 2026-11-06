import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.core.dependencies import require_admin
from app.db.session import get_db
from app.models import Comment, Post, User, UserRole, UserStatus
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get('/dashboard', dependencies=[])
def dashboard(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return {
        'users': db.scalar(select(func.count()).select_from(User).where(User.deleted_at.is_(None))) or 0,
        'posts': db.scalar(select(func.count()).select_from(Post).where(Post.deleted_at.is_(None))) or 0,
        'comments': db.scalar(select(func.count()).select_from(Comment).where(Comment.deleted_at.is_(None))) or 0,
    }

@router.get('/users', response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.scalars(select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())).all()

class RoleUpdate(BaseModel):
    role: UserRole

@router.patch('/users/{user_id}/role', response_model=UserResponse)
def update_role(user_id: uuid.UUID, payload: RoleUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if user is None or user.deleted_at is not None:
        raise HTTPException(status_code=404, detail='User not found')
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user

class StatusUpdate(BaseModel):
    status: UserStatus

@router.patch('/users/{user_id}/status', response_model=UserResponse)
def update_status(user_id: uuid.UUID, payload: StatusUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if user is None or user.deleted_at is not None:
        raise HTTPException(status_code=404, detail='User not found')
    user.status = payload.status
    db.commit()
    db.refresh(user)
    return user
