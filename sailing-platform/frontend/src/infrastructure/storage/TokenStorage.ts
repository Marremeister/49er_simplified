export class TokenStorage {
  private static readonly TOKEN_KEY = 'sailing_platform_token';
  private static readonly USER_KEY = 'sailing_platform_user';

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): any | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static clear(): void {
    this.removeToken();
    this.removeUser();
  }
}