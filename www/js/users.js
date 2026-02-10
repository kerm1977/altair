/**
 * users.js - Controlador de Gestión de Usuarios (CRM)
 * Maneja el directorio de personas con seguridad de edición/borrado.
 */
(function() {
    
    const STORAGE_KEY = 'app_users_directory';

    const usersController = {
        allUsers: [],
        currentUser: null,
        isEditing: false,

        // --- INICIALIZACIÓN ---
        init: async () => {
            console.log("👥 Iniciando Módulo de Usuarios...");
            
            // Asegurar DB
            if (typeof db !== 'undefined' && db.init && !db.ready) {
                await db.init();
            }

            await usersController.loadUsers();
            usersController.renderList();
        },

        // --- VALIDACIONES EN TIEMPO REAL ---
        validateInput: (el, type) => {
            let val = el.value;

            if (type === 'name') {
                // Letras, TitleCase, Sin Espacios
                val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, ''); 
                if (val.length > 0) {
                    val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                }
                el.value = val;
            } 
            else if (type === 'passport') {
                // Uppercase
                el.value = val.toUpperCase().replace(/\s/g, '');
            } 
            else if (type === 'email') {
                // Lowercase, sin espacios
                el.value = val.toLowerCase().replace(/\s/g, '');
            } 
            else if (type === 'phone') {
                // Solo números, máx 8 chars
                val = val.replace(/\D/g, ''); 
                if (val.length > 8) val = val.slice(0, 8); 
                el.value = val;
            }
        },

        // --- BASE DE DATOS ---
        loadUsers: async () => {
            try {
                const data = await db.find(STORAGE_KEY);
                usersController.allUsers = (data && data.list) ? data.list : [];
            } catch (e) {
                usersController.allUsers = [];
            }
        },

        saveData: async () => {
            const payload = { email: STORAGE_KEY, list: usersController.allUsers, lastUpdate: Date.now() };
            try {
                await db.update(STORAGE_KEY, payload);
            } catch (e) {
                await db.insert(payload);
            }
        },

        // --- NAVEGACIÓN Y VISTAS ---
        backToList: () => {
            document.getElementById('user-form-view').classList.add('hidden');
            document.getElementById('users-list-view').classList.remove('hidden');
            usersController.currentUser = null;
            usersController.isEditing = false;
            usersController.renderList();
        },
        
        closeModule: () => {
            if (window.router && window.router.goHome) {
                window.router.goHome();
            } else {
                window.location.reload(); 
            }
        },

        // --- RENDERIZADO DE LISTA ---
        renderList: () => {
            const container = document.getElementById('users-list-container');
            const term = document.getElementById('user-search')?.value.toLowerCase() || '';
            
            if (!container) return;

            const sorted = [...usersController.allUsers].sort((a, b) => (b.id - a.id));

            const filtered = sorted.filter(u => 
                (u.nombre || '').toLowerCase().includes(term) || 
                (u.cedula || '').includes(term) ||
                (u.apellido1 || '').toLowerCase().includes(term)
            );

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="ph-duotone ph-ghost fs-1 opacity-50"></i>
                        <p class="mt-2">No se encontraron miembros.</p>
                    </div>`;
                return;
            }

            container.innerHTML = filtered.map(u => {
                let statusColor = 'bg-success';
                if(u.estado === 'Inactivo') statusColor = 'bg-secondary';
                if(u.estado === 'Incapacitado') statusColor = 'bg-warning text-dark';
                if(u.estado === 'Eliminar') statusColor = 'bg-danger';

                return `
                <div class="app-card p-3 mb-3 d-flex align-items-center cursor-pointer shadow-sm hover:shadow-md transition-all" onclick="ViewControllers.users.openUser(${u.id})">
                    <div class="rounded-circle bg-slate-100 flex-center fw-bold text-primary fs-5 me-3 border" style="width:50px; height:50px; min-width:50px;">
                        ${u.nombre.charAt(0)}${u.apellido1 ? u.apellido1.charAt(0) : ''}
                    </div>
                    <div class="flex-grow-1 overflow-hidden">
                        <h6 class="fw-bold mb-0 text-truncate text-dark">${u.nombre} ${u.apellido1 || ''}</h6>
                        <div class="small text-muted">${u.cedula || 'Sin ID'}</div>
                    </div>
                    <div class="d-flex flex-column align-items-end gap-1 ms-2">
                        <span class="badge ${statusColor} rounded-pill small" style="font-size:0.6rem">${u.estado || 'Activo'}</span>
                        ${u.puntos === 'Si' ? '<span class="badge bg-warning text-dark border border-warning-subtle rounded-pill" style="font-size:0.6rem">⭐ Puntos</span>' : ''}
                    </div>
                </div>`;
            }).join('');
        },

        filterUsers: (val) => {
            usersController.renderList();
        },

        // --- FORMULARIO ---
        showCreateForm: () => {
            usersController.currentUser = null;
            usersController.isEditing = true;

            document.getElementById('users-list-view').classList.add('hidden');
            document.getElementById('user-form-view').classList.remove('hidden');
            document.getElementById('form-title').innerText = "Nuevo Miembro";
            
            // Limpiar campos
            ['u-nombre', 'u-apellido1', 'u-apellido2', 'u-cedula', 'u-email', 'u-pasaporte', 'u-nacimiento', 'u-telefono', 'u-movil'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.value = '';
            });
            document.getElementById('u-puntos').value = 'No';
            document.getElementById('u-estado').value = 'Activo';

            usersController.setFormState(true);
            usersController.renderButtons('create');
            usersController.handleStatusChange();
        },

        openUser: (id) => {
            const user = usersController.allUsers.find(u => u.id === id);
            if (!user) return;
            usersController.currentUser = user;
            usersController.isEditing = false;

            document.getElementById('users-list-view').classList.add('hidden');
            document.getElementById('user-form-view').classList.remove('hidden');
            document.getElementById('form-title').innerText = "Detalle de Usuario";

            document.getElementById('u-id').value = user.id;
            document.getElementById('u-nombre').value = user.nombre || '';
            document.getElementById('u-apellido1').value = user.apellido1 || '';
            document.getElementById('u-apellido2').value = user.apellido2 || '';
            document.getElementById('u-cedula').value = user.cedula || '';
            document.getElementById('u-email').value = user.email || '';
            document.getElementById('u-pasaporte').value = user.pasaporte || '';
            document.getElementById('u-nacimiento').value = user.nacimiento || '';
            document.getElementById('u-telefono').value = user.telefono || '';
            document.getElementById('u-movil').value = user.movil || '';
            document.getElementById('u-puntos').value = user.puntos || 'No';
            document.getElementById('u-estado').value = user.estado || 'Activo';

            usersController.setFormState(false);
            usersController.renderButtons('view');
            usersController.handleStatusChange();
        },

        setFormState: (editable) => {
            const ids = ['u-nombre', 'u-apellido1', 'u-apellido2', 'u-cedula', 'u-email', 'u-pasaporte', 'u-nacimiento', 'u-puntos', 'u-estado', 'u-telefono', 'u-movil'];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if(el) {
                    if(editable) el.removeAttribute('disabled');
                    else el.setAttribute('disabled', 'true');
                }
            });
        },

        handleStatusChange: () => {
            const val = document.getElementById('u-estado').value;
            const warning = document.getElementById('delete-warning-box');
            if (val === 'Eliminar') warning.classList.remove('hidden');
            else warning.classList.add('hidden');
        },

        renderButtons: (mode) => {
            const container = document.getElementById('form-actions');
            
            if (mode === 'create') {
                container.innerHTML = `
                    <button onclick="ViewControllers.users.saveNewUser()" class="btn btn-primary py-3 rounded-pill fw-bold shadow">
                        <i class="ph-bold ph-floppy-disk me-2"></i> GUARDAR USUARIO
                    </button>
                `;
            } else if (mode === 'edit') {
                container.innerHTML = `
                    <button onclick="ViewControllers.users.saveEditUser()" class="btn btn-success py-3 rounded-pill fw-bold shadow text-white mb-2">
                        <i class="ph-bold ph-check-circle me-2"></i> GUARDAR CAMBIOS
                    </button>
                    <button onclick="ViewControllers.users.cancelEdit()" class="btn btn-light py-3 rounded-pill fw-bold text-muted border">
                        CANCELAR
                    </button>
                `;
            } else { 
                container.innerHTML = `
                    <button onclick="ViewControllers.users.confirmEnableEdit()" class="btn btn-outline-primary py-3 rounded-pill fw-bold border-2 mb-2">
                        <i class="ph-bold ph-pencil-simple me-2"></i> HABILITAR EDICIÓN
                    </button>
                    <button onclick="ViewControllers.users.confirmDeleteUser()" class="btn btn-outline-danger py-3 rounded-pill fw-bold border-2">
                        <i class="ph-bold ph-trash me-2"></i> BORRAR REGISTRO
                    </button>
                `;
            }
        },

        // --- SEGURIDAD 3 PASOS (EDICIÓN) ---
        confirmEnableEdit: () => {
            if(window.ui) window.ui.modal(`<div class="mb-3 text-primary"><i class="ph-fill ph-pencil-circle fs-1"></i></div><h4 class="fw-black">¿Editar Información?</h4><p class="text-muted small">Paso 1/3: Modificar datos sensibles.</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.users.step2EnableEdit()" class="btn btn-primary py-2 rounded-pill fw-bold">SÍ, CONTINUAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`);
        },
        step2EnableEdit: () => {
            if(window.ui) window.ui.modal(`<div class="mb-3 text-warning"><i class="ph-fill ph-warning-circle fs-1"></i></div><h4 class="fw-black">Confirmación</h4><p class="text-muted small">Paso 2/3: Cambios afectan reportes.</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.users.step3EnableEdit()" class="btn btn-warning py-2 rounded-pill fw-bold text-dark">ENTIENDO</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`);
        },
        step3EnableEdit: () => {
            if(window.ui) window.ui.modal(`<div class="mb-3 text-dark"><i class="ph-fill ph-lock-open fs-1"></i></div><h4 class="fw-black">¿Desbloquear?</h4><p class="text-muted small">Paso 3/3: ¿Proceder?</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.users.activateEditMode()" class="btn btn-dark py-2 rounded-pill fw-bold">SÍ, EDITAR AHORA</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`);
        },
        activateEditMode: () => {
            window.ui.closeModal();
            usersController.setFormState(true);
            usersController.renderButtons('edit');
            window.ui.toast("Edición Habilitada 🔓");
        },
        cancelEdit: () => {
            usersController.openUser(usersController.currentUser.id);
            window.ui.toast("Edición Cancelada");
        },

        // --- SEGURIDAD 3 PASOS (BORRADO) ---
        confirmDeleteUser: () => {
            if(window.ui) window.ui.modal(`<div class="mb-3 text-warning"><i class="ph-fill ph-warning fs-1"></i></div><h4 class="fw-black">¿Borrar Usuario?</h4><p class="text-muted small">Paso 1/3: ¿Deseas eliminar este registro?</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.users.step2DeleteUser()" class="btn btn-warning py-2 rounded-pill fw-bold text-dark">SÍ, CONTINUAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`);
        },
        step2DeleteUser: () => {
            if(window.ui) window.ui.modal(`<div class="mb-3 text-danger"><i class="ph-fill ph-warning-octagon fs-1"></i></div><h4 class="fw-black text-danger">¡Pérdida de Datos!</h4><p class="text-muted small">Paso 2/3: Se eliminará <strong>toda la información</strong> de este usuario. Esta acción NO se puede deshacer.</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.users.step3DeleteUser()" class="btn btn-danger py-2 rounded-pill fw-bold">ASUMO EL RIESGO</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`);
        },
        step3DeleteUser: () => {
            if(window.ui) window.ui.modal(`<div class="mb-3 text-dark"><i class="ph-fill ph-skull fs-1"></i></div><h4 class="fw-black">¿ESTÁ SEGURO?</h4><p class="text-muted small">Paso 3/3: Confirmación Final.</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.users.executeDelete()" class="btn btn-dark py-2 rounded-pill fw-bold">SÍ, BORRAR USUARIO</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`);
        },
        executeDelete: async () => {
            const id = usersController.currentUser.id;
            usersController.allUsers = usersController.allUsers.filter(u => u.id !== id);
            await usersController.saveData();
            window.ui.closeModal();
            window.ui.toast("Usuario eliminado correctamente");
            usersController.backToList();
        },

        // --- GUARDADO ---
        getFormData: () => {
            return {
                nombre: document.getElementById('u-nombre').value.trim(),
                apellido1: document.getElementById('u-apellido1').value.trim(),
                apellido2: document.getElementById('u-apellido2').value.trim(),
                cedula: document.getElementById('u-cedula').value.trim(),
                email: document.getElementById('u-email').value.trim(),
                pasaporte: document.getElementById('u-pasaporte').value.trim(),
                nacimiento: document.getElementById('u-nacimiento').value,
                telefono: document.getElementById('u-telefono').value.trim(),
                movil: document.getElementById('u-movil').value.trim(),
                puntos: document.getElementById('u-puntos').value,
                estado: document.getElementById('u-estado').value
            };
        },

        validateForm: (data) => {
            if (!data.nombre || !data.cedula) return "Nombre y Cédula son obligatorios";
            if (data.telefono && data.telefono.length !== 8) return "El Teléfono debe tener 8 dígitos";
            if (data.movil && data.movil.length !== 8) return "El Móvil debe tener 8 dígitos";
            return null;
        },

        saveNewUser: async () => {
            const data = usersController.getFormData();
            const error = usersController.validateForm(data);
            if (error) return window.ui.toast(error);

            const newUser = { id: Date.now(), ...data };
            usersController.allUsers.push(newUser);
            await usersController.saveData();
            
            window.ui.toast("Usuario Creado");
            usersController.backToList();
        },

        saveEditUser: async () => {
            if (!usersController.currentUser) return;
            const data = usersController.getFormData();
            const error = usersController.validateForm(data);
            if (error) return window.ui.toast(error);

            const idx = usersController.allUsers.findIndex(u => u.id === usersController.currentUser.id);
            if (idx !== -1) {
                usersController.allUsers[idx] = { ...usersController.allUsers[idx], ...data };
                await usersController.saveData();
                window.ui.toast("Cambios Guardados");
                
                // CAMBIO AQUÍ: Regresar a la lista en lugar de quedarse en la ficha
                usersController.backToList();
            }
        }
    };

    window.ViewControllers = window.ViewControllers || {};
    window.ViewControllers.users = usersController;

})();