"""Equipment request/response schemas."""
from datetime import date, datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

EquipmentType = Literal["Mainsail", "Jib", "Gennaker", "Mast", "Boom", "Rudder", "Centerboard", "Other"]


class EquipmentBase(BaseModel):
    """Base equipment schema."""
    name: str = Field(..., min_length=1, max_length=100)
    type: EquipmentType
    manufacturer: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    purchase_date: Optional[date] = None
    notes: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    """Equipment creation schema."""
    pass


class EquipmentUpdate(BaseModel):
    """Equipment update schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[EquipmentType] = None
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    purchase_date: Optional[date] = None
    notes: Optional[str] = None


class EquipmentResponse(EquipmentBase):
    """Equipment response schema."""
    id: UUID
    active: bool
    wear: float = Field(..., description="Total hours of use")
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    age_in_days: Optional[int] = None
    needs_replacement: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class EquipmentStatistics(BaseModel):
    """Equipment statistics response schema."""
    total_equipment: int
    active_equipment: int
    retired_equipment: int
    equipment_by_type: dict[str, int]
    oldest_equipment: Optional[str]
    newest_equipment: Optional[str]
    most_worn_equipment: Optional[dict[str, float]] = None  # name: wear_hours