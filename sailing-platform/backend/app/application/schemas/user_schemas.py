"""User request/response schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """User response schema."""
    id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """User login schema."""
    username: str
    password: str


class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""
    user_id: Optional[UUID] = None