"""Equipment view for formatting equipment responses."""
from typing import List, Dict, Any

from app.domain.entities.equipment import Equipment
from app.application.schemas.equipment_schemas import (
    EquipmentResponse,
    EquipmentStatistics
)


class EquipmentView:
    """View for formatting equipment responses."""

    @staticmethod
    def format_equipment_response(equipment: Equipment) -> EquipmentResponse:
        """Format a single equipment response."""
        return EquipmentResponse(
            id=equipment.id,
            name=equipment.name,
            type=equipment.type,
            manufacturer=equipment.manufacturer,
            model=equipment.model,
            purchase_date=equipment.purchase_date,
            notes=equipment.notes,
            active=equipment.active,
            owner_id=equipment.owner_id,
            created_at=equipment.created_at,
            updated_at=equipment.updated_at,
            age_in_days=equipment.age_in_days
        )

    @staticmethod
    def format_equipment_list_response(equipment_list: List[Equipment]) -> List[EquipmentResponse]:
        """Format a list of equipment."""
        return [
            EquipmentView.format_equipment_response(equipment)
            for equipment in equipment_list
        ]

    @staticmethod
    def format_equipment_statistics_response(stats: Dict[str, Any]) -> EquipmentStatistics:
        """Format equipment statistics response."""
        return EquipmentStatistics(
            total_equipment=stats["total_equipment"],
            active_equipment=stats["active_equipment"],
            retired_equipment=stats["retired_equipment"],
            equipment_by_type=stats["equipment_by_type"],
            oldest_equipment=stats["oldest_equipment"],
            newest_equipment=stats["newest_equipment"]
        )

    @staticmethod
    def format_action_response(success: bool, message: str) -> Dict[str, Any]:
        """Format action response (retire, reactivate, delete)."""
        return {
            "success": success,
            "message": message
        }