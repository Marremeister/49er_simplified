// pages/dashboard.js - Dashboard page functionality

const Dashboard = {
    refreshInterval: null,

    async init() {
        await this.loadDashboardData();
        this.bindEvents();
        this.startAutoRefresh();
    },

    bindEvents() {
        // Quick action buttons
        document.getElementById('quick-new-session')?.addEventListener('click', () => {
            Sessions.showNewSessionModal();
        });

        document.getElementById('quick-new-equipment')?.addEventListener('click', () => {
            Equipment.showNewEquipmentModal();
        });
    },

    async loadDashboardData() {
        try {
            // Load all data in parallel
            const [analytics, sessions, equipmentStats] = await Promise.all([
                API.sessions.getPerformanceAnalytics(),
                API.sessions.list({ limit: 5 }), // Get 5 most recent sessions
                API.equipment.getStatistics()
            ]);

            // Update stats
            this.updateStats(analytics, equipmentStats);

            // Update recent sessions
            this.updateRecentSessions(sessions);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            API.utils.handleError(error);
        }
    },

    updateStats(analytics, equipmentStats) {
        // Update performance stats
        document.getElementById('total-sessions').textContent = analytics.total_sessions || 0;
        document.getElementById('total-hours').textContent = Utils.formatNumber(analytics.total_hours || 0);
        document.getElementById('avg-performance').textContent = Utils.formatNumber(analytics.average_performance || 0);

        // Update equipment stats
        document.getElementById('active-equipment').textContent = equipmentStats.active_equipment || 0;
    },

    updateRecentSessions(sessions) {
        const container = document.getElementById('recent-sessions-list');
        if (!container) return;

        if (sessions.length === 0) {
            container.innerHTML = EmptyState.create({
                icon: '🏄',
                title: 'No sessions yet',
                text: 'Start tracking your sailing sessions',
                action: {
                    text: 'Add First Session',
                    onclick: 'Sessions.showNewSessionModal()'
                }
            });
            return;
        }

        // Create simplified session cards for dashboard
        const html = sessions.map(session => this.createRecentSessionCard(session)).join('');
        container.innerHTML = html;
    },

    createRecentSessionCard(session) {
        const daysAgo = Utils.daysAgo(session.date);
        const timeAgo = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

        return `
            <div class="recent-session-item" onclick="Sessions.viewSession('${session.id}')">
                <div class="recent-session-header">
                    <span class="session-location">${session.location}</span>
                    <span class="session-time-ago">${timeAgo}</span>
                </div>
                <div class="recent-session-details">
                    <span class="detail-item">
                        💨 ${session.wind_speed_min}-${session.wind_speed_max} knots
                    </span>
                    <span class="detail-item">
                        ⏱ ${session.hours_on_water}h
                    </span>
                    <span class="detail-item">
                        ${Utils.createStarRating(session.performance_rating)}
                    </span>
                </div>
            </div>
        `;
    },

    startAutoRefresh() {
        // Auto refresh dashboard data every minute
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, CONFIG.DASHBOARD_REFRESH_INTERVAL);
    },

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    destroy() {
        this.stopAutoRefresh();
    }
};