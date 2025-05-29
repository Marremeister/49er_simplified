"""User repository implementation using SQLAlchemy."""
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import User as UserEntity
from app.domain.repositories.user_repository import IUserRepository
from app.infrastructure.database.models import User as UserModel


class UserRepository(IUserRepository):
    """User repository implementation."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: UserModel) -> UserEntity:
        """Convert database model to domain entity."""
        return UserEntity(
            id=model.id,
            email=model.email,
            username=model.username,
            hashed_password=model.hashed_password,
            is_active=model.is_active,
            created_at=model.created_at
        )

    def _to_model(self, entity: UserEntity) -> UserModel:
        """Convert domain entity to database model."""
        return UserModel(
            id=entity.id,
            email=entity.email,
            username=entity.username,
            hashed_password=entity.hashed_password,
            is_active=entity.is_active,
            created_at=entity.created_at
        )

    async def create(self, entity: UserEntity) -> UserEntity:
        """Create a new user."""
        model = self._to_model(entity)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, entity_id: UUID) -> Optional[UserEntity]:
        """Get user by ID."""
        stmt = select(UserModel).where(UserModel.id == entity_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_email(self, email: str) -> Optional[UserEntity]:
        """Get user by email."""
        stmt = select(UserModel).where(UserModel.email == email)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_username(self, username: str) -> Optional[UserEntity]:
        """Get user by username."""
        stmt = select(UserModel).where(UserModel.username == username)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def update(self, entity: UserEntity) -> UserEntity:
        """Update an existing user."""
        stmt = select(UserModel).where(UserModel.id == entity.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            raise ValueError("User not found")

        # Update fields
        model.email = entity.email
        model.username = entity.username
        model.hashed_password = entity.hashed_password
        model.is_active = entity.is_active

        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def delete(self, entity_id: UUID) -> bool:
        """Delete a user by ID."""
        stmt = select(UserModel).where(UserModel.id == entity_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            return False

        await self.session.delete(model)
        await self.session.flush()
        return True

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[UserEntity]:
        """List all users with pagination."""
        stmt = select(UserModel).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]

    async def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email."""
        stmt = select(UserModel.id).where(UserModel.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def exists_by_username(self, username: str) -> bool:
        """Check if user exists by username."""
        stmt = select(UserModel.id).where(UserModel.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None