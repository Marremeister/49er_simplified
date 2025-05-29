# app/infrastructure/database/models.py
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Float,
    Integer, Date, Text, ForeignKey, Enum, Table
)
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
    GENNAKER = "Gennaker"
    MAST = "Mast"
    BOOM = "Boom"
    RUDDER = "Rudder"
    CENTERBOARD = "Centerboard"
    OTHER = "Other"


class TensionLevelEnum(str, enum.Enum):
    LOOSE = "Loose"
    MEDIUM = "Medium"
    TIGHT = "Tight"


# Association table for session equipment (many-to-many)
session_equipment = Table(
    "session_equipment", Base.metadata,
    Column("session_id", PG_UUID(as_uuid=True), ForeignKey("sessions.id"), primary_key=True),
    Column("equipment_id", PG_UUID(as_uuid=True), ForeignKey("equipment.id"), primary_key=True),
    Column("created_at", DateTime, default=lambda: datetime.now(timezone.utc))
)


class User(Base):
    __tablename__ = "users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    equipment = relationship("Equipment", back_populates="owner", cascade="all, delete-orphan")


class Session(Base):
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
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="sessions")
    equipment_settings = relationship(
        "EquipmentSettings",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Equipment used in this session
    equipment_used = relationship(
        "Equipment",
        secondary=session_equipment,
        back_populates="sessions_used_in",
        lazy="selectin"
    )


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    type = Column(Enum(EquipmentTypeEnum), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    purchase_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    wear = Column(Float, default=0.0, nullable=False)  # Total hours of use

    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="equipment")
    sessions_used_in = relationship(
        "Session",
        secondary=session_equipment,
        back_populates="equipment_used"
    )


class EquipmentSettings(Base):
    __tablename__ = "equipment_settings"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(PG_UUID(as_uuid=True), ForeignKey("sessions.id"), unique=True, nullable=False)

    # Rig tensions
    forestay_tension = Column(Float, nullable=False)
    shroud_tension = Column(Float, nullable=False)
    mast_rake = Column(Float, nullable=False)

    # New tension measurements
    main_tension = Column(Float, nullable=True, default=0.0)
    cap_tension = Column(Float, nullable=True, default=0.0)
    cap_hole = Column(Float, nullable=True, default=0.0)
    lowers_scale = Column(Float, nullable=True, default=0.0)
    mains_scale = Column(Float, nullable=True, default=0.0)
    pre_bend = Column(Float, nullable=True, default=0.0)

    # Sail controls
    jib_halyard_tension = Column(Enum(TensionLevelEnum), nullable=False)
    cunningham = Column(Float, nullable=False)
    outhaul = Column(Float, nullable=False)
    vang = Column(Float, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("Session", back_populates="equipment_settings")