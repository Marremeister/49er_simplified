"""SQLAlchemy database models."""
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Date, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.infrastructure.database.connection import Base


# Enums for database
class WaveTypeEnum(str, enum.Enum):
    FLAT = "Flat"
    CHOPPY = "Choppy"
    MEDIUM = "Medium"
    LARGE = "Large"


class EquipmentTypeEnum(str, enum.Enum):
    MAINSAIL = "Mainsail"
    JIB = "Jib"
    MAST = "Mast"
    BOOM = "Boom"
    RUDDER = "Rudder"
    CENTERBOARD = "Centerboard"
    OTHER = "Other"


class TensionLevelEnum(str, enum.Enum):
    LOOSE = "Loose"
    MEDIUM = "Medium"
    TIGHT = "Tight"


class User(Base):
    """User database model."""
    __tablename__ = "users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    equipment = relationship("Equipment", back_populates="owner", cascade="all, delete-orphan")


class Session(Base):
    """Sailing session database model."""
    __tablename__ = "sessions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(Date, nullable=False, index=True)
    location = Column(String(255), nullable=False)
    wind_speed_min = Column(Float, nullable=False)
    wind_speed_max = Column(Float, nullable=False)
    wave_type = Column(Enum(WaveTypeEnum), nullable=False)
    wave_direction = Column(String(50), nullable=False)
    hours_on_water = Column(Float, nullable=False)
    performance_rating = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="sessions")
    equipment_settings = relationship(
        "EquipmentSettings",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan"
    )


class Equipment(Base):
    """Equipment database model."""
    __tablename__ = "equipment"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    type = Column(Enum(EquipmentTypeEnum), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    purchase_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="equipment")


class EquipmentSettings(Base):
    """Equipment settings for a sailing session."""
    __tablename__ = "equipment_settings"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(PG_UUID(as_uuid=True), ForeignKey("sessions.id"), unique=True, nullable=False)
    forestay_tension = Column(Float, nullable=False)
    shroud_tension = Column(Float, nullable=False)
    mast_rake = Column(Float, nullable=False)
    jib_halyard_tension = Column(Enum(TensionLevelEnum), nullable=False)
    cunningham = Column(Float, nullable=False)
    outhaul = Column(Float, nullable=False)
    vang = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    session = relationship("Session", back_populates="equipment_settings")