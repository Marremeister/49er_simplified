"""Equipment router endpoints."""
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.dependencies import get_equipment_service, get_current_user_id, get_session_service
from app.domain.services.equipment_service import EquipmentService
from app.domain.services.session_service import SessionService
from app.presentation.controllers.equipment_controller import EquipmentController
from app.presentation.views.equipment_view import EquipmentView
from app.presentation.controllers.session_controller import SessionController
from app.presentation.views.session_view import SessionView
from app.application.schemas.equipment_schemas import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse,
    EquipmentStatistics
)
from app.application.schemas.session_schemas import (
    EquipmentSettingsCreate,
    EquipmentSettingsResponse
)

router = APIRouter()


@router.post("/", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment(
        equipment_data: EquipmentCreate,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        equipment_service: Annotated[EquipmentService, Depends(get_equipment_service)]
):
    """Create new equipment."""
    controller = EquipmentController(equipment_service)
    view = EquipmentView()

    try:
        result = await controller.create_equipment(current_user_id, equipment_data)
        return view.format_equipment_response(result["equipment"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[EquipmentResponse])
async def list_equipment(
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        equipment_service: Annotated[EquipmentService, Depends(get_equipment_service)],
        active_only: bool = Query(True, description="Filter for active equipment only"),
):
    """List all equipment for the current user."""
    controller = EquipmentController(equipment_service)
    view = EquipmentView()

    result = await controller.get_user_equipment(current_user_id, active_only)
    return view.format_equipment_list_response(result["equipment"])


@router.get("/analytics/stats", response_model=EquipmentStatistics)
async def get_equipment_statistics(
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        equipment_service: Annotated[EquipmentService, Depends(get_equipment_service)]
):
    """Get equipment statistics for the current user."""
    controller = EquipmentController(equipment_service)
    view = EquipmentView()

    result = await controller.get_equipment_statistics(current_user_id)
    return view.format_equipment_statistics_response(result["statistics"])


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
        equipment_id: UUID,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        equipment_service: Annotated[EquipmentService, Depends(get_equipment_service)]
):
    """Get specific equipment by ID."""
    controller = EquipmentController(equipment_service)
    view = EquipmentView()

    try:
        result = await controller.get_equipment_by_id(equipment_id, current_user_id)
        return view.format_equipment_response(result["equipment"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
        equipment_id: UUID,
        update_data: EquipmentUpdate,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        equipment_service: Annotated[EquipmentService, Depends(get_equipment_service)]
):
    """Update equipment."""
    controller = EquipmentController(equipment_service)
    view = EquipmentView()

    try:
        result = await controller.update_equipment(equipment_id, current_user_id, update_data)
        return view.format_equipment_response(result["equipment"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/{equipment_id}/retire")
async def retire_equipment(
        equipment_id: UUID,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        equipment_service: Annotated[EquipmentService, Depends(get_equipment_service)]
):
    """Retire equipment."""
    controller = EquipmentController(equipment_service)
    view = EquipmentView()

    try:
        result = await controller.retire_equipment(equipment_id, current_user_id)
        return view.format_action_response(result["success"], result["message"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/{equipment_id}/reactivate")
async def reactivate_equipment(
        equipment_id: UUID,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        equipment_service: Annotated[EquipmentService, Depends(get_equipment_service)]
):
    """Reactivate retired equipment."""
    controller = EquipmentController(equipment_service)
    view = EquipmentView()

    try:
        result = await controller.reactivate_equipment(equipment_id, current_user_id)
        return view.format_action_response(result["success"], result["message"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
        equipment_id: UUID,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        equipment_service: Annotated[EquipmentService, Depends(get_equipment_service)]
):
    """Delete equipment permanently."""
    controller = EquipmentController(equipment_service)

    try:
        await controller.delete_equipment(equipment_id, current_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# Equipment settings endpoints (alternative to session endpoints)
@router.post("/sessions/{session_id}/settings", response_model=EquipmentSettingsResponse,
             status_code=status.HTTP_201_CREATED)
async def create_equipment_settings(
        session_id: UUID,
        settings_data: EquipmentSettingsCreate,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)]
):
    """Create equipment settings for a session (alternative endpoint)."""
    controller = SessionController(session_service)
    view = SessionView()

    try:
        result = await controller.create_equipment_settings(
            session_id,
            current_user_id,
            settings_data
        )
        return view.format_equipment_settings_response(result["equipment_settings"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )