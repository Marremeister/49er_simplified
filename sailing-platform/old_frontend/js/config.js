// config.js - Configuration settings for the application

const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:8000/api',
    API_TIMEOUT: 10000, // 10 seconds

    // Authentication
    TOKEN_KEY: 'sailing_platform_token',
    USER_KEY: 'sailing_platform_user',

    // UI Configuration
    TOAST_DURATION: 3000, // 3 seconds
    DEBOUNCE_DELAY: 300, // 300ms for search/filter inputs

    // Pagination
    DEFAULT_PAGE_SIZE: 20,

    // Date Formats
    DATE_FORMAT: 'YYYY-MM-DD',
    DISPLAY_DATE_FORMAT: 'MMM DD, YYYY',

    // Performance Rating
    MAX_RATING: 5,
    MIN_RATING: 1,

    // Wind Speed Limits
    MIN_WIND_SPEED: 0,
    MAX_WIND_SPEED: 60,

    // Hours on Water Limits
    MIN_HOURS: 0,
    MAX_HOURS: 12,

    // Equipment Age Threshold (days)
    OLD_EQUIPMENT_THRESHOLD: 730, // 2 years

    // Chart Colors
    CHART_COLORS: {
        primary: '#0066cc',
        secondary: '#00a3cc',
        success: '#00cc88',
        warning: '#ffaa00',
        danger: '#ff3366',
        gray: '#718096'
    },

    // Weather Conditions
    HEAVY_WEATHER_THRESHOLD: 20, // knots
    LIGHT_WEATHER_THRESHOLD: 8, // knots

    // Refresh Intervals (milliseconds)
    DASHBOARD_REFRESH_INTERVAL: 60000, // 1 minute
    ANALYTICS_REFRESH_INTERVAL: 300000, // 5 minutes
};

// Make config immutable
Object.freeze(CONFIG);