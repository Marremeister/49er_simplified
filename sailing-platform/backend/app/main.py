"""Main FastAPI application setup."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.infrastructure.database.connection import create_tables, close_database
from app.presentation.routers import auth, sessions, equipment


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown."""
    # Startup
    await create_tables()
    print("Database tables created")

    # Seed initial data if database is empty
    from app.infrastructure.database.repositories.user_repository_impl import UserRepository
    from app.infrastructure.database.connection import AsyncSessionLocal
    from app.infrastructure.security.password_hasher import PasswordHasher
    from app.domain.entities.user import User

    async with AsyncSessionLocal() as session:
        user_repo = UserRepository(session)
        # Check if admin exists
        admin = await user_repo.get_by_username("admin")
        if not admin:
            # Create default admin user
            password_hasher = PasswordHasher()
            admin_user = User(
                email="admin@example.com",
                username="admin",
                hashed_password=password_hasher.hash_password("admin123")
            )
            await user_repo.create(admin_user)
            await session.commit()
            print("Default admin user created (username: admin, password: admin123)")

    yield
    # Shutdown
    await close_database()
    print("Database connections closed")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Set up CORS - Fixed version
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
frontend_path = os.path.join(os.path.dirname(__file__), "frontend_static")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

    # Serve index.html at root
    from fastapi.responses import FileResponse

    @app.get("/", response_class=FileResponse)
    async def read_index():
        index_path = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "Welcome to Sailing Platform API", "docs": "/docs"}
else:
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": "Welcome to Sailing Platform API",
            "docs": "/docs",
            "version": settings.APP_VERSION
        }

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(sessions.router, prefix=f"{settings.API_V1_STR}/sessions", tags=["sessions"])
app.include_router(equipment.router, prefix=f"{settings.API_V1_STR}/equipment", tags=["equipment"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.APP_VERSION}