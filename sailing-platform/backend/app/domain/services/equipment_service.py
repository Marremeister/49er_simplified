"""Equipment domain service."""
from typing import List, Optional, Dict, Any
from uuid import UUID
from collections import defaultdict

from backend.app.domain.entities.equipment import Equipment, EquipmentType
from backend.app.domain.repositories.equipment_repository import IEquipmentRepository


class EquipmentService:
    """Domain service for equipment business logic."""

    def __init__(self, equipment_repository: IEquipmentRepository):
        self.equipment_repository = equipment_repository

    async def create_equipment(
            self,
            user_id: UUID,
            equipment_data: Dict[str, Any]
    ) -> Equipment:
        """Create new equipment for a user."""
        # Create equipment entity
        equipment = Equipment(
            owner_id=user_id,
            **equipment_data
        )

        # Save to repository
        return await self.equipment_repository.create(equipment)

    async def get_user_equipment(
            self,
            user_id: UUID,
            active_only: bool = True
    ) -> List[Equipment]:
        """Get all equipment for a user."""
        return await self.equipment_repository.get_by_user(user_id, active_only)

    async def get_equipment_by_id(
            self,
            equipment_id: UUID,
            user_id: UUID
    ) -> Optional[Equipment]:
        """Get equipment by ID if user owns it."""
        equipment = await self.equipment_repository.get_by_id(equipment_id)
        if equipment and equipment.owner_id == user_id:
            return equipment
        return None

    async def update_equipment(
            self,
            equipment_id: UUID,
            user_id: UUID,
            update_data: Dict[str, Any]
    ) -> Optional[Equipment]:
        """Update equipment if user owns it."""
        # Get existing equipment
        equipment = await self.equipment_repository.get_by_id(equipment_id)
        if not equipment or equipment.owner_id != user_id:
            return None

        # Update fields
        for key, value in update_data.items():
            if hasattr(equipment, key) and key not in ['id', 'owner_id', 'created_at']:
                setattr(equipment, key, value)

        # Validate
        equipment.__post_init__()

        # Save changes
        return await self.equipment_repository.update(equipment)

    async def retire_equipment(
            self,
            equipment_id: UUID,
            user_id: UUID
    ) -> bool:
        """Retire equipment if user owns it."""
        # Check ownership
        equipment = await self.equipment_repository.get_by_id(equipment_id)
        if not equipment or equipment.owner_id != user_id:
            return False

        return await self.equipment_repository.retire(equipment_id)

    async def reactivate_equipment(
            self,
            equipment_id: UUID,
            user_id: UUID
    ) -> bool:
        """Reactivate retired equipment if user owns it."""
        # Check ownership
        equipment = await self.equipment_repository.get_by_id(equipment_id)
        if not equipment or equipment.owner_id != user_id:
            return False

        return await self.equipment_repository.reactivate(equipment_id)

    async def delete_equipment(
            self,
            equipment_id: UUID,
            user_id: UUID
    ) -> bool:
        """Delete equipment if user owns it."""
        # Check ownership
        equipment = await self.equipment_repository.get_by_id(equipment_id)
        if not equipment or equipment.owner_id != user_id:
            return False

        return await self.equipment_repository.delete(equipment_id)

    async def get_equipment_statistics(
            self,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Get equipment statistics for a user."""
        all_equipment = await self.equipment_repository.get_by_user(user_id, active_only=False)

        if not all_equipment:
            return {
                "total_equipment": 0,
                "active_equipment": 0,
                "retired_equipment": 0,
                "equipment_by_type": {},
                "oldest_equipment": None,
                "newest_equipment": None
            }

        # Calculate statistics
        active_count = sum(1 for e in all_equipment if e.active)
        retired_count = len(all_equipment) - active_count

        # Group by type
        by_type = defaultdict(int)
        for equipment in all_equipment:
            by_type[equipment.type] += 1

        # Find oldest and newest
        sorted_by_date = sorted(
            [e for e in all_equipment if e.purchase_date],
            key=lambda e: e.purchase_date
        )

        return {
            "total_equipment": len(all_equipment),
            "active_equipment": active_count,
            "retired_equipment": retired_count,
            "equipment_by_type": dict(by_type),
            "oldest_equipment": sorted_by_date[0].name if sorted_by_date else None,
            "newest_equipment": sorted_by_date[-1].name if sorted_by_date else None
        }