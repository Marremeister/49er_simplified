"""Authentication view for formatting auth responses."""
from typing import Dict, Any

from backend.app.domain.entities.user import User
from backend.app.application.schemas.user_schemas import UserResponse, Token


class AuthView:
    """View for formatting authentication responses."""

    @staticmethod
    def format_registration_response(result: Dict[str, Any]) -> Dict[str, Any]:
        """Format user registration response."""
        user = result["user"]
        return {
            "user": UserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                is_active=user.is_active,
                created_at=user.created_at
            ),
            "access_token": result["access_token"],
            "token_type": result["token_type"]
        }

    @staticmethod
    def format_login_response(token_data: Dict[str, Any]) -> Token:
        """Format login response."""
        return Token(
            access_token=token_data["access_token"],
            token_type=token_data["token_type"]
        )

    @staticmethod
    def format_user_response(user: User) -> UserResponse:
        """Format user response."""
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            is_active=user.is_active,
            created_at=user.created_at
        )

    @staticmethod
    def format_token_verification_response(result: Dict[str, Any]) -> Dict[str, Any]:
        """Format token verification response."""
        return {
            "valid": result["valid"],
            "user_id": result["user_id"]
        }