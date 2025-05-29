from typing import Optional, List, Tuple
from datetime import date
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.session import SailingSession as SessionEntity
from app.domain.entities.equipment import EquipmentSettings as SettingsEntity, Equipment as EquipmentEntity
from app.infrastructure.database.models import (
    Session as SessionModel,
    Equipment as EquipmentModel,
    EquipmentSettings as SettingsModel,
)
from app.domain.repositories.session_repository import ISessionRepository


class SessionRepository(ISessionRepository):
    """Session repository implementation with equipment tracking."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, m: SessionModel) -> SessionEntity:
        """Convert database model to domain entity."""
        # Handle wave_type - it might be an enum or already a string
        wave_type_value = m.wave_type.value if hasattr(m.wave_type, 'value') else m.wave_type

        return SessionEntity(
            id=m.id,
            date=m.date,
            location=m.location,
            wind_speed_min=m.wind_speed_min,
            wind_speed_max=m.wind_speed_max,
            wave_type=wave_type_value,
            wave_direction=m.wave_direction,
            hours_on_water=m.hours_on_water,
            performance_rating=m.performance_rating,
            notes=m.notes,
            equipment_ids=[eq.id for eq in m.equipment_used] if hasattr(m, 'equipment_used') else [],
            created_by=m.created_by,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )

    async def _to_model(self, e: SessionEntity) -> SessionModel:
        """Convert domain entity to database model."""
        model = SessionModel(
            id=e.id,
            date=e.date,
            location=e.location,
            wind_speed_min=e.wind_speed_min,
            wind_speed_max=e.wind_speed_max,
            wave_type=e.wave_type,
            wave_direction=e.wave_direction,
            hours_on_water=e.hours_on_water,
            performance_rating=e.performance_rating,
            notes=e.notes,
            created_by=e.created_by,
            created_at=e.created_at,
            updated_at=e.updated_at,
        )

        # Load equipment if IDs provided
        if e.equipment_ids:
            stmt = select(EquipmentModel).where(EquipmentModel.id.in_(e.equipment_ids))
            result = await self.session.execute(stmt)
            model.equipment_used = list(result.scalars().all())

        return model

    async def create(self, entity: SessionEntity) -> SessionEntity:
        """Create a new session."""
        model = await self._to_model(entity)
        self.session.add(model)
        await self.session.flush()

        # Reload with relationships
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_used))
            .where(SessionModel.id == model.id)
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one()

        # Add wear to equipment
        for equipment in model.equipment_used:
            equipment.wear += entity.hours_on_water

        await self.session.flush()
        return self._to_entity(model)

    async def get_by_id(self, entity_id: UUID) -> Optional[SessionEntity]:
        """Get session by ID."""
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_used))
            .where(SessionModel.id == entity_id)
        )
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        return self._to_entity(m) if m else None

    async def update(self, entity: SessionEntity) -> SessionEntity:
        """Update an existing session."""
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_used))
            .where(SessionModel.id == entity.id)
        )
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            raise ValueError("Session not found")

        # Calculate wear difference if hours changed
        hours_diff = entity.hours_on_water - m.hours_on_water

        # Update basic fields
        m.date = entity.date
        m.location = entity.location
        m.wind_speed_min = entity.wind_speed_min
        m.wind_speed_max = entity.wind_speed_max
        m.wave_type = entity.wave_type
        m.wave_direction = entity.wave_direction
        m.hours_on_water = entity.hours_on_water
        m.performance_rating = entity.performance_rating
        m.notes = entity.notes
        m.updated_at = entity.updated_at

        # Update equipment if changed
        if entity.equipment_ids is not None:
            # Update wear for removed equipment (subtract hours)
            old_equipment_ids = {eq.id for eq in m.equipment_used}
            new_equipment_ids = set(entity.equipment_ids)

            removed_ids = old_equipment_ids - new_equipment_ids
            for eq in m.equipment_used:
                if eq.id in removed_ids:
                    eq.wear = max(0, eq.wear - m.hours_on_water)

            # Update equipment list
            stmt = select(EquipmentModel).where(EquipmentModel.id.in_(entity.equipment_ids))
            result = await self.session.execute(stmt)
            m.equipment_used = list(result.scalars().all())

            # Add wear to new equipment
            added_ids = new_equipment_ids - old_equipment_ids
            for eq in m.equipment_used:
                if eq.id in added_ids:
                    eq.wear += entity.hours_on_water
                elif hours_diff != 0:
                    # Adjust wear for existing equipment if hours changed
                    eq.wear += hours_diff

        await self.session.flush()
        await self.session.refresh(m)
        return self._to_entity(m)

    async def delete(self, entity_id: UUID) -> bool:
        """Delete a session by ID."""
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_used))
            .where(SessionModel.id == entity_id)
        )
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            return False

        # Subtract wear from equipment
        for eq in m.equipment_used:
            eq.wear = max(0, eq.wear - m.hours_on_water)

        await self.session.delete(m)
        await self.session.flush()
        return True

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[SessionEntity]:
        """List all sessions with pagination."""
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_used))
            .offset(skip)
            .limit(limit)
            .order_by(SessionModel.date.desc())
        )
        res = await self.session.execute(stmt)
        return [self._to_entity(x) for x in res.scalars().all()]

    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[SessionEntity]:
        """Get all sessions for a specific user."""
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_used))
            .where(SessionModel.created_by == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(SessionModel.date.desc())
        )
        res = await self.session.execute(stmt)
        return [self._to_entity(x) for x in res.scalars().all()]

    async def get_by_date_range(self, user_id: UUID, start_date: date, end_date: date) -> List[SessionEntity]:
        """Get sessions within a date range for a user."""
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_used))
            .where(
                and_(
                    SessionModel.created_by == user_id,
                    SessionModel.date >= start_date,
                    SessionModel.date <= end_date
                )
            )
            .order_by(SessionModel.date.desc())
        )
        res = await self.session.execute(stmt)
        return [self._to_entity(x) for x in res.scalars().all()]

    async def get_with_settings(self, session_id: UUID) -> Optional[Tuple[SessionEntity, Optional[SettingsEntity]]]:
        """Get session with its equipment settings."""
        stmt = (
            select(SessionModel)
            .options(
                selectinload(SessionModel.equipment_settings),
                selectinload(SessionModel.equipment_used)
            )
            .where(SessionModel.id == session_id)
        )
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            return None
        return self._to_entity(m), self._settings_to_entity(m.equipment_settings) if m.equipment_settings else None

    async def get_session_equipment(self, session_id: UUID) -> List[EquipmentEntity]:
        """Get all equipment used in a session."""
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_used))
            .where(SessionModel.id == session_id)
        )
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            return []

        # Convert equipment models to entities
        equipment_entities = []
        for eq in m.equipment_used:
            equipment_entities.append(EquipmentEntity(
                id=eq.id,
                name=eq.name,
                type=eq.type.value,
                manufacturer=eq.manufacturer,
                model=eq.model,
                purchase_date=eq.purchase_date,
                notes=eq.notes,
                active=eq.active,
                wear=eq.wear,
                owner_id=eq.owner_id,
                created_at=eq.created_at,
                updated_at=eq.updated_at
            ))

        return equipment_entities

    async def create_settings(self, settings: SettingsEntity) -> SettingsEntity:
        """Create equipment settings for a session."""
        m = self._settings_to_model(settings)
        self.session.add(m)
        await self.session.flush()
        await self.session.refresh(m)
        return self._settings_to_entity(m)

    async def update_settings(self, settings: SettingsEntity) -> SettingsEntity:
        """Update equipment settings for a session."""
        stmt = select(SettingsModel).where(SettingsModel.id == settings.id)
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            raise ValueError("Equipment settings not found")

        # Update all fields
        m.forestay_tension = settings.forestay_tension
        m.shroud_tension = settings.shroud_tension
        m.mast_rake = settings.mast_rake
        m.main_tension = settings.main_tension
        m.cap_tension = settings.cap_tension
        m.cap_hole = settings.cap_hole
        m.lowers_scale = settings.lowers_scale
        m.mains_scale = settings.mains_scale
        m.pre_bend = settings.pre_bend
        m.jib_halyard_tension = settings.jib_halyard_tension
        m.cunningham = settings.cunningham
        m.outhaul = settings.outhaul
        m.vang = settings.vang

        await self.session.flush()
        await self.session.refresh(m)
        return self._settings_to_entity(m)

    async def get_settings_by_session(self, session_id: UUID) -> Optional[SettingsEntity]:
        """Get equipment settings for a specific session."""
        stmt = select(SettingsModel).where(SettingsModel.session_id == session_id)
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        return self._settings_to_entity(m) if m else None

    def _settings_to_entity(self, m: Optional[SettingsModel]) -> Optional[SettingsEntity]:
        """Convert settings model to entity."""
        if not m:
            return None

        # Handle jib_halyard_tension - it might be an enum or already a string
        jib_tension_value = m.jib_halyard_tension.value if hasattr(m.jib_halyard_tension,
                                                                   'value') else m.jib_halyard_tension

        return SettingsEntity(
            id=m.id,
            session_id=m.session_id,
            forestay_tension=m.forestay_tension,
            shroud_tension=m.shroud_tension,
            mast_rake=m.mast_rake,
            jib_halyard_tension=jib_tension_value,
            cunningham=m.cunningham,
            outhaul=m.outhaul,
            vang=m.vang,
            main_tension=m.main_tension or 0.0,
            cap_tension=m.cap_tension or 0.0,
            cap_hole=m.cap_hole or 0.0,
            lowers_scale=m.lowers_scale or 0.0,
            mains_scale=m.mains_scale or 0.0,
            pre_bend=m.pre_bend or 0.0,
            created_at=m.created_at
        )

    def _settings_to_model(self, e: SettingsEntity) -> SettingsModel:
        """Convert settings entity to model."""
        return SettingsModel(
            id=e.id,
            session_id=e.session_id,
            forestay_tension=e.forestay_tension,
            shroud_tension=e.shroud_tension,
            mast_rake=e.mast_rake,
            jib_halyard_tension=e.jib_halyard_tension,
            cunningham=e.cunningham,
            outhaul=e.outhaul,
            vang=e.vang,
            main_tension=e.main_tension,
            cap_tension=e.cap_tension,
            cap_hole=e.cap_hole,
            lowers_scale=e.lowers_scale,
            mains_scale=e.mains_scale,
            pre_bend=e.pre_bend,
            created_at=e.created_at
        )