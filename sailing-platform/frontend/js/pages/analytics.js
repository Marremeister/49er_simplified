// pages/analytics.js - Analytics page functionality

const Analytics = {
    refreshInterval: null,

    async init() {
        await this.loadAnalytics();
        this.bindEvents();
        this.startAutoRefresh();
    },

    bindEvents() {
        // Date range inputs
        document.getElementById('analytics-from')?.addEventListener('change', () => {
            this.loadAnalytics();
        });

        document.getElementById('analytics-to')?.addEventListener('change', () => {
            this.loadAnalytics();
        });

        // Refresh button
        document.getElementById('refresh-analytics')?.addEventListener('click', () => {
            this.loadAnalytics();
        });
    },

    async loadAnalytics() {
        // Get date range
        const dateFrom = document.getElementById('analytics-from')?.value;
        const dateTo = document.getElementById('analytics-to')?.value;

        const params = {};
        if (dateFrom) params.start_date = dateFrom;
        if (dateTo) params.end_date = dateTo;

        try {
            // Show loading state
            this.showLoadingState();

            // Load analytics data
            const [sessionAnalytics, sessions] = await Promise.all([
                API.sessions.getPerformanceAnalytics(params),
                API.sessions.list(params)
            ]);

            // Render charts
            this.renderPerformanceByConditions(sessionAnalytics.performance_by_conditions);
            this.renderSessionsByLocation(sessionAnalytics.sessions_by_location);
            this.renderPerformanceTrend(sessions);

            // Update summary stats
            this.updateSummaryStats(sessionAnalytics);

        } catch (error) {
            console.error('Error loading analytics:', error);
            API.utils.handleError(error);
            this.showErrorState();
        }
    },

    showLoadingState() {
        const containers = ['conditions-chart', 'locations-chart', 'trend-chart'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '<div class="loading-spinner"></div>';
            }
        });
    },

    showErrorState() {
        const containers = ['conditions-chart', 'locations-chart', 'trend-chart'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '<p class="text-center">Error loading data</p>';
            }
        });
    },

    renderPerformanceByConditions(data) {
        const container = document.getElementById('conditions-chart');
        if (!container || !data) return;

        // Format data for display
        const formattedData = {
            'Light Wind': parseFloat(data.light || 0).toFixed(1),
            'Medium Wind': parseFloat(data.medium || 0).toFixed(1),
            'Heavy Wind': parseFloat(data.heavy || 0).toFixed(1)
        };

        // Create bar chart
        ChartHelpers.createBarChart('conditions-chart', formattedData, {
            color: CONFIG.CHART_COLORS.primary
        });
    },

    renderSessionsByLocation(data) {
        const container = document.getElementById('locations-chart');
        if (!container || !data) return;

        if (Object.keys(data).length === 0) {
            container.innerHTML = '<p class="text-center">No session data available</p>';
            return;
        }

        // Sort locations by session count
        const sortedData = Object.entries(data)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10) // Top 10 locations
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        // Create pie chart
        ChartHelpers.createPieChart('locations-chart', sortedData);
    },

    renderPerformanceTrend(sessions) {
        const container = document.getElementById('trend-chart');
        if (!container || !sessions || sessions.length === 0) {
            container.innerHTML = '<p class="text-center">Not enough data for trend analysis</p>';
            return;
        }

        // Sort sessions by date
        const sortedSessions = Utils.sortBy(sessions, 'date');

        // Group by month
        const monthlyData = {};
        sortedSessions.forEach(session => {
            const date = new Date(session.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    ratings: [],
                    count: 0
                };
            }

            monthlyData[monthKey].ratings.push(session.performance_rating);
            monthlyData[monthKey].count++;
        });

        // Calculate monthly averages
        const trendData = {};
        Object.entries(monthlyData).forEach(([month, data]) => {
            const avg = data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length;
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('en', { month: 'short', year: 'numeric' });
            trendData[monthName] = parseFloat(avg.toFixed(1));
        });

        // Create line chart (simplified version)
        this.createSimpleLineChart('trend-chart', trendData);
    },

    createSimpleLineChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(data);
        const maxValue = Math.max(...entries.map(([, value]) => value));
        const minValue = Math.min(...entries.map(([, value]) => value));

        let html = '<div class="simple-line-chart">';
        html += '<div class="chart-y-axis">';

        // Y-axis labels
        for (let i = 5; i >= 1; i--) {
            html += `<span class="y-label">${i}</span>`;
        }
        html += '</div>';

        html += '<div class="chart-content">';
        html += '<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="line-chart-svg">';

        // Create line path
        const points = entries.map(([, value], index) => {
            const x = (index / (entries.length - 1)) * 100;
            const y = 100 - ((value - 1) / 4) * 100; // Scale 1-5 rating to 0-100
            return `${x},${y}`;
        });

        html += `<polyline points="${points.join(' ')}"
                 fill="none"
                 stroke="${CONFIG.CHART_COLORS.primary}"
                 stroke-width="2"/>`;

        // Add points
        entries.forEach(([, value], index) => {
            const x = (index / (entries.length - 1)) * 100;
            const y = 100 - ((value - 1) / 4) * 100;
            html += `<circle cx="${x}" cy="${y}" r="3" fill="${CONFIG.CHART_COLORS.primary}"/>`;
        });

        html += '</svg>';
        html += '</div>';

        // X-axis labels
        html += '<div class="chart-x-axis">';
        entries.forEach(([label], index) => {
            if (index % Math.ceil(entries.length / 5) === 0 || index === entries.length - 1) {
                html += `<span class="x-label">${label}</span>`;
            }
        });
        html += '</div>';

        html += '</div>';
        container.innerHTML = html;
    },

    updateSummaryStats(analytics) {
        // Add summary cards if needed
        const summaryHtml = `
            <div class="analytics-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Sessions</span>
                    <span class="summary-value">${analytics.total_sessions}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Hours</span>
                    <span class="summary-value">${Utils.formatNumber(analytics.total_hours)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Avg Performance</span>
                    <span class="summary-value">${Utils.formatNumber(analytics.average_performance)}/5</span>
                </div>
            </div>
        `;

        // You could add this summary to the page if there's a designated area
    },

    startAutoRefresh() {
        // Auto refresh analytics data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadAnalytics();
        }, CONFIG.ANALYTICS_REFRESH_INTERVAL);
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