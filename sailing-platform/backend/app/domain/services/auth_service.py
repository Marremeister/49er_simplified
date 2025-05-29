"""Authentication domain service."""
from typing import Optional
from uuid import UUID

from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.infrastructure.security.password_hasher import IPasswordHasher


class AuthService:
    """Domain service for authentication business logic."""

    def __init__(
            self,
            user_repository: IUserRepository,
            password_hasher: IPasswordHasher
    ):
        self.user_repository = user_repository
        self.password_hasher = password_hasher

    async def register_user(
            self,
            email: str,
            username: str,
            password: str
    ) -> User:
        """Register a new user with validation."""
        # Check if user already exists
        if await self.user_repository.exists_by_email(email):
            raise ValueError("Email already registered")

        if await self.user_repository.exists_by_username(username):
            raise ValueError("Username already taken")

        # Validate password strength
        self._validate_password(password)

        # Hash password
        hashed_password = self.password_hasher.hash_password(password)

        # Create user entity
        user = User(
            email=email,
            username=username,
            hashed_password=hashed_password
        )

        # Save to repository
        return await self.user_repository.create(user)

    async def authenticate_user(
            self,
            username: str,
            password: str
    ) -> Optional[User]:
        """Authenticate user with username and password."""
        # Get user by username
        user = await self.user_repository.get_by_username(username)
        if not user:
            return None

        # Check if user can login
        if not user.can_login():
            return None

        # Verify password
        if not self.password_hasher.verify_password(password, user.hashed_password):
            return None

        return user

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        return await self.user_repository.get_by_id(user_id)

    async def update_user_email(self, user_id: UUID, new_email: str) -> User:
        """Update user email with validation."""
        # Get existing user
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Check if new email is already taken
        if new_email != user.email:
            if await self.user_repository.exists_by_email(new_email):
                raise ValueError("Email already registered")

        # Update email
        user.update_email(new_email)

        # Save changes
        return await self.user_repository.update(user)

    async def deactivate_user(self, user_id: UUID) -> User:
        """Deactivate a user account."""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        user.deactivate()
        return await self.user_repository.update(user)

    def _validate_password(self, password: str) -> None:
        """Validate password strength."""
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        if len(password) > 128:
            raise ValueError("Password too long")
        if password.isdigit():
            raise ValueError("Password cannot be all numbers")
        if password.isalpha():
            raise ValueError("Password must contain at least one number")