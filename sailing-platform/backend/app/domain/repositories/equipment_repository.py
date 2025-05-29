"""Equipment repository interface."""
from abc import abstractmethod
from typing import List
from uuid import UUID

from backend.app.domain.entities.equipment import Equipment, EquipmentType
from backend.app.domain.repositories.base import IRepository


class IEquipmentRepository(IRepository[Equipment]):
    """Equipment repository interface with equipment-specific methods."""

    @abstractmethod
    async def get_by_user(self, user_id: UUID, active_only: bool = True) -> List[Equipment]:
        """Get all equipment for a specific user."""
        pass

    @abstractmethod
    async def get_by_type(self, user_id: UUID, equipment_type: EquipmentType) -> List[Equipment]:
        """Get equipment by type for a user."""
        pass

    @abstractmethod
    async def retire(self, equipment_id: UUID) -> bool:
        """Retire equipment by ID."""
        pass

    @abstractmethod
    async def reactivate(self, equipment_id: UUID) -> bool:
        """Reactivate retired equipment."""
        pass