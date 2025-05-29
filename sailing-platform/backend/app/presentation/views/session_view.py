"""Session view for formatting sailing session responses."""
from typing import List, Dict, Any, Optional

from app.domain.entities.session import SailingSession
from app.domain.entities.equipment import EquipmentSettings, Equipment
from app.application.schemas.session_schemas import (
    SessionResponse,
    SessionWithEquipmentResponse,
    SessionWithSettingsResponse,
    EquipmentSettingsResponse,
    PerformanceAnalytics
)
from app.application.schemas.equipment_schemas import EquipmentResponse


class SessionView:
    """View for formatting session responses."""

    @staticmethod
    def format_session_response(session: SailingSession) -> SessionResponse:
        """Format a single session response."""
        return SessionResponse(
            id=session.id,
            date=session.date,
            location=session.location,
            wind_speed_min=session.wind_speed_min,
            wind_speed_max=session.wind_speed_max,
            wave_type=session.wave_type,
            wave_direction=session.wave_direction,
            hours_on_water=session.hours_on_water,
            performance_rating=session.performance_rating,
            notes=session.notes,
            created_by=session.created_by,
            created_at=session.created_at,
            updated_at=session.updated_at
        )

    @staticmethod
    def format_session_with_equipment_response(
            session: SailingSession,
            equipment: List[Equipment]
    ) -> SessionWithEquipmentResponse:
        """Format session with equipment list."""
        session_response = SessionView.format_session_response(session)

        equipment_responses = [
            EquipmentResponse(
                id=eq.id,
                name=eq.name,
                type=eq.type,
                manufacturer=eq.manufacturer,
                model=eq.model,
                purchase_date=eq.purchase_date,
                notes=eq.notes,
                active=eq.active,
                wear=eq.wear,
                owner_id=eq.owner_id,
                created_at=eq.created_at,
                updated_at=eq.updated_at,
                age_in_days=eq.age_in_days,
                needs_replacement=eq.needs_replacement()
            )
            for eq in equipment
        ]

        return SessionWithEquipmentResponse(
            **session_response.model_dump(),
            equipment_used=equipment_responses
        )

    @staticmethod
    def format_sessions_list_response(sessions: List[SailingSession]) -> List[SessionResponse]:
        """Format a list of sessions."""
        return [
            SessionView.format_session_response(session)
            for session in sessions
        ]

    @staticmethod
    def format_equipment_settings_response(settings: EquipmentSettings) -> EquipmentSettingsResponse:
        """Format equipment settings response."""
        return EquipmentSettingsResponse(
            id=settings.id,
            session_id=settings.session_id,
            # Rig tensions
            forestay_tension=settings.forestay_tension,
            shroud_tension=settings.shroud_tension,
            mast_rake=settings.mast_rake,
            # New rig measurements
            main_tension=settings.main_tension,
            cap_tension=settings.cap_tension,
            cap_hole=settings.cap_hole,
            lowers_scale=settings.lowers_scale,
            mains_scale=settings.mains_scale,
            pre_bend=settings.pre_bend,
            # Sail controls
            jib_halyard_tension=settings.jib_halyard_tension,
            cunningham=settings.cunningham,
            outhaul=settings.outhaul,
            vang=settings.vang,
            created_at=settings.created_at
        )

    @staticmethod
    def format_session_with_settings_response(
            session: SailingSession,
            settings: Optional[EquipmentSettings],
            equipment: Optional[List[Equipment]] = None
    ) -> SessionWithSettingsResponse:
        """Format session with equipment settings response."""
        session_response = SessionView.format_session_response(session)

        equipment_responses = []
        if equipment:
            equipment_responses = [
                EquipmentResponse(
                    id=eq.id,
                    name=eq.name,
                    type=eq.type,
                    manufacturer=eq.manufacturer,
                    model=eq.model,
                    purchase_date=eq.purchase_date,
                    notes=eq.notes,
                    active=eq.active,
                    wear=eq.wear,
                    owner_id=eq.owner_id,
                    created_at=eq.created_at,
                    updated_at=eq.updated_at,
                    age_in_days=eq.age_in_days,
                    needs_replacement=eq.needs_replacement()
                )
                for eq in equipment
            ]

        return SessionWithSettingsResponse(
            **session_response.model_dump(),
            equipment_settings=(
                SessionView.format_equipment_settings_response(settings)
                if settings else None
            ),
            equipment_used=equipment_responses
        )

    @staticmethod
    def format_performance_analytics_response(analytics: Dict[str, Any]) -> PerformanceAnalytics:
        """Format performance analytics response."""
        return PerformanceAnalytics(
            total_sessions=analytics["total_sessions"],
            total_hours=analytics["total_hours"],
            average_performance=analytics["average_performance"],
            performance_by_conditions=analytics["performance_by_conditions"],
            sessions_by_location=analytics["sessions_by_location"]
        )

    @staticmethod
    def format_deletion_response(success: bool, message: str) -> Dict[str, Any]:
        """Format deletion response."""
        return {
            "success": success,
            "message": message
        }