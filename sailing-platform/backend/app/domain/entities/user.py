"""User domain entity with business logic."""
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from dataclasses import dataclass, field


@dataclass
class User:
    """User domain entity representing a sailing platform user."""

    email: str
    username: str
    hashed_password: str
    is_active: bool = True
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self):
        """Validate user data after initialization."""
        self._validate_email()
        self._validate_username()

    def _validate_email(self) -> None:
        """Validate email format."""
        if not self.email or "@" not in self.email:
            raise ValueError("Invalid email format")
        if len(self.email) > 255:
            raise ValueError("Email too long")

    def _validate_username(self) -> None:
        """Validate username."""
        if not self.username or len(self.username) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(self.username) > 50:
            raise ValueError("Username too long")
        if not self.username.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")

    def deactivate(self) -> None:
        """Deactivate the user account."""
        self.is_active = False

    def activate(self) -> None:
        """Activate the user account."""
        self.is_active = True

    def can_login(self) -> bool:
        """Check if user can login."""
        return self.is_active

    def update_email(self, new_email: str) -> None:
        """Update user email with validation."""
        old_email = self.email
        self.email = new_email
        try:
            self._validate_email()
        except ValueError:
            self.email = old_email
            raise