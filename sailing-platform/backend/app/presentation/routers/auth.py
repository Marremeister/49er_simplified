"""Authentication router endpoints."""
from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.dependencies import (
    get_auth_service,
    get_jwt_handler,
    get_current_user,
    oauth2_scheme
)
from app.domain.entities.user import User
from app.domain.services.auth_service import AuthService
from app.infrastructure.security.jwt_handler import JWTHandler
from app.presentation.controllers.auth_controller import AuthController
from app.presentation.views.auth_view import AuthView
from app.application.schemas.user_schemas import (
    UserCreate,
    UserResponse,
    Token,
    UserLogin
)

router = APIRouter()


@router.post("/register", response_model=Dict)
async def register(
        user_data: UserCreate,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
        jwt_handler: Annotated[JWTHandler, Depends(get_jwt_handler)]
):
    """Register a new user."""
    controller = AuthController(auth_service, jwt_handler)
    view = AuthView()

    try:
        result = await controller.register(user_data)
        return view.format_registration_response(result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/token", response_model=Token)
async def login_for_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
        jwt_handler: Annotated[JWTHandler, Depends(get_jwt_handler)]
):
    """Login endpoint compatible with OAuth2."""
    controller = AuthController(auth_service, jwt_handler)
    view = AuthView()

    try:
        credentials = UserLogin(
            username=form_data.username,
            password=form_data.password
        )
        result = await controller.login(credentials)
        return view.format_login_response(result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/login", response_model=Token)
async def login(
        credentials: UserLogin,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
        jwt_handler: Annotated[JWTHandler, Depends(get_jwt_handler)]
):
    """Login endpoint with JSON body."""
    controller = AuthController(auth_service, jwt_handler)
    view = AuthView()

    try:
        result = await controller.login(credentials)
        return view.format_login_response(result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
        current_user: Annotated[User, Depends(get_current_user)]
):
    """Get current user information."""
    view = AuthView()
    return view.format_user_response(current_user)


@router.get("/verify-token")
async def verify_token(
        token: Annotated[str, Depends(oauth2_scheme)],
        jwt_handler: Annotated[JWTHandler, Depends(get_jwt_handler)]
):
    """Verify if token is valid."""
    controller = AuthController(None, jwt_handler)
    view = AuthView()

    try:
        result = await controller.verify_token(token)
        return view.format_token_verification_response(result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )