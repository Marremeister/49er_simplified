// pages/equipment.js - Equipment page functionality

const Equipment = {
    equipment: [],
    activeTab: 'active',
    currentEditId: null,

    async init() {
        await this.loadEquipment();
        await this.loadEquipmentTypes();
        this.bindEvents();
    },

    bindEvents() {
        // New equipment button
        document.getElementById('new-equipment-btn')?.addEventListener('click', () => {
            this.showNewEquipmentModal();
        });

        // Equipment form
        document.getElementById('equipment-form')?.addEventListener('submit', (e) => {
            this.handleEquipmentSubmit(e);
        });

        // Cancel button
        document.getElementById('cancel-equipment')?.addEventListener('click', () => {
            Modal.hide('equipment-modal');
            this.resetForm();
        });

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    },

    async loadEquipment() {
        const container = document.getElementById('equipment-grid');
        if (!container) return;

        Loading.show('equipment-grid');

        try {
            // Load all equipment (active and retired)
            this.equipment = await API.equipment.list({ active_only: false });
            this.renderEquipment();
        } catch (error) {
            console.error('Error loading equipment:', error);
            API.utils.handleError(error);
            container.innerHTML = EmptyState.create({
                icon: '❌',
                title: 'Error loading equipment',
                text: 'Please try again later'
            });
        } finally {
            Loading.hide('equipment-grid');
        }
    },

    async loadEquipmentTypes() {
        try {
            // Load equipment types dynamically
            const equipmentTypes = await API.schema.getEnumOptions('EquipmentType') ||
                ['Mainsail', 'Jib', 'Mast', 'Boom', 'Rudder', 'Centerboard', 'Other'];

            FormHelpers.populateSelect('equipment-type', equipmentTypes, 'Select type');
        } catch (error) {
            console.error('Error loading equipment types:', error);
        }
    },

    renderEquipment() {
        const container = document.getElementById('equipment-grid');
        if (!container) return;

        // Filter equipment based on active tab
        let filteredEquipment = this.equipment.filter(item => {
            if (this.activeTab === 'active') return item.active;
            if (this.activeTab === 'retired') return !item.active;
            return true; // 'all' tab
        });

        // Sort by name
        filteredEquipment = Utils.sortBy(filteredEquipment, 'name');

        if (filteredEquipment.length === 0) {
            let emptyMessage = {
                active: {
                    icon: '⚙️',
                    title: 'No active equipment',
                    text: 'Add your sailing equipment to get started',
                    action: {
                        text: 'Add Equipment',
                        onclick: 'Equipment.showNewEquipmentModal()'
                    }
                },
                retired: {
                    icon: '📦',
                    title: 'No retired equipment',
                    text: 'Retired equipment will appear here'
                },
                all: {
                    icon: '⚙️',
                    title: 'No equipment yet',
                    text: 'Add your sailing equipment to get started',
                    action: {
                        text: 'Add Equipment',
                        onclick: 'Equipment.showNewEquipmentModal()'
                    }
                }
            };

            container.innerHTML = EmptyState.create(emptyMessage[this.activeTab]);
            return;
        }

        // Render equipment cards
        const html = filteredEquipment.map(item => Card.createEquipmentCard(item)).join('');
        container.innerHTML = html;
    },

    switchTab(tab) {
        this.activeTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Re-render equipment
        this.renderEquipment();
    },

    showNewEquipmentModal() {
        this.currentEditId = null;
        document.getElementById('equipment-modal-title').textContent = 'Add Equipment';
        Modal.show('equipment-modal');
    },

    async edit(equipmentId) {
        this.currentEditId = equipmentId;
        document.getElementById('equipment-modal-title').textContent = 'Edit Equipment';

        try {
            const equipment = this.equipment.find(e => e.id === equipmentId);
            if (!equipment) {
                throw new Error('Equipment not found');
            }

            // Populate form
            FormHelpers.populateForm('equipment-form', equipment);
            Modal.show('equipment-modal');
        } catch (error) {
            console.error('Error editing equipment:', error);
            Toast.show('Error loading equipment', 'error');
        }
    },

    async handleEquipmentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Get form data
        const formData = FormHelpers.getFormData('equipment-form');

        // Disable form while processing
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';

        try {
            if (this.currentEditId) {
                // Update existing equipment
                await API.equipment.update(this.currentEditId, formData);
                Toast.show('Equipment updated successfully', 'success');
            } else {
                // Create new equipment
                await API.equipment.create(formData);
                Toast.show('Equipment added successfully', 'success');
            }

            // Reload equipment
            await this.loadEquipment();

            // Close modal and reset form
            Modal.hide('equipment-modal');
            this.resetForm();

        } catch (error) {
            console.error('Error saving equipment:', error);
            API.utils.handleError(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Equipment';
        }
    },

    async retire(equipmentId) {
        if (!confirm('Are you sure you want to retire this equipment?')) {
            return;
        }

        try {
            await API.equipment.retire(equipmentId);
            Toast.show('Equipment retired successfully', 'success');
            await this.loadEquipment();
        } catch (error) {
            console.error('Error retiring equipment:', error);
            API.utils.handleError(error);
        }
    },

    async reactivate(equipmentId) {
        try {
            await API.equipment.reactivate(equipmentId);
            Toast.show('Equipment reactivated successfully', 'success');
            await this.loadEquipment();
        } catch (error) {
            console.error('Error reactivating equipment:', error);
            API.utils.handleError(error);
        }
    },

    async delete(equipmentId) {
        if (!confirm('Are you sure you want to permanently delete this equipment? This action cannot be undone.')) {
            return;
        }

        try {
            await API.equipment.delete(equipmentId);
            Toast.show('Equipment deleted successfully', 'success');
            await this.loadEquipment();
        } catch (error) {
            console.error('Error deleting equipment:', error);
            API.utils.handleError(error);
        }
    },

    resetForm() {
        FormHelpers.resetForm('equipment-form');
        this.currentEditId = null;
    }
};