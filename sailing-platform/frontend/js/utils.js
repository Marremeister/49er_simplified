// utils.js - Utility functions for the application

const Utils = {
    // Date formatting
    formatDate(dateString, format = 'MMM DD, YYYY') {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (format === 'MMM DD, YYYY') {
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        } else if (format === 'YYYY-MM-DD') {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        return date.toLocaleDateString();
    },

    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    },

    // Calculate days ago
    daysAgo(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = today - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    // Format numbers with decimal places
    formatNumber(num, decimals = 1) {
        return Number(num).toFixed(decimals);
    },

    // Create star rating display
    createStarRating(rating, maxRating = 5) {
        let stars = '';
        for (let i = 1; i <= maxRating; i++) {
            stars += i <= rating ? '★' : '☆';
        }
        return stars;
    },

    // Debounce function for search/filter inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // Convert snake_case to Title Case
    snakeToTitle(str) {
        return str.split('_').map(word => Utils.capitalize(word)).join(' ');
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Parse form data to object
    formDataToObject(formData) {
        const object = {};
        formData.forEach((value, key) => {
            // Handle multiple values with same key (like checkboxes)
            if (object[key]) {
                if (!Array.isArray(object[key])) {
                    object[key] = [object[key]];
                }
                object[key].push(value);
            } else {
                object[key] = value;
            }
        });
        return object;
    },

    // Validate email format
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Get wind condition label
    getWindCondition(windSpeed) {
        if (windSpeed >= CONFIG.HEAVY_WEATHER_THRESHOLD) {
            return { label: 'Heavy', class: 'danger' };
        } else if (windSpeed <= CONFIG.LIGHT_WEATHER_THRESHOLD) {
            return { label: 'Light', class: 'success' };
        } else {
            return { label: 'Medium', class: 'warning' };
        }
    },

    // Sort array of objects by property
    sortBy(array, property, order = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];

            if (order === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
    },

    // Filter array by search term
    filterBySearch(array, searchTerm, properties) {
        if (!searchTerm) return array;

        const term = searchTerm.toLowerCase();
        return array.filter(item => {
            return properties.some(prop => {
                const value = item[prop];
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    },

    // Group array by property
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    },

    // Calculate average
    average(array, property) {
        if (array.length === 0) return 0;
        const sum = array.reduce((acc, item) => acc + (property ? item[property] : item), 0);
        return sum / array.length;
    },

    // Create CSS class string from object
    classNames(classes) {
        return Object.entries(classes)
            .filter(([_, value]) => value)
            .map(([key, _]) => key)
            .join(' ');
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Check if objects are equal
    isEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Get query parameters from URL
    getQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const queries = queryString.split('&');

        queries.forEach(query => {
            const [key, value] = query.split('=');
            if (key) {
                params[key] = decodeURIComponent(value || '');
            }
        });

        return params;
    },

    // Update query parameters in URL
    updateQueryParams(params) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.pushState({}, '', url.toString());
    },

    // Local storage helpers
    storage: {
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return null;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error writing to localStorage:', e);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Error clearing localStorage:', e);
                return false;
            }
        }
    }
};