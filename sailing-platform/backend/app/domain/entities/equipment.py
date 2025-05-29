"""Equipment domain entities with business logic."""
from datetime import date, datetime, timezone
from typing import Optional, Literal
from uuid import UUID, uuid4
from dataclasses import dataclass, field


EquipmentType = Literal["Mainsail", "Jib", "Mast", "Boom", "Rudder", "Centerboard", "Other"]
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
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        """Validate equipment data after initialization."""
        self._validate_name()
        self._validate_type()

    def _validate_name(self) -> None:
        """Validate equipment name."""
        if not self.name or len(self.name.strip()) < 1:
            raise ValueError("Equipment name cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Equipment name too long")

    def _validate_type(self) -> None:
        """Validate equipment type."""
        valid_types = ["Mainsail", "Jib", "Mast", "Boom", "Rudder", "Centerboard", "Other"]
        if self.type not in valid_types:
            raise ValueError(f"Equipment type must be one of: {', '.join(valid_types)}")

    def retire(self) -> None:
        """Retire the equipment."""
        self.active = False
        self.updated_at = datetime.now(timezone.utc)

    def reactivate(self) -> None:
        """Reactivate retired equipment."""
        self.active = True
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


@dataclass
class EquipmentSettings:
    """Equipment settings for a specific sailing session."""

    session_id: UUID
    forestay_tension: float  # 0-10 scale
    shroud_tension: float    # 0-10 scale
    mast_rake: float         # degrees
    jib_halyard_tension: TensionLevel
    cunningham: float        # 0-10 scale
    outhaul: float          # 0-10 scale
    vang: float             # 0-10 scale
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
            ('cunningham', self.cunningham),
            ('outhaul', self.outhaul),
            ('vang', self.vang)
        ]

        for field_name, value in tension_fields:
            if not 0 <= value <= 10:
                raise ValueError(f"{field_name} must be between 0 and 10")

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
            self.vang > 7
        )

    @property
    def is_light_weather_setup(self) -> bool:
        """Check if settings indicate light weather setup."""
        return (
            self.forestay_tension < 4 and
            self.cunningham < 3 and
            self.jib_halyard_tension == "Loose"
        )