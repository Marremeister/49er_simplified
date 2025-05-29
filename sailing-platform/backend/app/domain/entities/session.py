"""Sailing session domain entity with business logic."""
from datetime import date, datetime, timezone
from typing import Optional, Literal
from uuid import UUID, uuid4
from dataclasses import dataclass, field


WaveType = Literal["Flat", "Choppy", "Medium", "Large"]


@dataclass
class SailingSession:
    """Sailing session domain entity."""

    date: date
    location: str
    wind_speed_min: float
    wind_speed_max: float
    wave_type: WaveType
    wave_direction: str
    hours_on_water: float
    performance_rating: int
    created_by: UUID
    notes: Optional[str] = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        """Validate session data after initialization."""
        self._validate_wind_speed()
        self._validate_performance_rating()
        self._validate_hours_on_water()
        self._validate_wave_type()

    def _validate_wind_speed(self) -> None:
        """Validate wind speed values."""
        if self.wind_speed_min < 0:
            raise ValueError("Minimum wind speed cannot be negative")
        if self.wind_speed_max < 0:
            raise ValueError("Maximum wind speed cannot be negative")
        if self.wind_speed_min > self.wind_speed_max:
            raise ValueError("Minimum wind speed cannot exceed maximum wind speed")
        if self.wind_speed_max > 60:  # Safety limit for 49er sailing
            raise ValueError("Wind speed exceeds safe sailing conditions")

    def _validate_performance_rating(self) -> None:
        """Validate performance rating."""
        if not 1 <= self.performance_rating <= 5:
            raise ValueError("Performance rating must be between 1 and 5")

    def _validate_hours_on_water(self) -> None:
        """Validate hours on water."""
        if self.hours_on_water <= 0:
            raise ValueError("Hours on water must be positive")
        if self.hours_on_water > 12:  # Reasonable daily limit
            raise ValueError("Hours on water exceeds reasonable daily limit")

    def _validate_wave_type(self) -> None:
        """Validate wave type."""
        valid_types = ["Flat", "Choppy", "Medium", "Large"]
        if self.wave_type not in valid_types:
            raise ValueError(f"Wave type must be one of: {', '.join(valid_types)}")

    @property
    def average_wind_speed(self) -> float:
        """Calculate average wind speed."""
        return (self.wind_speed_min + self.wind_speed_max) / 2

    @property
    def wind_range(self) -> float:
        """Calculate wind speed range."""
        return self.wind_speed_max - self.wind_speed_min

    def is_heavy_weather(self) -> bool:
        """Check if session was in heavy weather conditions."""
        return self.average_wind_speed > 20 or self.wave_type in ["Medium", "Large"]

    def is_light_weather(self) -> bool:
        """Check if session was in light weather conditions."""
        return self.average_wind_speed < 8 and self.wave_type in ["Flat", "Choppy"]

    def update(self, **kwargs) -> None:
        """Update session with validation."""
        # Store old values
        old_values = {}
        for key, value in kwargs.items():
            if hasattr(self, key):
                old_values[key] = getattr(self, key)
                setattr(self, key, value)

        # Validate
        try:
            self.__post_init__()
            self.updated_at = datetime.now(timezone.utc)
        except ValueError:
            # Rollback on validation error
            for key, value in old_values.items():
                setattr(self, key, value)
            raise