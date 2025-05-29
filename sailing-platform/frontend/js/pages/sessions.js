// pages/sessions.js - Sessions page functionality

const Sessions = {
    sessions: [],
    filters: {
        search: '',
        location: '',
        waveType: '',
        dateFrom: '',
        dateTo: ''
    },
    currentEditId: null,

    async init() {
        await this.loadSessions();
        await this.loadFilters();
        this.bindEvents();
    },

    bindEvents() {
        // New session button
        document.getElementById('new-session-btn')?.addEventListener('click', () => {
            this.showNewSessionModal();
        });

        // Session form
        document.getElementById('session-form')?.addEventListener('submit', (e) => {
            this.handleSessionSubmit(e);
        });

        // Cancel button
        document.getElementById('cancel-session')?.addEventListener('click', () => {
            Modal.hide('session-modal');
            this.resetForm();
        });

        // Filters
        document.getElementById('session-search')?.addEventListener('input',
            Utils.debounce(() => this.applyFilters(), CONFIG.DEBOUNCE_DELAY)
        );

        document.getElementById('location-filter')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('wave-filter')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('date-from')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('date-to')?.addEventListener('change', () => {
            this.applyFilters();
        });

        // Rating slider
        const ratingInput = document.getElementById('session-performance');
        const ratingValue = document.querySelector('.rating-value');
        if (ratingInput && ratingValue) {
            ratingInput.addEventListener('input', (e) => {
                ratingValue.textContent = e.target.value;
            });
        }
    },

    async loadSessions() {
        const container = document.getElementById('sessions-list');
        if (!container) return;

        Loading.show('sessions-list');

        try {
            this.sessions = await API.sessions.list();
            this.renderSessions();
        } catch (error) {
            console.error('Error loading sessions:', error);
            API.utils.handleError(error);
            container.innerHTML = EmptyState.create({
                icon: '❌',
                title: 'Error loading sessions',
                text: 'Please try again later'
            });
        } finally {
            Loading.hide('sessions-list');
        }
    },

    async loadFilters() {
        try {
            // Load wave types dynamically
            const waveTypes = await API.schema.getEnumOptions('WaveType') ||
                ['Flat', 'Choppy', 'Medium', 'Large'];

            FormHelpers.populateSelect('wave-filter', waveTypes, 'All Wave Types');
            FormHelpers.populateSelect('session-wave-type', waveTypes, 'Select wave type');

            // Load unique locations from sessions
            const locations = [...new Set(this.sessions.map(s => s.location))];
            FormHelpers.populateSelect('location-filter', locations, 'All Locations');

        } catch (error) {
            console.error('Error loading filters:', error);
        }
    },

    renderSessions() {
        const container = document.getElementById('sessions-list');
        if (!container) return;

        // Apply filters
        let filteredSessions = this.filterSessions();

        // Sort by date (newest first)
        filteredSessions = Utils.sortBy(filteredSessions, 'date', 'desc');

        if (filteredSessions.length === 0) {
            container.innerHTML = EmptyState.create({
                icon: '🏄',
                title: 'No sessions found',
                text: this.hasActiveFilters() ? 'Try adjusting your filters' : 'Start tracking your sailing sessions',
                action: !this.hasActiveFilters() ? {
                    text: 'Add First Session',
                    onclick: 'Sessions.showNewSessionModal()'
                } : null
            });
            return;
        }

        // Render session cards
        const html = filteredSessions.map(session => Card.createSessionCard(session)).join('');
        container.innerHTML = html;

        // Add click handlers to cards
        container.querySelectorAll('.session-card').forEach(card => {
            card.addEventListener('click', () => {
                const sessionId = card.dataset.sessionId;
                this.viewSession(sessionId);
            });
        });
    },

    filterSessions() {
        return this.sessions.filter(session => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchFields = [session.location, session.notes || ''];
                if (!searchFields.some(field => field.toLowerCase().includes(searchTerm))) {
                    return false;
                }
            }

            // Location filter
            if (this.filters.location && session.location !== this.filters.location) {
                return false;
            }

            // Wave type filter
            if (this.filters.waveType && session.wave_type !== this.filters.waveType) {
                return false;
            }

            // Date range filter
            if (this.filters.dateFrom && session.date < this.filters.dateFrom) {
                return false;
            }

            if (this.filters.dateTo && session.date > this.filters.dateTo) {
                return false;
            }

            return true;
        });
    },

    applyFilters() {
        // Update filter values
        this.filters.search = document.getElementById('session-search')?.value || '';
        this.filters.location = document.getElementById('location-filter')?.value || '';
        this.filters.waveType = document.getElementById('wave-filter')?.value || '';
        this.filters.dateFrom = document.getElementById('date-from')?.value || '';
        this.filters.dateTo = document.getElementById('date-to')?.value || '';

        // Re-render sessions
        this.renderSessions();
    },

    hasActiveFilters() {
        return Object.values(this.filters).some(value => value !== '');
    },

    showNewSessionModal() {
        this.currentEditId = null;
        document.getElementById('session-modal-title').textContent = 'New Session';

        // Set default date to today
        document.getElementById('session-date').value = Utils.getTodayDate();

        Modal.show('session-modal');
    },

    async viewSession(sessionId) {
        try {
            const session = await API.sessions.get(sessionId);

            // For now, show edit modal
            // In a full app, this might navigate to a detail page
            this.editSession(sessionId);
        } catch (error) {
            console.error('Error loading session:', error);
            API.utils.handleError(error);
        }
    },

    async editSession(sessionId) {
        this.currentEditId = sessionId;
        document.getElementById('session-modal-title').textContent = 'Edit Session';

        try {
            const session = this.sessions.find(s => s.id === sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Populate form
            FormHelpers.populateForm('session-form', session);

            // Update rating display
            const ratingValue = document.querySelector('.rating-value');
            if (ratingValue) {
                ratingValue.textContent = session.performance_rating;
            }

            Modal.show('session-modal');
        } catch (error) {
            console.error('Error editing session:', error);
            Toast.show('Error loading session', 'error');
        }
    },

    async handleSessionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Get form data
        const formData = FormHelpers.getFormData('session-form');

        // Validate wind speeds
        if (parseFloat(formData.wind_speed_min) > parseFloat(formData.wind_speed_max)) {
            Toast.show('Minimum wind speed cannot be greater than maximum', 'error');
            return;
        }

        // Disable form while processing
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';

        try {
            if (this.currentEditId) {
                // Update existing session
                await API.sessions.update(this.currentEditId, formData);
                Toast.show('Session updated successfully', 'success');
            } else {
                // Create new session
                await API.sessions.create(formData);
                Toast.show('Session created successfully', 'success');
            }

            // Reload sessions
            await this.loadSessions();

            // Close modal and reset form
            Modal.hide('session-modal');
            this.resetForm();

        } catch (error) {
            console.error('Error saving session:', error);
            API.utils.handleError(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Session';
        }
    },

    async deleteSession(sessionId) {
        if (!confirm('Are you sure you want to delete this session?')) {
            return;
        }

        try {
            await API.sessions.delete(sessionId);
            Toast.show('Session deleted successfully', 'success');
            await this.loadSessions();
        } catch (error) {
            console.error('Error deleting session:', error);
            API.utils.handleError(error);
        }
    },

    resetForm() {
        FormHelpers.resetForm('session-form');
        this.currentEditId = null;

        // Reset rating display
        const ratingValue = document.querySelector('.rating-value');
        if (ratingValue) {
            ratingValue.textContent = '3';
        }
    }
};