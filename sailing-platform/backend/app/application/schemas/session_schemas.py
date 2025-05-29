"""Session request/response schemas."""
from datetime import date, datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

WaveType = Literal["Flat", "Choppy", "Medium", "Large"]
TensionLevel = Literal["Loose", "Medium", "Tight"]


class SessionBase(BaseModel):
    """Base session schema."""
    date: date
    location: str = Field(..., min_length=1, max_length=255)
    wind_speed_min: float = Field(..., ge=0, le=60)
    wind_speed_max: float = Field(..., ge=0, le=60)
    wave_type: WaveType
    wave_direction: str = Field(..., min_length=1, max_length=50)
    hours_on_water: float = Field(..., gt=0, le=12)
    performance_rating: int = Field(..., ge=1, le=5)
    notes: Optional[str] = None


class SessionCreate(SessionBase):
    """Session creation schema."""
    pass


class SessionUpdate(BaseModel):
    """Session update schema."""
    date: Optional[date] = None
    location: Optional[str] = Field(None, min_length=1, max_length=255)
    wind_speed_min: Optional[float] = Field(None, ge=0, le=60)
    wind_speed_max: Optional[float] = Field(None, ge=0, le=60)
    wave_type: Optional[WaveType] = None
    wave_direction: Optional[str] = Field(None, min_length=1, max_length=50)
    hours_on_water: Optional[float] = Field(None, gt=0, le=12)
    performance_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class EquipmentSettingsBase(BaseModel):
    """Base equipment settings schema."""
    forestay_tension: float = Field(..., ge=0, le=10)
    shroud_tension: float = Field(..., ge=0, le=10)
    mast_rake: float = Field(..., ge=-5, le=30)
    jib_halyard_tension: TensionLevel
    cunningham: float = Field(..., ge=0, le=10)
    outhaul: float = Field(..., ge=0, le=10)
    vang: float = Field(..., ge=0, le=10)


class EquipmentSettingsCreate(EquipmentSettingsBase):
    """Equipment settings creation schema."""
    pass


class EquipmentSettingsResponse(EquipmentSettingsBase):
    """Equipment settings response schema."""
    id: UUID
    session_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionResponse(SessionBase):
    """Session response schema."""
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionWithSettingsResponse(SessionResponse):
    """Session with equipment settings response."""
    equipment_settings: Optional[EquipmentSettingsResponse] = None


class PerformanceAnalytics(BaseModel):
    """Performance analytics response schema."""
    total_sessions: int
    total_hours: float
    average_performance: float
    performance_by_conditions: dict[str, float]
    sessions_by_location: dict[str, int]