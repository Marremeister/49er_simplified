"""Session repository implementation using SQLAlchemy."""
from typing import Optional, List
from datetime import date
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.session import SailingSession as SessionEntity
from app.domain.entities.equipment import EquipmentSettings as SettingsEntity
from app.domain.repositories.session_repository import ISessionRepository
from app.infrastructure.database.models import Session as SessionModel, EquipmentSettings as SettingsModel


class SessionRepository(ISessionRepository):
    """Session repository implementation."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: SessionModel) -> SessionEntity:
        """Convert database model to domain entity."""
        return SessionEntity(
            id=model.id,
            date=model.date,
            location=model.location,
            wind_speed_min=model.wind_speed_min,
            wind_speed_max=model.wind_speed_max,
            wave_type=model.wave_type.value,
            wave_direction=model.wave_direction,
            hours_on_water=model.hours_on_water,
            performance_rating=model.performance_rating,
            notes=model.notes,
            created_by=model.created_by,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    def _to_model(self, entity: SessionEntity) -> SessionModel:
        """Convert domain entity to database model."""
        return SessionModel(
            id=entity.id,
            date=entity.date,
            location=entity.location,
            wind_speed_min=entity.wind_speed_min,
            wind_speed_max=entity.wind_speed_max,
            wave_type=entity.wave_type,
            wave_direction=entity.wave_direction,
            hours_on_water=entity.hours_on_water,
            performance_rating=entity.performance_rating,
            notes=entity.notes,
            created_by=entity.created_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )

    def _settings_to_entity(self, model: SettingsModel) -> SettingsEntity:
        """Convert settings model to entity."""
        return SettingsEntity(
            id=model.id,
            session_id=model.session_id,
            forestay_tension=model.forestay_tension,
            shroud_tension=model.shroud_tension,
            mast_rake=model.mast_rake,
            jib_halyard_tension=model.jib_halyard_tension.value,
            cunningham=model.cunningham,
            outhaul=model.outhaul,
            vang=model.vang,
            created_at=model.created_at
        )

    def _settings_to_model(self, entity: SettingsEntity) -> SettingsModel:
        """Convert settings entity to model."""
        return SettingsModel(
            id=entity.id,
            session_id=entity.session_id,
            forestay_tension=entity.forestay_tension,
            shroud_tension=entity.shroud_tension,
            mast_rake=entity.mast_rake,
            jib_halyard_tension=entity.jib_halyard_tension,
            cunningham=entity.cunningham,
            outhaul=entity.outhaul,
            vang=entity.vang,
            created_at=entity.created_at
        )

    async def create(self, entity: SessionEntity) -> SessionEntity:
        """Create a new session."""
        model = self._to_model(entity)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, entity_id: UUID) -> Optional[SessionEntity]:
        """Get session by ID."""
        stmt = select(SessionModel).where(SessionModel.id == entity_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def update(self, entity: SessionEntity) -> SessionEntity:
        """Update an existing session."""
        stmt = select(SessionModel).where(SessionModel.id == entity.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            raise ValueError("Session not found")

        # Update fields
        model.date = entity.date
        model.location = entity.location
        model.wind_speed_min = entity.wind_speed_min
        model.wind_speed_max = entity.wind_speed_max
        model.wave_type = entity.wave_type
        model.wave_direction = entity.wave_direction
        model.hours_on_water = entity.hours_on_water
        model.performance_rating = entity.performance_rating
        model.notes = entity.notes
        model.updated_at = entity.updated_at

        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def delete(self, entity_id: UUID) -> bool:
        """Delete a session by ID."""
        stmt = select(SessionModel).where(SessionModel.id == entity_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            return False

        await self.session.delete(model)
        await self.session.flush()
        return True

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[SessionEntity]:
        """List all sessions with pagination."""
        stmt = select(SessionModel).offset(skip).limit(limit).order_by(SessionModel.date.desc())
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]

    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[SessionEntity]:
        """Get all sessions for a specific user."""
        stmt = (
            select(SessionModel)
            .where(SessionModel.created_by == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(SessionModel.date.desc())
        )
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]

    async def get_by_date_range(
            self,
            user_id: UUID,
            start_date: date,
            end_date: date
    ) -> List[SessionEntity]:
        """Get sessions within a date range for a user."""
        stmt = (
            select(SessionModel)
            .where(
                and_(
                    SessionModel.created_by == user_id,
                    SessionModel.date >= start_date,
                    SessionModel.date <= end_date
                )
            )
            .order_by(SessionModel.date.desc())
        )
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]

    async def get_with_settings(self, session_id: UUID) -> Optional[tuple[SessionEntity, Optional[SettingsEntity]]]:
        """Get session with its equipment settings."""
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_settings))
            .where(SessionModel.id == session_id)
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            return None

        session_entity = self._to_entity(model)
        settings_entity = self._settings_to_entity(model.equipment_settings) if model.equipment_settings else None

        return session_entity, settings_entity

    async def create_settings(self, settings: SettingsEntity) -> SettingsEntity:
        """Create equipment settings for a session."""
        model = self._settings_to_model(settings)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._settings_to_entity(model)

    async def update_settings(self, settings: SettingsEntity) -> SettingsEntity:
        """Update equipment settings for a session."""
        stmt = select(SettingsModel).where(SettingsModel.id == settings.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            raise ValueError("Equipment settings not found")

        # Update fields
        model.forestay_tension = settings.forestay_tension
        model.shroud_tension = settings.shroud_tension
        model.mast_rake = settings.mast_rake
        model.jib_halyard_tension = settings.jib_halyard_tension
        model.cunningham = settings.cunningham
        model.outhaul = settings.outhaul
        model.vang = settings.vang

        await self.session.flush()
        await self.session.refresh(model)
        return self._settings_to_entity(model)

    async def get_settings_by_session(self, session_id: UUID) -> Optional[SettingsEntity]:
        """Get equipment settings for a specific session."""
        stmt = select(SettingsModel).where(SettingsModel.session_id == session_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._settings_to_entity(model) if model else None