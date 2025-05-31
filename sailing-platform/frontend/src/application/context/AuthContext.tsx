import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../domain/entities/User';
import { AuthService } from '../../domain/services/AuthService';
import { TokenStorage } from '../../infrastructure/storage/TokenStorage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = new AuthService();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = TokenStorage.getToken();
      if (token) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      TokenStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const { user: loggedInUser, token } = await authService.login({ username, password });
    TokenStorage.setToken(token.access_token);
    TokenStorage.setUser(loggedInUser);
    setUser(loggedInUser);
  };

  const register = async (email: string, username: string, password: string) => {
    const { user: newUser, token } = await authService.register({ email, username, password });
    TokenStorage.setToken(token.access_token);
    TokenStorage.setUser(newUser);
    setUser(newUser);
  };

  const logout = async () => {
    await authService.logout();
    TokenStorage.clear();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    TokenStorage.setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};