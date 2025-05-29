// components.js - Reusable UI components

// Toast notification system
const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            console.error('Toast container not found');
        }
    },

    show(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.getIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;

        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after duration
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
};

// Modal system
const Modal = {
    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    init() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hide(modal.id);
                }
            });
        });

        // Close modals with close button
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    this.hide(modal.id);
                }
            });
        });
    }
};

// Loading component
const Loading = {
    show(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        container.appendChild(overlay);
    },

    hide(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const overlay = container.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
};

// Empty state component
const EmptyState = {
    create(options) {
        const { icon = '📭', title = 'No data found', text = '', action = null } = options;

        let html = `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-text">${text}</p>
        `;

        if (action) {
            html += `<button class="btn btn-primary" onclick="${action.onclick}">${action.text}</button>`;
        }

        html += '</div>';
        return html;
    }
};

// Card component factory
const Card = {
    createSessionCard(session) {
        const avgWind = (session.wind_speed_min + session.wind_speed_max) / 2;
        const windCondition = Utils.getWindCondition(avgWind);

        return `
            <div class="session-card" data-session-id="${session.id}">
                <div class="session-header">
                    <div>
                        <h3 class="session-location">${session.location}</h3>
                        <p class="session-date">${Utils.formatDate(session.date)}</p>
                    </div>
                    <div class="session-rating">
                        ${Utils.createStarRating(session.performance_rating)}
                    </div>
                </div>
                <div class="session-details">
                    <div class="detail-item">
                        <span class="detail-icon">💨</span>
                        <span>${session.wind_speed_min}-${session.wind_speed_max} knots</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🌊</span>
                        <span>${session.wave_type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">⏱</span>
                        <span>${session.hours_on_water} hours</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🧭</span>
                        <span>${session.wave_direction}</span>
                    </div>
                </div>
                ${session.notes ? `<p class="session-notes">${session.notes}</p>` : ''}
                <div class="session-footer">
                    <span class="badge badge-${windCondition.class}">${windCondition.label} Wind</span>
                </div>
            </div>
        `;
    },

    createEquipmentCard(equipment) {
        const ageInDays = equipment.age_in_days || 0;
        const isOld = ageInDays > CONFIG.OLD_EQUIPMENT_THRESHOLD;

        return `
            <div class="equipment-card" data-equipment-id="${equipment.id}">
                <span class="equipment-badge badge-${equipment.active ? 'active' : 'retired'}">
                    ${equipment.active ? 'Active' : 'Retired'}
                </span>
                <h3 class="equipment-name">${equipment.name}</h3>
                <span class="equipment-type">${equipment.type}</span>
                <div class="equipment-details">
                    <div class="equipment-detail">
                        <strong>Manufacturer:</strong> ${equipment.manufacturer}
                    </div>
                    <div class="equipment-detail">
                        <strong>Model:</strong> ${equipment.model}
                    </div>
                    ${equipment.purchase_date ? `
                        <div class="equipment-detail">
                            <strong>Purchase Date:</strong> ${Utils.formatDate(equipment.purchase_date)}
                        </div>
                        <div class="equipment-detail">
                            <strong>Age:</strong> ${ageInDays} days ${isOld ? '⚠️' : ''}
                        </div>
                    ` : ''}
                    ${equipment.notes ? `
                        <div class="equipment-detail">
                            <strong>Notes:</strong> ${equipment.notes}
                        </div>
                    ` : ''}
                </div>
                <div class="equipment-actions">
                    <button class="btn btn-sm btn-secondary" onclick="Equipment.edit('${equipment.id}')">
                        Edit
                    </button>
                    ${equipment.active ? `
                        <button class="btn btn-sm btn-danger" onclick="Equipment.retire('${equipment.id}')">
                            Retire
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-success" onclick="Equipment.reactivate('${equipment.id}')">
                            Reactivate
                        </button>
                    `}
                </div>
            </div>
        `;
    }
};

// Form helpers
const FormHelpers = {
    // Populate select options dynamically
    async populateSelect(selectId, options, placeholder = 'Select...') {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Clear existing options
        select.innerHTML = '';

        // Add placeholder
        if (placeholder) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = placeholder;
            select.appendChild(option);
        }

        // Add options
        options.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = Utils.snakeToTitle(value);
            select.appendChild(option);
        });
    },

    // Populate form with data
    populateForm(formId, data) {
        const form = document.getElementById(formId);
        if (!form) return;

        Object.entries(data).forEach(([key, value]) => {
            const input = form.elements[key];
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else if (input.type === 'date' && value) {
                    // Format date for input
                    input.value = value.split('T')[0];
                } else {
                    input.value = value || '';
                }
            }
        });
    },

    // Reset form
    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    },

    // Get form data as object
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return null;

        const formData = new FormData(form);
        return Utils.formDataToObject(formData);
    }
};

// Chart helpers
const ChartHelpers = {
    // Create a simple bar chart
    createBarChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { height = 300, color = CONFIG.CHART_COLORS.primary } = options;

        // Find max value for scaling
        const values = Object.values(data);
        const maxValue = Math.max(...values);

        // Create chart HTML
        let html = '<div class="simple-bar-chart" style="height: ' + height + 'px">';

        Object.entries(data).forEach(([label, value]) => {
            const percentage = (value / maxValue) * 100;
            html += `
                <div class="bar-item">
                    <div class="bar-label">${label}</div>
                    <div class="bar-container">
                        <div class="bar" style="width: ${percentage}%; background-color: ${color}"></div>
                        <span class="bar-value">${value}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // Create a simple pie chart
    createPieChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // For simplicity, we'll create a legend-based representation
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);

        let html = '<div class="simple-pie-chart">';

        Object.entries(data).forEach(([label, value], index) => {
            const percentage = ((value / total) * 100).toFixed(1);
            const color = CONFIG.CHART_COLORS[Object.keys(CONFIG.CHART_COLORS)[index]] || CONFIG.CHART_COLORS.gray;

            html += `
                <div class="pie-item">
                    <span class="pie-color" style="background-color: ${color}"></span>
                    <span class="pie-label">${label}</span>
                    <span class="pie-value">${value} (${percentage}%)</span>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }
};

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    Modal.init();
});