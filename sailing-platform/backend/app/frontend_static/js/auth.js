// js/auth.js
const AuthService = {
    login: async function(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            // The request function in api.js will handle Content-Type for URLSearchParams
            const data = await request('/auth/token', 'POST', formData, false); // [cite: 9]
            if (data && data.access_token) {
                localStorage.setItem('authToken', data.access_token);
                await this.getCurrentUser(); // Fetch and store user details
                return true;
            }
            return false; // Should not happen if response.ok was true and token present
        } catch (error) {
            // UI.displayError is called by the request function
            console.error('Login error:', error.message);
            return false;
        }
    },

    register: async function(email, username, password) {
        try {
            const userData = { email, username, password };
            // /api/auth/register expects JSON [cite: 9]
            await request('/auth/register', 'POST', userData, false);
            alert('Registration successful! Please login.');
            return true;
        } catch (error) {
            // UI.displayError is called by the request function
            console.error('Registration error:', error.message);
            return false;
        }
    },

    logout: function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.log('User logged out.');
        // UI updates (nav, view) will be handled by the router/main.js
    },

    isAuthenticated: function() {
        return !!localStorage.getItem('authToken');
    },

    getCurrentUser: async function() {
        if (!this.isAuthenticated()) return null;
        try {
            const user = await request('/auth/me', 'GET'); // [cite: 9]
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        } catch (error) {
            console.error('Failed to fetch current user:', error.message);
            // If fetching user fails (e.g. token expired), log out
            this.logout();
            window.location.hash = '#login'; // Force redirect to login
            UI.updateNav();
            UI.showView('login-view');
            return null;
        }
    },

    getUserFromStorage: function() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }
};