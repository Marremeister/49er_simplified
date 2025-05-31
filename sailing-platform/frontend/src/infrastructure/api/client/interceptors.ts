// src/infrastructure/api/client/interceptors.ts
import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenStorage } from '../../storage/TokenStorage';

export const setupInterceptors = (axiosInstance: AxiosInstance): void => {
  // Request interceptor - add auth token
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = TokenStorage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<any>) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        TokenStorage.removeToken();
        window.location.href = '/login';
      }

      // Extract error message
      const message = error.response?.data?.detail ||
                     error.response?.data?.message ||
                     error.message ||
                     'An unexpected error occurred';

      return Promise.reject(new Error(message));
    }
  );
};

}