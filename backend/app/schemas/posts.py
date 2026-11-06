import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from app.models import PostStatus


class CategoryBrief(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    model_config = {'from_attributes': True}


class TagBrief(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    model_config = {'from_attributes': True}


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    excerpt: str = Field(default='', max_length=500)
    content: str = ''
    featured_image_url: str | None = None
    category_ids: list[uuid.UUID] = []
    tag_ids: list[uuid.UUID] = []
    status: PostStatus = PostStatus.DRAFT
    published_at: datetime | None = None


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    excerpt: str | None = Field(default=None, max_length=500)
    content: str | None = None
    featured_image_url: str | None = None
    category_ids: list[uuid.UUID] | None = None
    tag_ids: list[uuid.UUID] | None = None


class PostResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    excerpt: str
    content: str
    featured_image_url: str | None
    status: PostStatus
    published_at: datetime | None
    author_id: uuid.UUID
    categories: list[CategoryBrief] = []
    tags: list[TagBrief] = []
    model_config = {'from_attributes': True}


class PaginatedPosts(BaseModel):
    items: list[PostResponse]
    total: int
    page: int
    page_size: int
