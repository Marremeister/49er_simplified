// js/main.js
function handleRouteChange() {
    const hash = window.location.hash || (AuthService.isAuthenticated() ? '#dashboard' : '#login');
    UI.updateNav();

    if (!AuthService.isAuthenticated() && hash !== '#register' && hash !== '#login') {
        UI.showView('login-view');
        if (window.location.hash !== '#login') window.location.hash = '#login'; // Ensure URL reflects state
        return;
    }

    switch (hash) {
        case '#login':
            UI.showView('login-view');
            break;
        case '#register':
            UI.showView('register-view');
            break;
        case '#dashboard':
            if (AuthService.isAuthenticated()) {
                UI.showView('dashboard-view');
                loadAndDisplaySessions(); // From sessions.js
            } else {
                window.location.hash = '#login'; // Redirect to login if not authenticated
            }
            break;
        case '#equipment': // Placeholder view
            if (AuthService.isAuthenticated()) {
                UI.showView('equipment-view');
                // Future: Call function to load equipment data here
            } else {
                window.location.hash = '#login';
            }
            break;
        default: // Fallback route
            if (AuthService.isAuthenticated()) {
                UI.showView('dashboard-view');
                if (window.location.hash !== '#dashboard') window.location.hash = '#dashboard';
                loadAndDisplaySessions();
            } else {
                UI.showView('login-view');
                if (window.location.hash !== '#login') window.location.hash = '#login';
            }
            break;
    }
}

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const success = await AuthService.login(username, password);
            if (success) {
                window.location.hash = '#dashboard';
                // handleRouteChange will be called by hashchange, which calls UI.updateNav()
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('register-email').value;
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const success = await AuthService.register(email, username, password);
            if (success) {
                window.location.hash = '#login';
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            AuthService.logout();
            window.location.hash = '#login'; // This will trigger handleRouteChange
        });
    }

    // Simpler navigation link handling for SPA behavior
    // Relies on the hashchange event to trigger route changes
    document.querySelectorAll('nav a[href^="#"], #login-view a[href^="#"], #register-view a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            // Allow default behavior which is to change the hash
            // The 'hashchange' event listener will then call handleRouteChange
            if (this.getAttribute('href') === window.location.hash) {
                // If clicking the current active link, force route handler to re-evaluate (e.g., refresh data)
                e.preventDefault(); // Prevent potential duplicate hash change event
                handleRouteChange();
            }
            // Otherwise, allow default anchor behavior to change hash
        });
    });
}


window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners(); // Setup general event listeners first
    initSessionsView();    // Setup listeners specific to the sessions view/form

    // Check authentication status and fetch user if token exists
    if (AuthService.isAuthenticated()) {
        await AuthService.getCurrentUser(); // Wait for user to be fetched or auth to fail
    }

    // Initial route handling after potential async auth check
    handleRouteChange();
    UI.updateNav(); // Ensure nav is correct based on final auth state
});