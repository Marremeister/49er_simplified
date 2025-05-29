"""Session controller handling sailing session business logic."""
from typing import List, Optional, Dict, Any
from datetime import date
from uuid import UUID

from app.domain.services.session_service import SessionService
from app.application.schemas.session_schemas import (
    SessionCreate,
    SessionUpdate,
    EquipmentSettingsCreate
)


class SessionController:
    """Controller for sailing session operations."""

    def __init__(self, session_service: SessionService):
        self.session_service = session_service

    async def create_session(
            self,
            user_id: UUID,
            session_data: SessionCreate
    ) -> Dict[str, Any]:
        """Create a new sailing session."""
        try:
            session = await self.session_service.create_session(
                user_id=user_id,
                session_data=session_data.model_dump()
            )
            return {"session": session}
        except ValueError as e:
            raise ValueError(str(e))

    async def get_user_sessions(
            self,
            user_id: UUID,
            skip: int = 0,
            limit: int = 100
    ) -> Dict[str, Any]:
        """Get all sessions for a user."""
        sessions = await self.session_service.get_user_sessions(
            user_id=user_id,
            skip=skip,
            limit=limit
        )
        return {"sessions": sessions}

    async def get_session_with_settings(
            self,
            session_id: UUID,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Get a specific session with equipment settings."""
        result = await self.session_service.get_session_with_settings(
            session_id=session_id,
            user_id=user_id
        )

        if not result:
            raise ValueError("Session not found or access denied")

        session, settings = result
        return {
            "session": session,
            "equipment_settings": settings
        }

    async def get_session_equipment(
            self,
            session_id: UUID,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Get equipment used in a session."""
        equipment = await self.session_service.get_session_equipment(
            session_id=session_id,
            user_id=user_id
        )

        if equipment is None:
            raise ValueError("Session not found or access denied")

        return {"equipment": equipment}

    async def update_session(
            self,
            session_id: UUID,
            user_id: UUID,
            update_data: SessionUpdate
    ) -> Dict[str, Any]:
        """Update a sailing session."""
        # Filter out None values
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

        session = await self.session_service.update_session(
            session_id=session_id,
            user_id=user_id,
            update_data=update_dict
        )

        if not session:
            raise ValueError("Session not found or access denied")

        return {"session": session}

    async def delete_session(
            self,
            session_id: UUID,
            user_id: UUID
    ) -> Dict[str, Any]:
        """Delete a sailing session."""
        success = await self.session_service.delete_session(
            session_id=session_id,
            user_id=user_id
        )

        if not success:
            raise ValueError("Session not found or access denied")

        return {"success": True, "message": "Session deleted successfully"}

    async def create_equipment_settings(
            self,
            session_id: UUID,
            user_id: UUID,
            settings_data: EquipmentSettingsCreate
    ) -> Dict[str, Any]:
        """Create equipment settings for a session."""
        try:
            settings = await self.session_service.create_equipment_settings(
                session_id=session_id,
                user_id=user_id,
                settings_data=settings_data.model_dump()
            )

            if not settings:
                raise ValueError("Session not found or access denied")

            return {"equipment_settings": settings}
        except ValueError as e:
            raise ValueError(str(e))

    async def get_performance_analytics(
            self,
            user_id: UUID,
            start_date: Optional[date] = None,
            end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get performance analytics for user sessions."""
        analytics = await self.session_service.get_performance_analytics(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date
        )
        return {"analytics": analytics}