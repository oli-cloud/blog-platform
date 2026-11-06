from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import uuid
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import jwt
from app.core.config import get_settings

ph = PasswordHasher()
settings = get_settings()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return ph.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_access_token(user_id: str, role: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({'sub': str(user_id), 'role': role, 'exp': expires, 'type': 'access'}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token() -> tuple[str, str]:
    token = secrets.token_urlsafe(48)
    return token, hashlib.sha256(token.encode()).hexdigest()


def create_reset_token() -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    return token, hashlib.sha256(token.encode()).hexdigest()
