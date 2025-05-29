"""Session repository interface."""
from abc import abstractmethod
from typing import List, Optional
from datetime import date
from uuid import UUID

from backend.app.domain.entities.session import SailingSession
from backend.app.domain.entities.equipment import EquipmentSettings
from backend.app.domain.repositories.base import IRepository


class ISessionRepository(IRepository[SailingSession]):
    """Sailing session repository interface with session-specific methods."""

    @abstractmethod
    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[SailingSession]:
        """Get all sessions for a specific user."""
        pass

    @abstractmethod
    async def get_by_date_range(
            self,
            user_id: UUID,
            start_date: date,
            end_date: date
    ) -> List[SailingSession]:
        """Get sessions within a date range for a user."""
        pass

    @abstractmethod
    async def get_with_settings(self, session_id: UUID) -> Optional[tuple[SailingSession, Optional[EquipmentSettings]]]:
        """Get session with its equipment settings."""
        pass

    @abstractmethod
    async def create_settings(self, settings: EquipmentSettings) -> EquipmentSettings:
        """Create equipment settings for a session."""
        pass

    @abstractmethod
    async def update_settings(self, settings: EquipmentSettings) -> EquipmentSettings:
        """Update equipment settings for a session."""
        pass

    @abstractmethod
    async def get_settings_by_session(self, session_id: UUID) -> Optional[EquipmentSettings]:
        """Get equipment settings for a specific session."""
        pass