// js/sessions.js
let currentEditingSessionId = null; // To track if we are editing or creating

const SessionsService = {
    getAllSessions: async function() {
        return await request('/sessions', 'GET');
    },
    createSession: async function(sessionData) {
        return await request('/sessions', 'POST', sessionData);
    },
    getSessionById: async function(sessionId) {
        return await request(`/sessions/${sessionId}`, 'GET');
    },
    updateSession: async function(sessionId, sessionData) {
        return await request(`/sessions/${sessionId}`, 'PUT', sessionData);
    },
    deleteSession: async function(sessionId) {
        return await request(`/sessions/${sessionId}`, 'DELETE');
    }
};

function renderSessionItem(session) {
    const date = session.date ? new Date(session.date + 'T00:00:00Z') : null; // Ensure date is parsed as UTC then displayed in local timezone
    const formattedDate = date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

    return `
        <div class="session-item" data-id="${session.id}">
            <h3>${session.location || 'N/A'} - <span style="font-weight:normal;">${formattedDate}</span></h3>
            <p><strong>Wind:</strong> ${session.wind_speed_min === null || session.wind_speed_min === undefined ? 'N/A' : session.wind_speed_min} - ${session.wind_speed_max === null || session.wind_speed_max === undefined ? 'N/A' : session.wind_speed_max} knots</p>
            <p><strong>Waves:</strong> ${session.wave_type || 'N/A'} ${session.wave_direction ? '(' + session.wave_direction + ')' : ''}</p>
            <p><strong>Hours on Water:</strong> ${session.hours_on_water === null || session.hours_on_water === undefined ? 'N/A' : session.hours_on_water}</p>
            <p><strong>Performance Rating:</strong> ${session.performance_rating === null || session.performance_rating === undefined ? 'N/A' : session.performance_rating + ' / 5'}</p>
            <p><strong>Notes:</strong> ${session.notes || 'None'}</p>
            <div class="actions">
                <button class="btn-warning edit-session-button" data-id="${session.id}">Edit</button>
                <button class="btn-danger delete-session-button" data-id="${session.id}">Delete</button>
            </div>
        </div>
    `;
}


function renderSessionsList(sessions) {
    const listElement = document.getElementById('sessions-list');
    const loadingElement = document.getElementById('loading-sessions');
    loadingElement.style.display = 'none';
    listElement.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        listElement.innerHTML = '<p>No sailing sessions recorded yet. Click "Log New Session" to get started!</p>';
        return;
    }
    // Sort sessions by date, most recent first
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

    sessions.forEach(session => {
        listElement.innerHTML += renderSessionItem(session);
    });

    document.querySelectorAll('.edit-session-button').forEach(button => {
        button.addEventListener('click', handleEditSession);
    });
    document.querySelectorAll('.delete-session-button').forEach(button => {
        button.addEventListener('click', handleDeleteSession);
    });
}

async function loadAndDisplaySessions() {
    const loadingElement = document.getElementById('loading-sessions');
    const listElement = document.getElementById('sessions-list');
    listElement.innerHTML = '';
    loadingElement.style.display = 'block';

    try {
        const sessions = await SessionsService.getAllSessions();
        renderSessionsList(sessions);
    } catch (error) {
        console.error("Failed to load sessions:", error.message);
        listElement.innerHTML = '<p style="color:red;">Could not load sessions. Please try again later.</p>';
    } finally {
        loadingElement.style.display = 'none';
    }
}

