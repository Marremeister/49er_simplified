"""Session request/response schemas."""
from datetime import date, datetime
from typing import Optional, Literal, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.application.schemas.equipment_schemas import EquipmentResponse

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
    equipment_ids: List[UUID] = Field(default_factory=list, description="Equipment used in this session")


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
    equipment_ids: Optional[List[UUID]] = Field(None, description="Equipment used in this session")


class EquipmentSettingsBase(BaseModel):
    """Base equipment settings schema."""
    # Rig tensions
    forestay_tension: float = Field(..., ge=0, le=10)
    shroud_tension: float = Field(..., ge=0, le=10)
    mast_rake: float = Field(..., ge=-5, le=30)

    # New rig measurements with defaults
    main_tension: float = Field(default=0.0, ge=0, le=10)
    cap_tension: float = Field(default=0.0, ge=0, le=10)
    cap_hole: float = Field(default=0.0, ge=0)
    lowers_scale: float = Field(default=0.0, ge=0, le=10)
    mains_scale: float = Field(default=0.0, ge=0, le=10)
    pre_bend: float = Field(default=0.0, ge=-50, le=200)

    # Sail controls
    jib_halyard_tension: TensionLevel
    cunningham: float = Field(..., ge=0, le=10)
    outhaul: float = Field(..., ge=0, le=10)
    vang: float = Field(..., ge=0, le=10)


class EquipmentSettingsCreate(EquipmentSettingsBase):
    """Equipment settings creation schema."""
    pass


class EquipmentSettingsUpdate(BaseModel):
    """Equipment settings update schema."""
    # All fields optional for update
    forestay_tension: Optional[float] = Field(None, ge=0, le=10)
    shroud_tension: Optional[float] = Field(None, ge=0, le=10)
    mast_rake: Optional[float] = Field(None, ge=-5, le=30)

    main_tension: Optional[float] = Field(None, ge=0, le=10)
    cap_tension: Optional[float] = Field(None, ge=0, le=10)
    cap_hole: Optional[float] = Field(None, ge=0)
    lowers_scale: Optional[float] = Field(None, ge=0, le=10)
    mains_scale: Optional[float] = Field(None, ge=0, le=10)
    pre_bend: Optional[float] = Field(None, ge=-50, le=200)

    jib_halyard_tension: Optional[TensionLevel] = None
    cunningham: Optional[float] = Field(None, ge=0, le=10)
    outhaul: Optional[float] = Field(None, ge=0, le=10)
    vang: Optional[float] = Field(None, ge=0, le=10)


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


class SessionWithEquipmentResponse(SessionResponse):
    """Session response with equipment list."""
    equipment_used: List[EquipmentResponse] = Field(default_factory=list)


class SessionWithSettingsResponse(SessionResponse):
    """Session with equipment settings response."""
    equipment_settings: Optional[EquipmentSettingsResponse] = None
    equipment_used: List[EquipmentResponse] = Field(default_factory=list)


class PerformanceAnalytics(BaseModel):
    """Performance analytics response schema."""
    total_sessions: int
    total_hours: float
    average_performance: float
    performance_by_conditions: dict[str, float]
    sessions_by_location: dict[str, int]
    equipment_usage: dict[str, int] = Field(default_factory=dict, description="Equipment usage count by name")