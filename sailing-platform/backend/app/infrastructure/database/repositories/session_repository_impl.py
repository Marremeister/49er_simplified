from typing import Optional, List, Tuple
from datetime import date
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.session import SailingSession as SessionEntity
from app.domain.entities.equipment import EquipmentSettings as SettingsEntity
from app.infrastructure.database.models import (
    Session as SessionModel,
    Equipment as EquipmentModel,
    EquipmentSettings as SettingsModel,
)
from app.domain.repositories.session_repository import ISessionRepository


class SessionRepository(ISessionRepository):
    """Session repository implementation with mast, boat, sails and wear-tracking."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, m: SessionModel) -> SessionEntity:
        return SessionEntity(
            id=m.id,
            date=m.date,
            location=m.location,
            wind_speed_min=m.wind_speed_min,
            wind_speed_max=m.wind_speed_max,
            wave_type=m.wave_type.value,
            wave_direction=m.wave_direction,
            hours_on_water=m.hours_on_water,
            performance_rating=m.performance_rating,
            notes=m.notes,
            boat_id=m.boat_id,
            mast_id=m.mast_id,
            sail_ids=[s.id for s in m.sails],
            created_by=m.created_by,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )

    def _to_model(self, e: SessionEntity) -> SessionModel:
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
            boat_id=e.boat_id,
            mast_id=e.mast_id,
            created_by=e.created_by,
            created_at=e.created_at,
            updated_at=e.updated_at,
        )
        if e.sail_ids:
            stmt = select(EquipmentModel).where(EquipmentModel.id.in_(e.sail_ids))
            sails = self.session.execute(stmt)
            model.sails = sails.scalars().all()
        return model

    async def create(self, entity: SessionEntity) -> SessionEntity:
        model = self._to_model(entity)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        await self._increment_wear(model, entity.hours_on_water)
        return self._to_entity(model)

    async def get_by_id(self, entity_id: UUID) -> Optional[SessionEntity]:
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.sails))
            .where(SessionModel.id == entity_id)
        )
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        return self._to_entity(m) if m else None

    async def update(self, entity: SessionEntity) -> SessionEntity:
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.sails))
            .where(SessionModel.id == entity.id)
        )
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            raise ValueError("Session not found")

        m.date               = entity.date
        m.location           = entity.location
        m.wind_speed_min     = entity.wind_speed_min
        m.wind_speed_max     = entity.wind_speed_max
        m.wave_type          = entity.wave_type
        m.wave_direction     = entity.wave_direction
        m.hours_on_water     = entity.hours_on_water
        m.performance_rating = entity.performance_rating
        m.notes              = entity.notes
        m.boat_id            = entity.boat_id
        m.mast_id            = entity.mast_id
        m.updated_at         = entity.updated_at
        if entity.sail_ids is not None:
            stmt = select(EquipmentModel).where(EquipmentModel.id.in_(entity.sail_ids))
            sails = await self.session.execute(stmt)
            m.sails = sails.scalars().all()
        await self.session.flush()
        await self.session.refresh(m)
        await self._increment_wear(m, entity.hours_on_water)
        return self._to_entity(m)

    async def delete(self, entity_id: UUID) -> bool:
        stmt = select(SessionModel).where(SessionModel.id == entity_id)
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            return False
        await self.session.delete(m)
        await self.session.flush()
        return True

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[SessionEntity]:
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.sails))
            .offset(skip)
            .limit(limit)
            .order_by(SessionModel.date.desc())
        )
        res = await self.session.execute(stmt)
        return [self._to_entity(x) for x in res.scalars().all()]

    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[SessionEntity]:
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.sails))
            .where(SessionModel.created_by == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(SessionModel.date.desc())
        )
        res = await self.session.execute(stmt)
        return [self._to_entity(x) for x in res.scalars().all()]

    async def get_by_date_range(self, user_id: UUID, start_date: date, end_date: date) -> List[SessionEntity]:
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.sails))
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

    async def _increment_wear(self, session_model: SessionModel, hours: float):
        if session_model.mast_id:
            mast = await self.session.get(EquipmentModel, session_model.mast_id)
            mast.wear = (mast.wear or 0.0) + hours
        for s in session_model.sails:
            s.wear = (s.wear or 0.0) + hours
        await self.session.flush()

    async def get_with_settings(self, session_id: UUID) -> Optional[Tuple[SessionEntity, SettingsEntity]]:
        stmt = (
            select(SessionModel)
            .options(selectinload(SessionModel.equipment_settings))
            .where(SessionModel.id == session_id)
        )
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            return None
        return self._to_entity(m), self._settings_to_entity(m.equipment_settings)

    async def create_settings(self, settings: SettingsEntity) -> SettingsEntity:
        m = self._settings_to_model(settings)
        self.session.add(m)
        await self.session.flush()
        await self.session.refresh(m)
        return self._settings_to_entity(m)

    async def update_settings(self, settings: SettingsEntity) -> SettingsEntity:
        stmt = select(SettingsModel).where(SettingsModel.id == settings.id)
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        if not m:
            raise ValueError("Equipment settings not found")
        m.forestay_tension    = settings.forestay_tension
        m.lower_tension       = settings.lower_tension
        m.lowers_scale        = settings.lowers_scale
        m.main_tension        = settings.main_tension
        m.mains_scale         = settings.mains_scale
        m.cap_tension         = settings.cap_tension
        m.cap_hole            = settings.cap_hole
        m.pre_bend            = settings.pre_bend
        m.jib_halyard_tension = settings.jib_halyard_tension
        m.cunningham          = settings.cunningham
        m.outhaul             = settings.outhaul
        m.vang                = settings.vang
        await self.session.flush()
        await self.session.refresh(m)
        return self._settings_to_entity(m)

    async def get_settings_by_session(self, session_id: UUID) -> Optional[SettingsEntity]:
        stmt = select(SettingsModel).where(SettingsModel.session_id == session_id)
        res = await self.session.execute(stmt)
        m = res.scalar_one_or_none()
        return self._settings_to_entity(m) if m else None