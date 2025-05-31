// src/config/api.config.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      token: '/auth/token',
      me: '/auth/me',
      verifyToken: '/auth/verify-token',
    },
    sessions: {
      base: '/sessions',
      analytics: '/sessions/analytics/performance',
      settings: (id: string) => `/sessions/${id}/settings`,
      equipment: (id: string) => `/sessions/${id}/equipment`,
    },
    equipment: {
      base: '/equipment',
      stats: '/equipment/analytics/stats',
      retire: (id: string) => `/equipment/${id}/retire`,
      reactivate: (id: string) => `/equipment/${id}/reactivate`,
    },
  },
} as const;

