import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models import Category, Like, Post, PostStatus, Tag, User, UserRole
from app.schemas.posts import PaginatedPosts, PostCreate, PostResponse, PostUpdate
from app.utils.slugs import unique_slug

router = APIRouter()


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def can_manage(post: Post, user: User):
    if post.author_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail='You cannot modify this post')


@router.get('', response_model=PaginatedPosts)
def list_posts(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: str | None = None,
              category: str | None = None, tag: str | None = None, db: Session = Depends(get_db)):
    query = select(Post).where(Post.deleted_at.is_(None), Post.status == PostStatus.PUBLISHED, Post.published_at <= utcnow())
    if search:
        pattern = f'%{search}%'
        query = query.where((Post.title.ilike(pattern)) | (Post.content.ilike(pattern)))
    if category:
        query = query.join(Post.categories).where(Category.slug == category)
    if tag:
        query = query.join(Post.tags).where(Tag.slug == tag)
    total = len(db.scalars(query).all())
    items = db.scalars(query.order_by(Post.published_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return PaginatedPosts(items=items, total=total, page=page, page_size=page_size)


@router.get('/{slug}', response_model=PostResponse)
def get_post(slug: str, db: Session = Depends(get_db)):
    post = db.scalar(select(Post).where(Post.slug == slug, Post.deleted_at.is_(None)))
    if post is None:
        raise HTTPException(status_code=404, detail='Post not found')
    if post.status != PostStatus.PUBLISHED or post.published_at > utcnow():
        raise HTTPException(status_code=404, detail='Post not found')
    return post


@router.post('', response_model=PostResponse, status_code=201)
def create_post(payload: PostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.status == PostStatus.PUBLISHED and payload.published_at is None:
        payload.published_at = utcnow()
    slug = unique_slug(payload.title, lambda candidate: db.scalar(select(Post.id).where(Post.slug == candidate)) is not None)
    post = Post(author_id=user.id, title=payload.title, slug=slug, excerpt=payload.excerpt, content=payload.content,
                featured_image_url=payload.featured_image_url, status=payload.status, published_at=payload.published_at)
    if payload.category_ids:
        post.categories = list(db.scalars(select(Category).where(Category.id.in_(payload.category_ids), Category.deleted_at.is_(None))).all())
    if payload.tag_ids:
        post.tags = list(db.scalars(select(Tag).where(Tag.id.in_(payload.tag_ids), Tag.deleted_at.is_(None))).all())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.put('/{post_id}', response_model=PostResponse)
def update_post(post_id: uuid.UUID, payload: PostUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = db.get(Post, post_id)
    if post is None or post.deleted_at is not None:
        raise HTTPException(status_code=404, detail='Post not found')
    can_manage(post, user)
    for field in ('title', 'excerpt', 'content', 'featured_image_url'):
        value = getattr(payload, field)
        if value is not None:
            setattr(post, field, value)
    if payload.category_ids is not None:
        post.categories = list(db.scalars(select(Category).where(Category.id.in_(payload.category_ids), Category.deleted_at.is_(None))).all())
    if payload.tag_ids is not None:
        post.tags = list(db.scalars(select(Tag).where(Tag.id.in_(payload.tag_ids), Tag.deleted_at.is_(None))).all())
    db.commit()
    db.refresh(post)
    return post


@router.delete('/{post_id}', status_code=204)
def delete_post(post_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = db.get(Post, post_id)
    if post is None or post.deleted_at is not None:
        raise HTTPException(status_code=404, detail='Post not found')
    can_manage(post, user)
    post.deleted_at = utcnow()
    db.commit()
    return None


@router.patch('/{post_id}/publish', response_model=PostResponse)
def publish_post(post_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = db.get(Post, post_id)
    if post is None or post.deleted_at is not None:
        raise HTTPException(status_code=404, detail='Post not found')
    can_manage(post, user)
    post.status = PostStatus.PUBLISHED
    post.published_at = utcnow()
    db.commit()
    db.refresh(post)
    return post


@router.post('/{post_id}/like', status_code=204)
def like_post(post_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=404, detail='Post not found')
    existing = db.get(Like, (user.id, post_id))
    if existing is None:
        db.add(Like(user_id=user.id, post_id=post_id))
        db.commit()
    return None


@router.delete('/{post_id}/like', status_code=204)
def unlike_post(post_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    like = db.get(Like, (user.id, post_id))
    if like is not None:
        db.delete(like)
        db.commit()
    return None


@router.patch('/{post_id}/unpublish', response_model=PostResponse)
def unpublish_post(post_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = db.get(Post, post_id)
    if post is None or post.deleted_at is not None:
        raise HTTPException(status_code=404, detail='Post not found')
    can_manage(post, user)
    post.status = PostStatus.DRAFT
    post.published_at = None
    db.commit()
    db.refresh(post)
    return post
