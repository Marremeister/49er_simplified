// auth.js - Authentication module

const Auth = {
    // Initialize auth module
    init() {
        this.bindEvents();
        this.checkAuthStatus();
    },

    // Bind authentication events
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Auth switch links
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });
    },

    // Check authentication status
    async checkAuthStatus() {
        const token = Utils.storage.get(CONFIG.TOKEN_KEY);
        const user = Utils.storage.get(CONFIG.USER_KEY);

        if (token && user) {
            // Verify token is still valid
            try {
                await API.auth.verifyToken();
                this.showApp(user);
            } catch (error) {
                // Token invalid, show login
                this.showAuth();
            }
        } else {
            // No token, show login
            this.showAuth();
        }
    },

    // Handle login form submission
    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Disable form while processing
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Signing in...';

        try {
            const formData = new FormData(form);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };

            // Call login API
            const response = await API.auth.login(credentials);

            // Store token and user data
            Utils.storage.set(CONFIG.TOKEN_KEY, response.access_token);

            // Get user details
            const user = await API.auth.getCurrentUser();
            Utils.storage.set(CONFIG.USER_KEY, user);

            // Show success message
            Toast.show('Login successful!', 'success');

            // Show main app
            this.showApp(user);

            // Reset form
            form.reset();

        } catch (error) {
            API.utils.handleError(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In';
        }
    },

    // Handle register form submission
    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Validate form
        const email = form.querySelector('#register-email').value;
        const username = form.querySelector('#register-username').value;
        const password = form.querySelector('#register-password').value;

        if (!Utils.isValidEmail(email)) {
            Toast.show('Please enter a valid email address', 'error');
            return;
        }

        if (username.length < 3) {
            Toast.show('Username must be at least 3 characters', 'error');
            return;
        }

        if (password.length < 6) {
            Toast.show('Password must be at least 6 characters', 'error');
            return;
        }

        // Disable form while processing
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Creating account...';

        try {
            const formData = new FormData(form);
            const userData = {
                email: formData.get('email'),
                username: formData.get('username'),
                password: formData.get('password')
            };

            // Call register API
            const response = await API.auth.register(userData);

            // Store token and user data
            Utils.storage.set(CONFIG.TOKEN_KEY, response.access_token);
            Utils.storage.set(CONFIG.USER_KEY, response.user);

            // Show success message
            Toast.show('Account created successfully!', 'success');

            // Show main app
            this.showApp(response.user);

            // Reset form
            form.reset();

        } catch (error) {
            API.utils.handleError(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Account';
        }
    },

    // Show login form
    showLoginForm() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    },

    // Show register form
    showRegisterForm() {
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
    },

    // Show auth container
    showAuth() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    },

    // Show main app
    showApp(user) {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');

        // Update user display
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.textContent = user.username;
        }

        // Initialize app
        if (typeof App !== 'undefined' && App.init) {
            App.init();
        }
    },

    // Logout
    async logout() {
        // Clear storage
        Utils.storage.remove(CONFIG.TOKEN_KEY);
        Utils.storage.remove(CONFIG.USER_KEY);

        // Show logout message
        Toast.show('Logged out successfully', 'info');

        // Redirect to login
        window.location.reload();
    },

    // Get current user
    getCurrentUser() {
        return Utils.storage.get(CONFIG.USER_KEY);
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!Utils.storage.get(CONFIG.TOKEN_KEY);
    }
};