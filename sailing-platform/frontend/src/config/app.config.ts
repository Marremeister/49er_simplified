// src/config/app.config.ts
export const APP_CONFIG = {
  appName: 'Sailing Platform',
  appVersion: '1.0.0',
  dateFormat: 'yyyy-MM-dd',
  displayDateFormat: 'MMM dd, yyyy',
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
  validation: {
    minPasswordLength: 6,
    maxPasswordLength: 128,
    minUsernameLength: 3,
    maxUsernameLength: 50,
  },
} as const;