import enum
import uuid
from datetime import datetime
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    USER = 'user'
    ADMIN = 'admin'


class UserStatus(str, enum.Enum):
    ACTIVE = 'active'
    SUSPENDED = 'suspended'


class PostStatus(str, enum.Enum):
    DRAFT = 'draft'
    PUBLISHED = 'published'
    ARCHIVED = 'archived'


class CommentStatus(str, enum.Enum):
    VISIBLE = 'visible'
    HIDDEN = 'hidden'


class User(Base, TimestampMixin):
    __tablename__ = 'users'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100), default='')
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, index=True)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.ACTIVE, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True, index=True)

    posts = relationship('Post', back_populates='author')


post_categories = __import__('sqlalchemy').Table(
    'post_categories', Base.metadata,
    __import__('sqlalchemy').Column('post_id', __import__('sqlalchemy').Uuid, ForeignKey('posts.id', ondelete='CASCADE'), primary_key=True),
    __import__('sqlalchemy').Column('category_id', __import__('sqlalchemy').Uuid, ForeignKey('categories.id', ondelete='CASCADE'), primary_key=True),
)
post_tags = __import__('sqlalchemy').Table(
    'post_tags', Base.metadata,
    __import__('sqlalchemy').Column('post_id', __import__('sqlalchemy').Uuid, ForeignKey('posts.id', ondelete='CASCADE'), primary_key=True),
    __import__('sqlalchemy').Column('tag_id', __import__('sqlalchemy').Uuid, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
)


class Category(Base, TimestampMixin):
    __tablename__ = 'categories'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    posts = relationship('Post', secondary=post_categories, back_populates='categories')


class Tag(Base, TimestampMixin):
    __tablename__ = 'tags'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    posts = relationship('Post', secondary=post_tags, back_populates='tags')


class Post(Base, TimestampMixin):
    __tablename__ = 'posts'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), index=True)
    title: Mapped[str] = mapped_column(String(180), index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    excerpt: Mapped[str] = mapped_column(String(500), default='')
    content: Mapped[str] = mapped_column(Text, default='')
    featured_image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[PostStatus] = mapped_column(Enum(PostStatus), default=PostStatus.DRAFT, index=True)
    published_at: Mapped[datetime | None] = mapped_column(nullable=True, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True, index=True)

    author = relationship('User', back_populates='posts')
    categories = relationship('Category', secondary=post_categories, back_populates='posts')
    tags = relationship('Tag', secondary=post_tags, back_populates='posts')
    comments = relationship('Comment', back_populates='post')


class Comment(Base, TimestampMixin):
    __tablename__ = 'comments'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('posts.id'), index=True)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('comments.id'), nullable=True, index=True)
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[CommentStatus] = mapped_column(Enum(CommentStatus), default=CommentStatus.VISIBLE, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    post = relationship('Post', back_populates='comments')


class Like(Base, TimestampMixin):
    __tablename__ = 'likes'
    __table_args__ = (UniqueConstraint('user_id', 'post_id', name='uq_like_user_post'),)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), primary_key=True)
    post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('posts.id'), primary_key=True)


class Media(Base):
    __tablename__ = 'media'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uploader_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), index=True)
    post_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('posts.id'), nullable=True, index=True)
    storage_provider: Mapped[str] = mapped_column(String(20))
    storage_key: Mapped[str] = mapped_column(String(2048), unique=True)
    public_url: Mapped[str] = mapped_column(String(2048), unique=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    byte_size: Mapped[int] = mapped_column(Integer)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.now())
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)


class RefreshToken(Base):
    __tablename__ = 'refresh_tokens'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(nullable=True, index=True)
    replaced_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('refresh_tokens.id'), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(), nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(nullable=True)


class PasswordResetToken(Base):
    __tablename__ = 'password_reset_tokens'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(index=True)
    used_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(), nullable=False)
