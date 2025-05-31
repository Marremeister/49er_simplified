import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';
import { User } from '../../../domain/entities/User';
import { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '../../../domain/types/api.types';
import { ApiClient } from '../client/ApiClient';
import { API_CONFIG } from '../../../config/api.config';

export class AuthRepository implements IAuthRepository {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await this.apiClient.post<TokenResponse>(
      API_CONFIG.endpoints.auth.login,
      credentials
    );
    return response;
  }

  async register(data: RegisterRequest): Promise<{ user: User; token: TokenResponse }> {
    const response = await this.apiClient.post<{
      user: UserResponse;
      access_token: string;
      token_type: string;
    }>(API_CONFIG.endpoints.auth.register, data);

    const user = this.mapToEntity(response.user);
    const token: TokenResponse = {
      access_token: response.access_token,
      token_type: response.token_type,
    };

    return { user, token };
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.apiClient.get<UserResponse>(
      API_CONFIG.endpoints.auth.me
    );
    return this.mapToEntity(response);
  }

  async verifyToken(): Promise<{ valid: boolean; userId: string }> {
    const response = await this.apiClient.get<{ valid: boolean; user_id: string }>(
      API_CONFIG.endpoints.auth.verifyToken
    );
    return {
      valid: response.valid,
      userId: response.user_id,
    };
  }

  async logout(): Promise<void> {
    // Logout is handled client-side by removing the token
    // If you have a server-side logout endpoint, call it here
    return Promise.resolve();
  }

  private mapToEntity(data: UserResponse): User {
    return new User(
      data.id,
      data.email,
      data.username,
      data.is_active,
      data.created_at
    );
  }
}