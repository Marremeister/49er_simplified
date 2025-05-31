// api.js - API client for backend communication

class APIClient {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.timeout = CONFIG.API_TIMEOUT;
    }

    // Get auth token from storage
    getAuthToken() {
        return Utils.storage.get(CONFIG.TOKEN_KEY);
    }

    // Build headers for requests
    buildHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.buildHeaders(options.headers)
        };

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            // Handle response
            const data = response.ok && response.headers.get('content-type')?.includes('application/json')
                ? await response.json()
                : null;

            if (!response.ok) {
                throw new APIError(
                    data?.detail || 'An error occurred',
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new APIError('Request timeout', 408);
            }

            if (error instanceof APIError) {
                throw error;
            }

            throw new APIError('Network error', 0, error);
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // PATCH request
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Form data request (for file uploads)
    async postFormData(endpoint, formData) {
        const token = this.getAuthToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers // Don't set Content-Type for FormData
        });
    }
}

// Custom API Error class
class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// API Service with specific endpoints
const API = {
    client: new APIClient(),

    // Auth endpoints
    auth: {
        async register(data) {
            return API.client.post('/auth/register', data);
        },

        async login(credentials) {
            return API.client.post('/auth/login', credentials);
        },

        async loginWithToken(username, password) {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            return API.client.request('/auth/token', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        },

        async getCurrentUser() {
            return API.client.get('/auth/me');
        },

        async verifyToken() {
            return API.client.get('/auth/verify-token');
        }
    },

    // Session endpoints
    sessions: {
        async list(params = {}) {
            return API.client.get('/sessions', params);
        },

        async get(id) {
            return API.client.get(`/sessions/${id}`);
        },

        async create(data) {
            return API.client.post('/sessions', data);
        },

        async update(id, data) {
            return API.client.put(`/sessions/${id}`, data);
        },

        async delete(id) {
            return API.client.delete(`/sessions/${id}`);
        },

        async getSettings(sessionId) {
            return API.client.get(`/sessions/${sessionId}/settings`);
        },

        async createSettings(sessionId, data) {
            return API.client.post(`/sessions/${sessionId}/settings`, data);
        },

        async getEquipment(sessionId) {
            return API.client.get(`/sessions/${sessionId}/equipment`);
        },

        async getPerformanceAnalytics(params = {}) {
            return API.client.get('/sessions/analytics/performance', params);
        }
    },

    // Equipment endpoints
    equipment: {
        async list(params = {}) {
            return API.client.get('/equipment', params);
        },

        async get(id) {
            return API.client.get(`/equipment/${id}`);
        },

        async create(data) {
            return API.client.post('/equipment', data);
        },

        async update(id, data) {
            return API.client.put(`/equipment/${id}`, data);
        },

        async delete(id) {
            return API.client.delete(`/equipment/${id}`);
        },

        async retire(id) {
            return API.client.patch(`/equipment/${id}/retire`);
        },

        async reactivate(id) {
            return API.client.patch(`/equipment/${id}/reactivate`);
        },

        async getStatistics() {
            return API.client.get('/equipment/analytics/stats');
        }
    },

    // Schema endpoints - for dynamic form generation
    schema: {
        // Get available options for enums (wave types, equipment types, etc.)
        async getEnumOptions(schemaPath) {
            // This would ideally come from an OpenAPI endpoint
            // For now, we'll fetch and parse from the actual endpoints
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/openapi.json`);
                const schema = await response.json();

                // Navigate to the specific enum in the schema
                const pathParts = schemaPath.split('.');
                let current = schema;

                for (const part of pathParts) {
                    current = current[part];
                    if (!current) return null;
                }

                return current.enum || null;
            } catch (error) {
                console.error('Error fetching schema:', error);

                // Fallback values if schema fetch fails
                const fallbacks = {
                    'WaveType': ['Flat', 'Choppy', 'Medium', 'Large'],
                    'EquipmentType': ['Mainsail', 'Jib', 'Gennaker', 'Mast', 'Boom', 'Rudder', 'Centerboard', 'Other'],
                    'TensionLevel': ['Loose', 'Medium', 'Tight']
                };

                return fallbacks[schemaPath] || null;
            }
        }
    },

    // Utility methods
    utils: {
        // Check if user is authenticated
        async isAuthenticated() {
            const token = Utils.storage.get(CONFIG.TOKEN_KEY);
            if (!token) return false;

            try {
                await API.auth.verifyToken();
                return true;
            } catch (error) {
                // Token is invalid, clear it
                Utils.storage.remove(CONFIG.TOKEN_KEY);
                Utils.storage.remove(CONFIG.USER_KEY);
                return false;
            }
        },

        // Handle API errors consistently
        handleError(error) {
            if (error instanceof APIError) {
                switch (error.status) {
                    case 401:
                        // Unauthorized - redirect to login
                        Utils.storage.remove(CONFIG.TOKEN_KEY);
                        Utils.storage.remove(CONFIG.USER_KEY);
                        window.location.reload();
                        break;
                    case 403:
                        Toast.show('You do not have permission to perform this action', 'error');
                        break;
                    case 404:
                        Toast.show('Resource not found', 'error');
                        break;
                    case 422:
                        // Validation error
                        const details = error.data?.detail;
                        if (Array.isArray(details)) {
                            details.forEach(detail => {
                                Toast.show(`${detail.loc.join('.')}: ${detail.msg}`, 'error');
                            });
                        } else {
                            Toast.show(error.message, 'error');
                        }
                        break;
                    default:
                        Toast.show(error.message || 'An error occurred', 'error');
                }
            } else {
                Toast.show('Network error. Please check your connection.', 'error');
                console.error('API Error:', error);
            }
        }
    }
};