// js/ui.js
const UI = {
    showView: function(viewId) {
        document.querySelectorAll('#app-content section').forEach(section => {
            section.style.display = 'none';
        });
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.style.display = 'block';
        } else {
            console.error(`View with id ${viewId} not found.`);
            // Fallback to login view if requested view doesn't exist and user not authenticated
            if (!AuthService.isAuthenticated()) {
                 document.getElementById('login-view').style.display = 'block';
            } else {
                // If authenticated and view not found, maybe show dashboard or an error message
                document.getElementById('dashboard-view').style.display = 'block';
            }
        }
    },

    updateNav: function() {
        const nav = document.getElementById('main-nav');
        if (AuthService.isAuthenticated()) {
            nav.style.display = 'block'; // Or 'flex', 'inline-block' depending on your nav CSS
        } else {
            nav.style.display = 'none';
        }
    },

    populateSelectWithOptions: function(selectElementId, optionsArray, valueField = null, textField = null) {
        const select = document.getElementById(selectElementId);
        if (!select) {
            console.warn(`Select element with ID '${selectElementId}' not found for populating options.`);
            return;
        }
        select.innerHTML = ''; // Clear existing options

        // Add a default, non-selectable option
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "-- Select --";
        defaultOption.disabled = true;
        defaultOption.selected = true; // Make it selected by default
        select.appendChild(defaultOption);

        optionsArray.forEach(option => {
            const optionEl = document.createElement('option');
            if (typeof option === 'object' && valueField && textField) {
                optionEl.value = option[valueField];
                optionEl.textContent = option[textField];
            } else { // Assuming optionsArray is an array of strings
                optionEl.value = option;
                optionEl.textContent = option;
            }
            select.appendChild(optionEl);
        });
    },

    displayError: function(message) {
        // Simple alert for now. Consider a more user-friendly notification system for a real app.
        alert(`Error: ${message}`);
    },

    clearForm: function(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            // Manually clear hidden ID field if it exists
            const hiddenIdField = form.querySelector('input[type="hidden"][name="id"]');
            if (hiddenIdField) {
                hiddenIdField.value = '';
            }
        } else {
            console.warn(`Form with ID '${formId}' not found for clearing.`);
        }
    }
};