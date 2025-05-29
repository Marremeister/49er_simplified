"""Session router endpoints."""
from typing import Annotated, List, Optional
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.dependencies import get_session_service, get_current_user_id
from app.domain.services.session_service import SessionService
from app.presentation.controllers.session_controller import SessionController
from app.presentation.views.session_view import SessionView
from app.application.schemas.session_schemas import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    SessionWithSettingsResponse,
    EquipmentSettingsCreate,
    EquipmentSettingsResponse,
    PerformanceAnalytics
)

router = APIRouter()


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
        session_data: SessionCreate,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)]
):
    """Create a new sailing session."""
    controller = SessionController(session_service)
    view = SessionView()

    try:
        result = await controller.create_session(current_user_id, session_data)
        return view.format_session_response(result["session"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[SessionResponse])
async def list_sessions(
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)],
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100)
):
    """List all sessions for the current user."""
    controller = SessionController(session_service)
    view = SessionView()

    result = await controller.get_user_sessions(current_user_id, skip, limit)
    return view.format_sessions_list_response(result["sessions"])


@router.get("/analytics/performance", response_model=PerformanceAnalytics)
async def get_performance_analytics(
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)],
        start_date: Optional[date] = Query(None),
        end_date: Optional[date] = Query(None)
):
    """Get performance analytics for user sessions."""
    controller = SessionController(session_service)
    view = SessionView()

    result = await controller.get_performance_analytics(
        current_user_id,
        start_date,
        end_date
    )
    return view.format_performance_analytics_response(result["analytics"])


@router.get("/{session_id}", response_model=SessionWithSettingsResponse)
async def get_session(
        session_id: UUID,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)]
):
    """Get a specific session with equipment settings."""
    controller = SessionController(session_service)
    view = SessionView()

    try:
        result = await controller.get_session_with_settings(session_id, current_user_id)
        return view.format_session_with_settings_response(
            result["session"],
            result["equipment_settings"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
        session_id: UUID,
        update_data: SessionUpdate,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)]
):
    """Update a sailing session."""
    controller = SessionController(session_service)
    view = SessionView()

    try:
        result = await controller.update_session(session_id, current_user_id, update_data)
        return view.format_session_response(result["session"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
        session_id: UUID,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)]
):
    """Delete a sailing session."""
    controller = SessionController(session_service)

    try:
        await controller.delete_session(session_id, current_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/{session_id}/settings", response_model=EquipmentSettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment_settings(
        session_id: UUID,
        settings_data: EquipmentSettingsCreate,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)]
):
    """Create equipment settings for a session."""
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


@router.get("/{session_id}/settings", response_model=EquipmentSettingsResponse)
async def get_equipment_settings(
        session_id: UUID,
        current_user_id: Annotated[UUID, Depends(get_current_user_id)],
        session_service: Annotated[SessionService, Depends(get_session_service)]
):
    """Get equipment settings for a session."""
    controller = SessionController(session_service)
    view = SessionView()

    try:
        result = await controller.get_session_with_settings(session_id, current_user_id)
        if not result["equipment_settings"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipment settings not found for this session"
            )
        return view.format_equipment_settings_response(result["equipment_settings"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )