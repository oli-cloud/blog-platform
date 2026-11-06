import hashlib
import re
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, create_refresh_token, create_reset_token, hash_password, verify_password
from app.db.session import get_db
from app.models import PasswordResetToken, RefreshToken, User, UserStatus
from app.schemas.auth import ForgotPasswordRequest, LoginRequest, RefreshRequest, RegisterRequest, ResetPasswordRequest, TokenResponse, UserResponse

router = APIRouter()
settings = get_settings()


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.scalar(select(User).where((User.email == payload.email.lower()) | (User.username == payload.username)))
    if exists:
        raise HTTPException(status_code=409, detail='Email or username already exists')
    user = User(email=payload.email.lower(), username=payload.username, display_name=payload.display_name or payload.username,
                password_hash=hash_password(payload.password), status=UserStatus.ACTIVE)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower(), User.deleted_at.is_(None)))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Incorrect email or password')
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail='Account is not active')
    return issue_tokens(db, user)


def issue_tokens(db: Session, user: User) -> TokenResponse:
    refresh, token_hash = create_refresh_token()
    row = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=utcnow() + timedelta(days=settings.refresh_token_days))
    db.add(row)
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id, user.role.value), refresh_token=refresh)


@router.post('/refresh', response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.refresh_token.encode()).hexdigest()
    row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if row is None or row.revoked_at is not None or row.expires_at <= utcnow():
        raise HTTPException(status_code=401, detail='Refresh token is invalid, expired, or revoked')
    user = db.get(User, row.user_id)
    if user is None or user.deleted_at is not None or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=401, detail='Refresh token is invalid')
    row.revoked_at = utcnow()
    new_refresh, new_hash = create_refresh_token()
    replacement = RefreshToken(user_id=user.id, token_hash=new_hash, expires_at=utcnow() + timedelta(days=settings.refresh_token_days))
    db.add(replacement)
    db.flush()
    row.replaced_by_id = replacement.id
    row.last_used_at = utcnow()
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id, user.role.value), refresh_token=new_refresh)


@router.post('/logout', status_code=204)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.refresh_token.encode()).hexdigest()
    row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if row and row.revoked_at is None:
        row.revoked_at = utcnow()
        db.commit()
    return None


@router.post('/forgot-password', status_code=202)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower(), User.deleted_at.is_(None)))
    if user:
        token, token_hash = create_reset_token()
        row = PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=utcnow() + timedelta(hours=1))
        db.add(row)
        db.commit()
    return {'detail': 'If the account exists, password reset instructions have been sent'}


@router.post('/reset-password', status_code=204)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    row = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))
    if row is None or row.used_at is not None or row.expires_at <= utcnow():
        raise HTTPException(status_code=400, detail='Reset token is invalid or expired')
    user = db.get(User, row.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail='Reset token is invalid or expired')
    user.password_hash = hash_password(payload.password)
    row.used_at = utcnow()
    db.commit()
    return None


@router.get('/me', response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user
