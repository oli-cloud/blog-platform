import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Post, User
from app.schemas.auth import UserResponse
from app.schemas.posts import PostResponse

router = APIRouter()

class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=2048)

@router.get('/{user_id}', response_model=UserResponse)
def get_public_profile(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None or user.deleted_at is not None:
        raise HTTPException(status_code=404, detail='User not found')
    return user

@router.put('/me', response_model=UserResponse)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.bio is not None:
        user.bio = payload.bio
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(user)
    return user

@router.get('/me/posts', response_model=list[PostResponse])
def my_posts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(Post).where(Post.author_id == user.id, Post.deleted_at.is_(None)).order_by(Post.updated_at.desc())).all()