function openSessionForm(sessionData = null) {
    const modal = document.getElementById('session-form-modal');
    const form = document.getElementById('session-form');
    const formTitle = document.getElementById('session-form-title');
    UI.clearForm('session-form'); // Use UI.clearForm which also clears hidden ID

    UI.populateSelectWithOptions('session-wave-type', APP_CONFIG.waveTypes); // [cite: 8]

    if (sessionData) {
        currentEditingSessionId = sessionData.id;
        formTitle.textContent = 'Edit Sailing Session';
        document.getElementById('session-id').value = sessionData.id;
        document.getElementById('session-date').value = sessionData.date; // Assumes YYYY-MM-DD format from backend
        document.getElementById('session-location').value = sessionData.location || '';
        document.getElementById('session-wind-min').value = sessionData.wind_speed_min === null ? '' : sessionData.wind_speed_min;
        document.getElementById('session-wind-max').value = sessionData.wind_speed_max === null ? '' : sessionData.wind_speed_max;
        document.getElementById('session-wave-type').value = sessionData.wave_type || '';
        document.getElementById('session-wave-direction').value = sessionData.wave_direction || '';
        document.getElementById('session-hours').value = sessionData.hours_on_water === null ? '' : sessionData.hours_on_water;
        document.getElementById('session-performance').value = sessionData.performance_rating === null ? '' : sessionData.performance_rating;
        document.getElementById('session-notes').value = sessionData.notes || '';
    } else {
        currentEditingSessionId = null;
        formTitle.textContent = 'Log New Session';
        // Ensure the default '-- Select --' option is selected for wave type
        document.getElementById('session-wave-type').selectedIndex = 0;
    }
    modal.style.display = 'block';
}

function closeSessionForm() {
    const modal = document.getElementById('session-form-modal');
    modal.style.display = 'none';
    currentEditingSessionId = null;
    UI.clearForm('session-form');
}

async function handleSessionFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const sessionData = {};

    for (let [key, value] of formData.entries()) {
        // Skip empty 'id' field if it wasn't populated (i.e., for new sessions)
        if (key === 'id' && !value) continue;

        if (value === '' && (key === 'wind_speed_min' || key === 'wind_speed_max' || key === 'hours_on_water' || key === 'performance_rating')) {
            sessionData[key] = null; // Send null for empty optional number fields
        } else if (key === 'wind_speed_min' || key === 'wind_speed_max' || key === 'hours_on_water' || key === 'performance_rating') {
            sessionData[key] = parseFloat(value);
        } else {
            sessionData[key] = value;
        }
    }
    // Ensure required fields are present, or rely on backend validation. For MVP, we assume backend handles it.

    try {
        if (currentEditingSessionId) {
            // The 'id' should be part of sessionData if editing, taken from the hidden field.
            // Make sure it's not in sessionData if currentEditingSessionId is null.
            // The FormData loop above handles this by skipping empty 'id'.
            await SessionsService.updateSession(currentEditingSessionId, sessionData);
            alert('Session updated successfully!');
        } else {
            // Remove 'id' if it's accidentally present for new session
            delete sessionData.id;
            await SessionsService.createSession(sessionData);
            alert('Session created successfully!');
        }
        closeSessionForm();
        loadAndDisplaySessions();
    } catch (error) {
        console.error('Failed to save session:', error.message);
        // Error is already displayed by the `request` function in api.js
    }
}

async function handleEditSession(event) {
    const sessionId = event.target.dataset.id;
    try {
        const sessionToEdit = await SessionsService.getSessionById(sessionId);
        if (sessionToEdit) {
            openSessionForm(sessionToEdit);
        } else {
            alert("Could not find session data to edit.");
        }
    } catch (error) {
        console.error(`Error fetching session details for edit: ${error.message}`);
        // Error is displayed by `request`
    }
}

async function handleDeleteSession(event) {
    const sessionId = event.target.dataset.id;
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
        try {
            await SessionsService.deleteSession(sessionId);
            alert('Session deleted successfully!');
            loadAndDisplaySessions();
        } catch (error) {
            console.error(`Error deleting session: ${error.message}`);
            // Error is displayed by `request`
        }
    }
}

function initSessionsView() {
    // Ensure elements exist before adding listeners
    const showButton = document.getElementById('show-create-session-form-button');
    const closeButton = document.getElementById('close-session-form-button');
    const cancelButton = document.getElementById('cancel-session-form-button');
    const sessionForm = document.getElementById('session-form');

    if (showButton) showButton.addEventListener('click', () => openSessionForm(null));
    if (closeButton) closeButton.addEventListener('click', closeSessionForm);
    if (cancelButton) cancelButton.addEventListener('click', closeSessionForm);
    if (sessionForm) sessionForm.addEventListener('submit', handleSessionFormSubmit);

    // Initial population of wave types if the form is visible or might become visible.
    // This ensures the dropdown is ready when the form is first opened.
    if (document.getElementById('session-wave-type') && APP_CONFIG && APP_CONFIG.waveTypes) {
        UI.populateSelectWithOptions('session-wave-type', APP_CONFIG.waveTypes);
    }
}