// js/api.js
async function request(endpoint, method = 'GET', data = null, requireAuth = true) {
    const url = `${APP_CONFIG.apiBaseUrl}${endpoint}`;
    const headers = {
        // 'Content-Type' will be set based on data type below
    };

    if (requireAuth) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No token found for authenticated request');
            UI.showView('login-view'); // Redirect to login
            window.location.hash = '#login';
            return Promise.reject('Authentication token not found.');
        }
        headers['Authorization'] = `Bearer ${token}`; // [cite: 10]
    }

    const config = {
        method: method,
        headers: headers,
    };

    if (data) {
        if (data instanceof URLSearchParams) { // For x-www-form-urlencoded data (like login)
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            config.body = data;
        } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') { // For JSON data
            headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(data);
        }
    }


    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            // Try to parse error message from backend, otherwise use statusText
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            console.error('API Error:', response.status, errorData);
            // Prefer `detail` field if present (FastAPI standard)
            throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }
        if (response.status === 204) { // No Content success status
            return null; // Or an empty object, or a specific success indicator
        }
        return await response.json(); // For responses with content
    } catch (error) {
        console.error('Request failed:', error);
        // Display error to user via UI.js, unless it's an auth error already handled
        if (error.message !== 'Authentication token not found.') {
            UI.displayError(error.message || 'An unexpected error occurred.');
        }
        throw error; // Re-throw to allow calling function to handle if needed
    }
}