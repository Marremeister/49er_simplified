import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthRepository } from '../../infrastructure/api/repositories/AuthRepository';
import { User } from '../entities/User';
import { LoginRequest, RegisterRequest, TokenResponse } from '../types/api.types';

export class AuthService {
  private repository: IAuthRepository;

  constructor(repository?: IAuthRepository) {
    this.repository = repository || new AuthRepository();
  }

  async login(credentials: LoginRequest): Promise<{ user: User; token: TokenResponse }> {
    // Validate credentials
    if (!credentials.username || !credentials.password) {
      throw new Error('Username and password are required');
    }

    if (credentials.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    const token = await this.repository.login(credentials);
    const user = await this.repository.getCurrentUser();

    return { user, token };
  }

  async register(data: RegisterRequest): Promise<{ user: User; token: TokenResponse }> {
    // Validate registration data
    if (!data.email || !data.username || !data.password) {
      throw new Error('All fields are required');
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    return this.repository.register(data);
  }

  async getCurrentUser(): Promise<User> {
    return this.repository.getCurrentUser();
  }

  async verifyToken(): Promise<{ valid: boolean; userId: string }> {
    return this.repository.verifyToken();
  }

  async logout(): Promise<void> {
    return this.repository.logout();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}