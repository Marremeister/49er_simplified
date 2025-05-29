"""Base repository interface."""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List
from uuid import UUID

T = TypeVar('T')


class IRepository(ABC, Generic[T]):
    """Base repository interface for all domain repositories."""

    @abstractmethod
    async def create(self, entity: T) -> T:
        """Create a new entity."""
        pass

    @abstractmethod
    async def get_by_id(self, entity_id: UUID) -> Optional[T]:
        """Get entity by ID."""
        pass

    @abstractmethod
    async def update(self, entity: T) -> T:
        """Update an existing entity."""
        pass

    @abstractmethod
    async def delete(self, entity_id: UUID) -> bool:
        """Delete an entity by ID."""
        pass

    @abstractmethod
    async def list_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """List all entities with pagination."""
        pass