// src/domain/repositories/IAuthRepository.ts
import { User } from '../entities/User';
import { LoginRequest, RegisterRequest, TokenResponse } from '../types/api.types';

export interface IAuthRepository {
  login(credentials: LoginRequest): Promise<TokenResponse>;
  register(data: RegisterRequest): Promise<{ user: User; token: TokenResponse }>;
  getCurrentUser(): Promise<User>;
  verifyToken(): Promise<{ valid: boolean; userId: string }>;
  logout(): Promise<void>;
}