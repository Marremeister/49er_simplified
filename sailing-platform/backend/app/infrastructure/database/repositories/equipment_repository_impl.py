from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.equipment import Equipment as EquipmentEntity, EquipmentType
from app.domain.repositories.equipment_repository import IEquipmentRepository
from app.infrastructure.database.models import Equipment as EquipmentModel


class EquipmentRepository(IEquipmentRepository):
    """Equipment repository implementation."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: EquipmentModel) -> EquipmentEntity:
        """Convert database model to domain entity."""
        # Handle type - it might be an enum or already a string
        type_value = model.type.value if hasattr(model.type, 'value') else model.type

        return EquipmentEntity(
            id=model.id,
            name=model.name,
            type=type_value,
            manufacturer=model.manufacturer,
            model=model.model,
            purchase_date=model.purchase_date,
            notes=model.notes,
            active=model.active,
            wear=model.wear,
            owner_id=model.owner_id,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    def _to_model(self, entity: EquipmentEntity) -> EquipmentModel:
        """Convert domain entity to database model."""
        return EquipmentModel(
            id=entity.id,
            name=entity.name,
            type=entity.type,
            manufacturer=entity.manufacturer,
            model=entity.model,
            purchase_date=entity.purchase_date,
            notes=entity.notes,
            active=entity.active,
            wear=entity.wear,
            owner_id=entity.owner_id,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )

    async def create(self, entity: EquipmentEntity) -> EquipmentEntity:
        """Create new equipment."""
        model = self._to_model(entity)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, entity_id: UUID) -> Optional[EquipmentEntity]:
        """Get equipment by ID."""
        stmt = select(EquipmentModel).where(EquipmentModel.id == entity_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def update(self, entity: EquipmentEntity) -> EquipmentEntity:
        """Update existing equipment."""
        stmt = select(EquipmentModel).where(EquipmentModel.id == entity.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            raise ValueError("Equipment not found")

        model.name = entity.name
        model.type = entity.type
        model.manufacturer = entity.manufacturer
        model.model = entity.model
        model.purchase_date = entity.purchase_date
        model.notes = entity.notes
        model.active = entity.active
        model.wear = entity.wear
        model.updated_at = entity.updated_at

        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def delete(self, entity_id: UUID) -> bool:
        """Delete equipment by ID."""
        stmt = select(EquipmentModel).where(EquipmentModel.id == entity_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            return False

        await self.session.delete(model)
        await self.session.flush()
        return True

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[EquipmentEntity]:
        """List all equipment with pagination."""
        stmt = select(EquipmentModel).offset(skip).limit(limit).order_by(EquipmentModel.created_at.desc())
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def get_by_user(self, user_id: UUID, active_only: bool = True) -> List[EquipmentEntity]:
        """Get all equipment for a specific user."""
        conditions = [EquipmentModel.owner_id == user_id]
        if active_only:
            conditions.append(EquipmentModel.active == True)

        stmt = select(EquipmentModel).where(and_(*conditions)).order_by(EquipmentModel.name)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_type(self, user_id: UUID, equipment_type: EquipmentType) -> List[EquipmentEntity]:
        """Get equipment by type for a user."""
        stmt = (
            select(EquipmentModel)
            .where(
                and_(
                    EquipmentModel.owner_id == user_id,
                    EquipmentModel.type == equipment_type
                )
            )
            .order_by(EquipmentModel.name)
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def retire(self, equipment_id: UUID) -> bool:
        """Retire equipment by ID."""
        stmt = select(EquipmentModel).where(EquipmentModel.id == equipment_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            return False

        model.active = False
        await self.session.flush()
        return True

    async def reactivate(self, equipment_id: UUID) -> bool:
        """Reactivate retired equipment."""
        stmt = select(EquipmentModel).where(EquipmentModel.id == equipment_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if not model:
            return False

        model.active = True
        await self.session.flush()
        return True