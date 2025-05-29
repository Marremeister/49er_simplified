"""Equipment domain entities with business logic."""
from datetime import date, datetime, timezone
from typing import Optional, Literal
from uuid import UUID, uuid4
from dataclasses import dataclass, field


EquipmentType = Literal["Mainsail", "Jib", "Gennaker", "Mast", "Boom", "Rudder", "Centerboard", "Other"]
TensionLevel = Literal["Loose", "Medium", "Tight"]


@dataclass
class Equipment:
    """Equipment domain entity."""

    name: str
    type: EquipmentType
    manufacturer: str
    model: str
    owner_id: UUID
    purchase_date: Optional[date] = None
    notes: Optional[str] = None
    active: bool = True
    wear: float = 0.0  # Total hours of use
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        """Validate equipment data after initialization."""
        self._validate_name()
        self._validate_type()
        self._validate_wear()

    def _validate_name(self) -> None:
        """Validate equipment name."""
        if not self.name or len(self.name.strip()) < 1:
            raise ValueError("Equipment name cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Equipment name too long")

    def _validate_type(self) -> None:
        """Validate equipment type."""
        valid_types = ["Mainsail", "Jib", "Gennaker", "Mast", "Boom", "Rudder", "Centerboard", "Other"]
        if self.type not in valid_types:
            raise ValueError(f"Equipment type must be one of: {', '.join(valid_types)}")

    def _validate_wear(self) -> None:
        """Validate wear value."""
        if self.wear < 0:
            raise ValueError("Wear cannot be negative")

    def retire(self) -> None:
        """Retire the equipment."""
        self.active = False
        self.updated_at = datetime.now(timezone.utc)

    def reactivate(self) -> None:
        """Reactivate retired equipment."""
        self.active = True
        self.updated_at = datetime.now(timezone.utc)

    def add_wear(self, hours: float) -> None:
        """Add wear hours to equipment."""
        if hours < 0:
            raise ValueError("Cannot add negative wear hours")
        self.wear += hours
        self.updated_at = datetime.now(timezone.utc)

    @property
    def age_in_days(self) -> Optional[int]:
        """Calculate equipment age in days."""
        if self.purchase_date:
            return (date.today() - self.purchase_date).days
        return None

    def is_old(self, threshold_days: int = 730) -> bool:
        """Check if equipment is old (default: 2 years)."""
        age = self.age_in_days
        return age is not None and age > threshold_days

    def needs_replacement(self, wear_threshold: float = 500.0) -> bool:
        """Check if equipment needs replacement based on wear."""
        return self.wear > wear_threshold


@dataclass
class EquipmentSettings:
    """Equipment settings for a specific sailing session."""

    session_id: UUID

    # Rig tensions
    forestay_tension: float      # 0-10 scale
    shroud_tension: float        # 0-10 scale (lower tension)
    mast_rake: float            # degrees

    # Sail controls
    jib_halyard_tension: TensionLevel
    cunningham: float           # 0-10 scale
    outhaul: float             # 0-10 scale
    vang: float                # 0-10 scale

    # New rig measurements
    main_tension: float = 0.0  # 0-10 scale
    cap_tension: float = 0.0  # 0-10 scale
    cap_hole: float = 0.0  # hole number or measurement
    lowers_scale: float = 0.0  # 0-10 scale
    mains_scale: float = 0.0  # 0-10 scale
    pre_bend: float = 0.0  # mm or inches

    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        """Validate settings data after initialization."""
        self._validate_tensions()
        self._validate_mast_rake()

    def _validate_tensions(self) -> None:
        """Validate all tension values."""
        tension_fields = [
            ('forestay_tension', self.forestay_tension),
            ('shroud_tension', self.shroud_tension),
            ('main_tension', self.main_tension),
            ('cap_tension', self.cap_tension),
            ('lowers_scale', self.lowers_scale),
            ('mains_scale', self.mains_scale),
            ('cunningham', self.cunningham),
            ('outhaul', self.outhaul),
            ('vang', self.vang)
        ]

        for field_name, value in tension_fields:
            if not 0 <= value <= 10:
                raise ValueError(f"{field_name} must be between 0 and 10")

        # Validate cap_hole separately as it might have different range
        if self.cap_hole < 0:
            raise ValueError("cap_hole cannot be negative")

        # Validate pre_bend
        if not -50 <= self.pre_bend <= 200:  # Reasonable range in mm
            raise ValueError("pre_bend must be between -50 and 200 mm")

        valid_halyard_tensions = ["Loose", "Medium", "Tight"]
        if self.jib_halyard_tension not in valid_halyard_tensions:
            raise ValueError(f"Jib halyard tension must be one of: {', '.join(valid_halyard_tensions)}")

    def _validate_mast_rake(self) -> None:
        """Validate mast rake angle."""
        if not -5 <= self.mast_rake <= 30:  # Reasonable range for 49er
            raise ValueError("Mast rake must be between -5 and 30 degrees")

    @property
    def is_heavy_weather_setup(self) -> bool:
        """Check if settings indicate heavy weather setup."""
        return (
            self.forestay_tension > 7 and
            self.cunningham > 6 and
            self.vang > 7 and
            self.main_tension > 6
        )

    @property
    def is_light_weather_setup(self) -> bool:
        """Check if settings indicate light weather setup."""
        return (
            self.forestay_tension < 4 and
            self.cunningham < 3 and
            self.jib_halyard_tension == "Loose" and
            self.main_tension < 3
        )