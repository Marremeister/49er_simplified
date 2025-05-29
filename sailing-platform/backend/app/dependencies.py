"""Dependency injection setup for the application."""
from typing import Annotated
from functools import lru_cache
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
#from jose import JWTError

from backend.app.config import settings
from backend.app.infrastructure.database.connection import get_db
from backend.app.infrastructure.security.password_hasher import PasswordHasher, IPasswordHasher
from backend.app.infrastructure.security.jwt_handler import JWTHandler
from backend.app.infrastructure.database.repositories.user_repository_impl import UserRepository
from backend.app.infrastructure.database.repositories.session_repository_impl import SessionRepository
from backend.app.infrastructure.database.repositories.equipment_repository_impl import EquipmentRepository
from backend.app.domain.repositories.user_repository import IUserRepository
from backend.app.domain.repositories.session_repository import ISessionRepository
from backend.app.domain.repositories.equipment_repository import IEquipmentRepository
from backend.app.domain.services.auth_service import AuthService
from backend.app.domain.services.session_service import SessionService
from backend.app.domain.services.equipment_service import EquipmentService

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")


# Infrastructure dependencies
@lru_cache()
def get_password_hasher() -> IPasswordHasher:
    """Get password hasher instance."""
    return PasswordHasher()


@lru_cache()
def get_jwt_handler() -> JWTHandler:
    """Get JWT handler instance."""
    return JWTHandler()


# Repository dependencies
async def get_user_repository(
        db: Annotated[AsyncSession, Depends(get_db)]
) -> IUserRepository:
    """Get user repository instance."""
    return UserRepository(db)


async def get_session_repository(
        db: Annotated[AsyncSession, Depends(get_db)]
) -> ISessionRepository:
    """Get session repository instance."""
    return SessionRepository(db)


async def get_equipment_repository(
        db: Annotated[AsyncSession, Depends(get_db)]
) -> IEquipmentRepository:
    """Get equipment repository instance."""
    return EquipmentRepository(db)


# Service dependencies
async def get_auth_service(
        user_repository: Annotated[IUserRepository, Depends(get_user_repository)],
        password_hasher: Annotated[IPasswordHasher, Depends(get_password_hasher)]
) -> AuthService:
    """Get auth service instance."""
    return AuthService(user_repository, password_hasher)


async def get_session_service(
        session_repository: Annotated[ISessionRepository, Depends(get_session_repository)]
) -> SessionService:
    """Get session service instance."""
    return SessionService(session_repository)


async def get_equipment_service(
        equipment_repository: Annotated[IEquipmentRepository, Depends(get_equipment_repository)]
) -> EquipmentService:
    """Get equipment service instance."""
    return EquipmentService(equipment_repository)


# Authentication dependencies
async def get_current_user_id(
        token: Annotated[str, Depends(oauth2_scheme)],
        jwt_handler: Annotated[JWTHandler, Depends(get_jwt_handler)]
) -> UUID:
    """Get current user ID from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = jwt_handler.get_user_id_from_token(token)
    if user_id is None:
        raise credentials_exception

    try:
        return UUID(user_id)
    except ValueError:
        raise credentials_exception


async def get_current_user(
        user_id: Annotated[UUID, Depends(get_current_user_id)],
        auth_service: Annotated[AuthService, Depends(get_auth_service)]
):
    """Get current user from token."""
    user = await auth_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return user