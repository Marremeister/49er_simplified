"""User repository interface."""
from abc import abstractmethod
from typing import Optional
from uuid import UUID

from app.domain.entities.user import User
from app.domain.repositories.base import IRepository


class IUserRepository(IRepository[User]):
    """User repository interface with user-specific methods."""

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        pass

    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        pass

    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email."""
        pass

    @abstractmethod
    async def exists_by_username(self, username: str) -> bool:
        """Check if user exists by username."""
        pass