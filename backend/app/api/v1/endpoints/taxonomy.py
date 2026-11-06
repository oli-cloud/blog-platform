import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import require_admin
from app.db.session import get_db
from app.models import Category, Tag, User
from app.utils.slugs import unique_slug

categories_router = APIRouter()
tags_router = APIRouter()

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=500)

class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    model_config = {'from_attributes': True}

@categories_router.get('', response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).where(Category.deleted_at.is_(None)).order_by(Category.name)).all()

@categories_router.post('', response_model=CategoryResponse, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    slug = unique_slug(payload.name, lambda value: db.scalar(select(Category.id).where(Category.slug == value)) is not None)
    category = Category(name=payload.name, slug=slug, description=payload.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@categories_router.put('/{category_id}', response_model=CategoryResponse)
def update_category(category_id: uuid.UUID, payload: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    category = db.get(Category, category_id)
    if category is None or category.deleted_at is not None:
        raise HTTPException(status_code=404, detail='Category not found')
    category.name = payload.name
    category.description = payload.description
    db.commit()
    db.refresh(category)
    return category

@categories_router.delete('/{category_id}', status_code=204)
def delete_category(category_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail='Category not found')
    category.deleted_at = __import__('datetime').datetime.utcnow()
    db.commit()
    return None

class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)

class TagResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    model_config = {'from_attributes': True}

@tags_router.get('', response_model=list[TagResponse])
def list_tags(db: Session = Depends(get_db)):
    return db.scalars(select(Tag).where(Tag.deleted_at.is_(None)).order_by(Tag.name)).all()

@tags_router.post('', response_model=TagResponse, status_code=201)
def create_tag(payload: TagCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    slug = unique_slug(payload.name, lambda value: db.scalar(select(Tag.id).where(Tag.slug == value)) is not None)
    tag = Tag(name=payload.name, slug=slug)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

@tags_router.put('/{tag_id}', response_model=TagResponse)
def update_tag(tag_id: uuid.UUID, payload: TagCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    tag = db.get(Tag, tag_id)
    if tag is None or tag.deleted_at is not None:
        raise HTTPException(status_code=404, detail='Tag not found')
    tag.name = payload.name
    db.commit()
    db.refresh(tag)
    return tag

@tags_router.delete('/{tag_id}', status_code=204)
def delete_tag(tag_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    tag = db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail='Tag not found')
    tag.deleted_at = __import__('datetime').datetime.utcnow()
    db.commit()
    return None
