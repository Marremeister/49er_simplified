"""Equipment controller handling equipment business logic."""
from typing import List, Dict, Any
from uuid import UUID

from backend.app.domain.services.equipment_service import EquipmentService
from backend.app.application.schemas.equipment_schemas import (
    EquipmentCreate,
    EquipmentUpdate
)


class EquipmentController:
    """Controller for equipment operations."""

    def __init__(self, equipment_service: EquipmentService):
        self.equipment_service = equipment_service

    async def create_equipment(
            self,
            user_id: UUID,
            equipment_data: EquipmentCreate
    ) -> Dict[str, Any]:
        """Create new equipment."""
        try:
            equipment = await self.equipment_service.create_equipment(
                user_id=user_id,
                equipment_data=equipment_data.model_dump()
            )
            return {"equipment": equipment}
        except ValueError as e:
            raise ValueError(str(e))

    async def get_user_equipment(
            self,
            user_id: UUID,
            active_only: bool = True
    ) -> Dict[str, Any]:
        """Get all equipment for a user."""
        equipment_list = await self.equipment_service.get_user_equipment(
            user_id=user_id,
            active_only=active_only
        )
        return {"equipment": equipment_list}

    async def get_equipment_by_id(
            self,
            equipment_id: UUID,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Get specific equipment by ID."""
        equipment = await self.equipment_service.get_equipment_by_id(
            equipment_id=equipment_id,
            user_id=user_id
        )

        if not equipment:
            raise ValueError("Equipment not found or access denied")

        return {"equipment": equipment}

    async def update_equipment(
            self,
            equipment_id: UUID,
            user_id: UUID,
            update_data: EquipmentUpdate
    ) -> Dict[str, Any]:
        """Update equipment."""
        # Filter out None values
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

        equipment = await self.equipment_service.update_equipment(
            equipment_id=equipment_id,
            user_id=user_id,
            update_data=update_dict
        )

        if not equipment:
            raise ValueError("Equipment not found or access denied")

        return {"equipment": equipment}

    async def retire_equipment(
            self,
            equipment_id: UUID,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Retire equipment."""
        success = await self.equipment_service.retire_equipment(
            equipment_id=equipment_id,
            user_id=user_id
        )

        if not success:
            raise ValueError("Equipment not found or access denied")

        return {"success": True, "message": "Equipment retired successfully"}

    async def reactivate_equipment(
            self,
            equipment_id: UUID,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Reactivate retired equipment."""
        success = await self.equipment_service.reactivate_equipment(
            equipment_id=equipment_id,
            user_id=user_id
        )

        if not success:
            raise ValueError("Equipment not found or access denied")

        return {"success": True, "message": "Equipment reactivated successfully"}

    async def delete_equipment(
            self,
            equipment_id: UUID,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Delete equipment."""
        success = await self.equipment_service.delete_equipment(
            equipment_id=equipment_id,
            user_id=user_id
        )

        if not success:
            raise ValueError("Equipment not found or access denied")

        return {"success": True, "message": "Equipment deleted successfully"}

    async def get_equipment_statistics(
            self,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Get equipment statistics for a user."""
        stats = await self.equipment_service.get_equipment_statistics(user_id)
        return {"statistics": stats}