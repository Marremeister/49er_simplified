"""Password hashing service using passlib."""
from abc import ABC, abstractmethod
from passlib.context import CryptContext


class IPasswordHasher(ABC):
    """Password hasher interface."""

    @abstractmethod
    def hash_password(self, password: str) -> str:
        """Hash a plain password."""
        pass

    @abstractmethod
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash."""
        pass


class PasswordHasher(IPasswordHasher):
    """Password hasher implementation using bcrypt."""

    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash_password(self, password: str) -> str:
        """Hash a plain password using bcrypt."""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a bcrypt hash."""
        return self.pwd_context.verify(plain_password, hashed_password)