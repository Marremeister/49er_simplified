"""End-to-end tests for authentication endpoints."""
import pytest
from httpx import AsyncClient
from fastapi import status

from app.main import app
from app.infrastructure.database.connection import engine, Base


@pytest.fixture(scope="module")
async def setup_database():
    """Setup test database."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
class TestAuthEndpoints:
    """Test authentication endpoints end-to-end."""

    async def test_register_user_success(self, setup_database):
        """Test successful user registration."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "email": "newuser@example.com",
                    "username": "newuser",
                    "password": "password123"
                }
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "user" in data
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert data["user"]["email"] == "newuser@example.com"
            assert data["user"]["username"] == "newuser"
            assert data["user"]["is_active"] is True

    async def test_register_user_duplicate_email(self, setup_database):
        """Test registration with duplicate email."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # First registration
            await client.post(
                "/api/auth/register",
                json={
                    "email": "duplicate@example.com",
                    "username": "user1",
                    "password": "password123"
                }
            )

            # Attempt duplicate email
            response = await client.post(
                "/api/auth/register",
                json={
                    "email": "duplicate@example.com",
                    "username": "user2",
                    "password": "password123"
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "Email already registered" in response.json()["detail"]

    async def test_register_user_duplicate_username(self, setup_database):
        """Test registration with duplicate username."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # First registration
            await client.post(
                "/api/auth/register",
                json={
                    "email": "user1@example.com",
                    "username": "duplicateuser",
                    "password": "password123"
                }
            )

            # Attempt duplicate username
            response = await client.post(
                "/api/auth/register",
                json={
                    "email": "user2@example.com",
                    "username": "duplicateuser",
                    "password": "password123"
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "Username already taken" in response.json()["detail"]

    async def test_register_user_invalid_data(self, setup_database):
        """Test registration with invalid data."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Invalid email
            response = await client.post(
                "/api/auth/register",
                json={
                    "email": "invalid-email",
                    "username": "validuser",
                    "password": "password123"
                }
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Short username
            response = await client.post(
                "/api/auth/register",
                json={
                    "email": "valid@example.com",
                    "username": "ab",
                    "password": "password123"
                }
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Short password
            response = await client.post(
                "/api/auth/register",
                json={
                    "email": "valid@example.com",
                    "username": "validuser",
                    "password": "12345"
                }
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_login_success(self, setup_database):
        """Test successful login."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Register user
            await client.post(
                "/api/auth/register",
                json={
                    "email": "login@example.com",
                    "username": "loginuser",
                    "password": "password123"
                }
            )

            # Login with JSON
            response = await client.post(
                "/api/auth/login",
                json={
                    "username": "loginuser",
                    "password": "password123"
                }
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"

    async def test_login_oauth2_form(self, setup_database):
        """Test login with OAuth2 form data."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Register user
            await client.post(
                "/api/auth/register",
                json={
                    "email": "oauth@example.com",
                    "username": "oauthuser",
                    "password": "password123"
                }
            )

            # Login with form data
            response = await client.post(
                "/api/auth/token",
                data={
                    "username": "oauthuser",
                    "password": "password123"
                }
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"

    async def test_login_invalid_credentials(self, setup_database):
        """Test login with invalid credentials."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Register user
            await client.post(
                "/api/auth/register",
                json={
                    "email": "test@example.com",
                    "username": "testuser",
                    "password": "password123"
                }
            )

            # Wrong password
            response = await client.post(
                "/api/auth/login",
                json={
                    "username": "testuser",
                    "password": "wrongpassword"
                }
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Incorrect username or password" in response.json()["detail"]

            # Non-existent user
            response = await client.post(
                "/api/auth/login",
                json={
                    "username": "nonexistent",
                    "password": "password123"
                }
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_current_user(self, setup_database):
        """Test getting current user information."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Register and login
            register_response = await client.post(
                "/api/auth/register",
                json={
                    "email": "current@example.com",
                    "username": "currentuser",
                    "password": "password123"
                }
            )

            token = register_response.json()["access_token"]

            # Get current user
            response = await client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["email"] == "current@example.com"
            assert data["username"] == "currentuser"
            assert data["is_active"] is True

    async def test_get_current_user_invalid_token(self, setup_database):
        """Test getting current user with invalid token."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Invalid token
            response = await client.get(
                "/api/auth/me",
                headers={"Authorization": "Bearer invalid-token"}
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED

            # No token
            response = await client.get("/api/auth/me")
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_verify_token(self, setup_database):
        """Test token verification endpoint."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Register and get token
            register_response = await client.post(
                "/api/auth/register",
                json={
                    "email": "verify@example.com",
                    "username": "verifyuser",
                    "password": "password123"
                }
            )

            token = register_response.json()["access_token"]

            # Verify valid token
            response = await client.get(
                "/api/auth/verify-token",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["valid"] is True
            assert "user_id" in data

    async def test_full_auth_flow(self, setup_database):
        """Test complete authentication flow."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # 1. Register
            register_response = await client.post(
                "/api/auth/register",
                json={
                    "email": "flow@example.com",
                    "username": "flowuser",
                    "password": "password123"
                }
            )
            assert register_response.status_code == status.HTTP_200_OK
            initial_token = register_response.json()["access_token"]

            # 2. Use token to get user info
            me_response = await client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {initial_token}"}
            )
            assert me_response.status_code == status.HTTP_200_OK
            user_data = me_response.json()

            # 3. Login again
            login_response = await client.post(
                "/api/auth/login",
                json={
                    "username": "flowuser",
                    "password": "password123"
                }
            )
            assert login_response.status_code == status.HTTP_200_OK
            new_token = login_response.json()["access_token"]

            # 4. Verify new token works
            verify_response = await client.get(
                "/api/auth/verify-token",
                headers={"Authorization": f"Bearer {new_token}"}
            )
            assert verify_response.status_code == status.HTTP_200_OK

            # 5. Use new token to get user info
            me_response2 = await client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {new_token}"}
            )
            assert me_response2.status_code == status.HTTP_200_OK
            assert me_response2.json()["id"] == user_data["id"]