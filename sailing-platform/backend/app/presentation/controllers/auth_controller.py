"""Authentication controller handling auth business logic."""
from typing import Dict, Any
from uuid import UUID

from app.domain.services.auth_service import AuthService
from app.infrastructure.security.jwt_handler import JWTHandler
from app.application.schemas.user_schemas import UserCreate, UserLogin


class AuthController:
    """Controller for authentication operations."""

    def __init__(self, auth_service: AuthService, jwt_handler: JWTHandler):
        self.auth_service = auth_service
        self.jwt_handler = jwt_handler

    async def register(self, user_data: UserCreate) -> Dict[str, Any]:
        """Handle user registration."""
        try:
            # Register user
            user = await self.auth_service.register_user(
                email=user_data.email,
                username=user_data.username,
                password=user_data.password
            )

            # Generate token
            access_token = self.jwt_handler.create_access_token(
                data={"sub": str(user.id)}
            )

            return {
                "user": user,
                "access_token": access_token,
                "token_type": "bearer"
            }
        except ValueError as e:
            raise ValueError(str(e))

    async def login(self, credentials: UserLogin) -> Dict[str, Any]:
        """Handle user login."""
        # Authenticate user
        user = await self.auth_service.authenticate_user(
            username=credentials.username,
            password=credentials.password
        )

        if not user:
            raise ValueError("Incorrect username or password")

        # Generate token
        access_token = self.jwt_handler.create_access_token(
            data={"sub": str(user.id)}
        )

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    async def get_current_user(self, user_id: UUID) -> Dict[str, Any]:
        """Get current user information."""
        user = await self.auth_service.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        return {"user": user}

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify if token is valid."""
        user_id = self.jwt_handler.get_user_id_from_token(token)
        if not user_id:
            raise ValueError("Invalid token")

        user = await self.auth_service.get_user_by_id(UUID(user_id))
        if not user or not user.is_active:
            raise ValueError("Invalid or inactive user")

        return {
            "valid": True,
            "user_id": user_id
        }