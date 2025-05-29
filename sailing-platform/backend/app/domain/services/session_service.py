"""Sailing session domain service."""
from typing import List, Optional, Dict, Any
from datetime import date
from uuid import UUID
from collections import defaultdict

from app.domain.entities.session import SailingSession
from app.domain.entities.equipment import EquipmentSettings
from app.domain.repositories.session_repository import ISessionRepository


class SessionService:
    """Domain service for sailing session business logic."""

    def __init__(self, session_repository: ISessionRepository):
        self.session_repository = session_repository

    async def create_session(
            self,
            user_id: UUID,
            session_data: Dict[str, Any]
    ) -> SailingSession:
        """Create a new sailing session."""
        # Create session entity
        session = SailingSession(
            created_by=user_id,
            **session_data
        )

        # Save to repository
        return await self.session_repository.create(session)

    async def get_user_sessions(
            self,
            user_id: UUID,
            skip: int = 0,
            limit: int = 100
    ) -> List[SailingSession]:
        """Get all sessions for a user."""
        return await self.session_repository.get_by_user(user_id, skip, limit)

    async def get_session_with_settings(
            self,
            session_id: UUID,
            user_id: UUID
    ) -> Optional[tuple[SailingSession, Optional[EquipmentSettings]]]:
        """Get session with equipment settings, ensuring user owns the session."""
        result = await self.session_repository.get_with_settings(session_id)
        if result:
            session, settings = result
            if session.created_by != user_id:
                return None
            return session, settings
        return None

    async def update_session(
            self,
            session_id: UUID,
            user_id: UUID,
            update_data: Dict[str, Any]
    ) -> Optional[SailingSession]:
        """Update a session if user owns it."""
        # Get existing session
        session = await self.session_repository.get_by_id(session_id)
        if not session or session.created_by != user_id:
            return None

        # Update session
        session.update(**update_data)

        # Save changes
        return await self.session_repository.update(session)

    async def delete_session(
            self,
            session_id: UUID,
            user_id: UUID
    ) -> bool:
        """Delete a session if user owns it."""
        # Check ownership
        session = await self.session_repository.get_by_id(session_id)
        if not session or session.created_by != user_id:
            return False

        return await self.session_repository.delete(session_id)

    async def create_equipment_settings(
            self,
            session_id: UUID,
            user_id: UUID,
            settings_data: Dict[str, Any]
    ) -> Optional[EquipmentSettings]:
        """Create equipment settings for a session."""
        # Verify session ownership
        session = await self.session_repository.get_by_id(session_id)
        if not session or session.created_by != user_id:
            return None

        # Check if settings already exist
        existing = await self.session_repository.get_settings_by_session(session_id)
        if existing:
            raise ValueError("Equipment settings already exist for this session")

        # Create settings entity
        settings = EquipmentSettings(
            session_id=session_id,
            **settings_data
        )

        # Save to repository
        return await self.session_repository.create_settings(settings)

    async def get_performance_analytics(
            self,
            user_id: UUID,
            start_date: Optional[date] = None,
            end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Calculate performance analytics for user sessions."""
        # Get sessions in date range
        if start_date and end_date:
            sessions = await self.session_repository.get_by_date_range(
                user_id, start_date, end_date
            )
        else:
            sessions = await self.session_repository.get_by_user(user_id)

        if not sessions:
            return {
                "total_sessions": 0,
                "total_hours": 0,
                "average_performance": 0,
                "performance_by_conditions": {},
                "sessions_by_location": {}
            }

        # Calculate analytics
        total_hours = sum(s.hours_on_water for s in sessions)
        avg_performance = sum(s.performance_rating for s in sessions) / len(sessions)

        # Performance by conditions
        conditions_performance = defaultdict(list)
        for session in sessions:
            if session.is_heavy_weather():
                conditions_performance["heavy"].append(session.performance_rating)
            elif session.is_light_weather():
                conditions_performance["light"].append(session.performance_rating)
            else:
                conditions_performance["medium"].append(session.performance_rating)

        performance_by_conditions = {
            condition: sum(ratings) / len(ratings) if ratings else 0
            for condition, ratings in conditions_performance.items()
        }

        # Sessions by location
        sessions_by_location = defaultdict(int)
        for session in sessions:
            sessions_by_location[session.location] += 1

        return {
            "total_sessions": len(sessions),
            "total_hours": round(total_hours, 1),
            "average_performance": round(avg_performance, 2),
            "performance_by_conditions": performance_by_conditions,
            "sessions_by_location": dict(sessions_by_location)
        }