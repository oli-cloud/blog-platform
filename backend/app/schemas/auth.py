import uuid
from pydantic import BaseModel, EmailStr, Field
from app.models import UserRole, UserStatus


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30, pattern=r'^[a-zA-Z0-9_-]+$')
    password: str = Field(min_length=12, max_length=128)
    display_name: str = Field(default='', max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=12, max_length=128)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str
    display_name: str
    bio: str | None = None
    avatar_url: str | None = None
    role: UserRole
    status: UserStatus
    model_config = {'from_attributes': True}
