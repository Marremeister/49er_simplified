// app.js - Main application controller

const App = {
    currentPage: null,
    pages: {
        dashboard: Dashboard,
        sessions: Sessions,
        equipment: Equipment,
        analytics: Analytics
    },

    init() {
        this.bindNavigation();
        this.navigateToPage('dashboard');
        this.setupGlobalHandlers();
    },

    bindNavigation() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });
    },

    navigateToPage(pageName) {
        // Destroy current page if exists
        if (this.currentPage && this.pages[this.currentPage].destroy) {
            this.pages[this.currentPage].destroy();
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });

        // Show selected page
        const pageElement = document.getElementById(`${pageName}-page`);
        if (pageElement) {
            pageElement.classList.remove('hidden');
        }

        // Initialize page
        this.currentPage = pageName;
        if (this.pages[pageName] && this.pages[pageName].init) {
            this.pages[pageName].init();
        }

        // Update URL without reload
        Utils.updateQueryParams({ page: pageName });
    },

    setupGlobalHandlers() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const params = Utils.getQueryParams();
            const page = params.page || 'dashboard';
            this.navigateToPage(page);
        });

        // Global error handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            Toast.show('An unexpected error occurred', 'error');
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    Modal.hide(modal.id);
                });
            }
        });

        // Add chart styles dynamically
        this.addChartStyles();
    },

    addChartStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Simple Chart Styles */
            .simple-bar-chart {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
            }

            .bar-item {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .bar-label {
                min-width: 120px;
                font-size: 0.875rem;
                color: var(--gray-700);
            }

            .bar-container {
                flex: 1;
                height: 30px;
                background: var(--gray-300);
                border-radius: 4px;
                position: relative;
                overflow: hidden;
            }

            .bar {
                height: 100%;
                background: var(--primary-color);
                transition: width 0.5s ease;
                border-radius: 4px;
            }

            .bar-value {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--gray-700);
            }

            .simple-pie-chart {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                padding: 1rem;
            }

            .pie-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 0.875rem;
            }

            .pie-color {
                width: 20px;
                height: 20px;
                border-radius: 4px;
            }

            .pie-label {
                flex: 1;
                color: var(--gray-700);
            }

            .pie-value {
                font-weight: 600;
                color: var(--gray-900);
            }

            .simple-line-chart {
                height: 100%;
                display: flex;
                flex-direction: column;
                padding: 1rem;
            }

            .chart-y-axis {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                width: 30px;
                padding-right: 10px;
                font-size: 0.75rem;
                color: var(--gray-600);
            }

            .chart-content {
                flex: 1;
                position: relative;
                background: var(--gray-100);
                border-left: 1px solid var(--gray-400);
                border-bottom: 1px solid var(--gray-400);
            }

            .line-chart-svg {
                width: 100%;
                height: 100%;
            }

            .chart-x-axis {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
                padding-left: 40px;
                font-size: 0.75rem;
                color: var(--gray-600);
            }

            /* Recent session item styles */
            .recent-session-item {
                padding: 1rem;
                border: 1px solid var(--gray-400);
                border-radius: var(--border-radius);
                cursor: pointer;
                transition: var(--transition);
                margin-bottom: 0.75rem;
            }

            .recent-session-item:hover {
                border-color: var(--primary-color);
                background: var(--gray-200);
            }

            .recent-session-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }

            .session-time-ago {
                font-size: 0.875rem;
                color: var(--gray-600);
            }

            .recent-session-details {
                display: flex;
                gap: 1rem;
                font-size: 0.875rem;
                color: var(--gray-700);
            }

            .sessions-list {
                max-height: 400px;
                overflow-y: auto;
            }
        `;
        document.head.appendChild(style);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth first
    Auth.init();
});