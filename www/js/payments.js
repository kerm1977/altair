/**
 * payments.js (CONTROLADOR PRINCIPAL - MVC)
 * Responsabilidad: Coordinar la interacción entre el Usuario, el Store (Datos), 
 * el Calc (Lógica) y el Render (Vista).
 */
(function() {

    // --- DATOS MAESTROS ---
    const MASTER_DATA = {
        maxCaps: ['14', '17', '28', '31', '34', '+35'],
        includesOptions: [
            'Transporte', 'Alimentación', 'Guías', 'Tiquetes Aéreos', 'Impuestos', 
            'Duchas', 'Desayuno', 'Almuerzo', 'Cena', 'Refrigerio', 'Café', 
            'Permisos de Paso', 'Entrada', 'Lancha', 'Todo Incluido', 'Pasaporte'
        ],
        eventTypes: [
            'El Camino de Costa Rica', 'Parques Nacionales', 'Convivio', 'Fiesta de Fin de Año',
            'Caminata Recreativa', 'Caminata Básica', 'Caminata Intermedia', 
            'Caminata Difícil', 'Caminata Avanzada Técnica', 'Otra'
        ],
        stages: [
            'Etapa 1a', 'Etapa 1b', 'Etapa 1&b', 'Etapa 2', 'Etapa 3', 'Etapa 4', 'Etapa 3&4',
            'Etapa 5', 'Etapa 6', 'Etapa 7', 'Etapa 8', 'Etapa 9', 'Etapa 10', 'Etapa 11',
            'Etapa 12', 'Etapa 13', 'Etapa 14', 'Etapa 15', 'Etapa 14&15', 'Etapa 16'
        ],
        locations: [
            'Parque de Tres Ríos - Escuela', 'Parque de Tres Ríos - Letras', 
            'Parque de Tres Ríos - Cruz Roja', 'Otro'
        ],
        defaultAccounts: [
            { type: 'SINPE Móvil', number: '86227500', name: 'Kenneth Ruiz Matamoros' },
            { type: 'SINPE Móvil', number: '86529837', name: 'Jenny Ceciliano Cordoba' },
            { type: 'SINPE Móvil', number: '87984232', name: 'Jenny Ceciliano Cordoba' }
        ]
    };

    const paymentsController = {
        selectedWalkerId: null, 
        detailTimeout: null, 
        lastExchangeRate: 530, 
        userDirectory: [],

        // --- 1. INICIALIZACIÓN ---
        init: async () => {
            console.log("🚀 Controlador Pagos: Iniciando...");
            if (window.router && window.router.loadScript) {
                try {
                    await window.router.loadScript('js/payments_calc.js');
                    await window.router.loadScript('js/payments_store.js');
                    await window.router.loadScript('js/payments_render.js');
                    await window.router.loadScript('js/payments_export.js');
                    await window.router.loadScript('js/payments_mgr.js');
                } catch (e) { console.error("Error dependencias:", e); return; }
            }
            if (typeof db !== 'undefined' && window.PaymentsStore) {
                if (!db.ready && db.init) await db.init();
                await window.PaymentsStore.init(db);
                
                // Cargar directorio para el selector
                try {
                    const dirData = await db.find('app_users_directory');
                    if (dirData && dirData.list) paymentsController.userDirectory = dirData.list;
                } catch (err) { console.warn("Directorio vacío"); }
            }
            paymentsController.renderMainList();
            
            // Cerrar autocomplete al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.autocomplete-box') && !e.target.closest('input[data-autocomplete]')) {
                    const box = document.getElementById('autocomplete-suggestions');
                    if (box) box.remove();
                }
            });

            // --- UI ADJUSTMENTS ---
            setTimeout(() => {
                const btnNew = document.querySelector('button[onclick="paymentsApp.addWalker()"]');
                if(btnNew) {
                    btnNew.innerHTML = '<i class="ph-bold ph-user-plus"></i> Nuevo Pago';
                }
            }, 100);
        },

        // --- 2. VISTAS ---
        renderMainList: () => {
            if (!window.PaymentsStore || !window.PaymentsRender) return;
            const events = window.PaymentsStore.getAllEvents();
            const container = document.getElementById('saved-events-list');
            if (container) {
                container.innerHTML = window.PaymentsRender.mainList(events, (ev) => {
                    return window.PaymentsCalc.getEventTotal(ev, paymentsController.lastExchangeRate);
                });
            }
        },

        renderWalkers: () => {
            const ev = window.PaymentsStore.getCurrentEvent();
            const container = document.getElementById('walkers-container');
            const badge = document.getElementById('walker-count');
            if (container && ev && window.PaymentsRender) {
                if(badge) {
                    const label = ev.isWalkersCollapsed ? 'Participantes' : 'Personas';
                    badge.innerText = `${ev.walkers.length} ${label}`;
                }
                
                container.innerHTML = window.PaymentsRender.walkerList(ev.walkers);
                paymentsController.renderTotals();
            }
        },

        renderTotals: () => {
            const area = document.getElementById('totals-area');
            if (area) { area.classList.add('hidden'); area.innerHTML = ''; }
        },

        // --- 3. DELEGACIÓN ---
        viewWalkerDetail: (id) => { if(window.PaymentsManager) window.PaymentsManager.viewDetail(id, paymentsController.lastExchangeRate); },
        closeDetail: () => { if(window.PaymentsManager) window.PaymentsManager.closeDetail(() => { paymentsController.renderWalkers(); }); },
        addPaymentToWalker: (wId) => { if(window.PaymentsManager) window.PaymentsManager.addPayment(wId, paymentsController.lastExchangeRate); },
        togglePayment: (wId, pId) => { if(window.PaymentsManager) window.PaymentsManager.togglePayment(wId, pId, paymentsController.lastExchangeRate); },
        updateWalkerPayment: (wId, pId, field, val) => {
            if(window.PaymentsManager) {
                window.PaymentsManager.updatePayment(wId, pId, field, val, paymentsController.lastExchangeRate, (newRate) => {
                    if(newRate > 0) paymentsController.lastExchangeRate = newRate;
                });
            }
        },
        confirmEditPayment: (wId, pId) => { if(window.PaymentsManager) window.PaymentsManager.confirmEditPayment(wId, pId); },
        enableEditPayment: (wId, pId) => { if(window.PaymentsManager) window.PaymentsManager.enableEditPayment(wId, pId, paymentsController.lastExchangeRate); },
        confirmFinishEdit: (wId, pId) => { if(window.PaymentsManager) window.PaymentsManager.confirmFinishEdit(wId, pId); },
        finishEditPayment: (wId, pId) => { if(window.PaymentsManager) window.PaymentsManager.finishEditPayment(wId, pId, paymentsController.lastExchangeRate); },
        confirmDeletePayment: (wId, pId) => { if(window.PaymentsManager) window.PaymentsManager.confirmDeletePayment(wId, pId); },
        finalDeletePayment: (wId, pId) => { if(window.PaymentsManager) window.PaymentsManager.finalDeletePayment(wId, pId, paymentsController.lastExchangeRate); },

        // --- 4. GESTIÓN EVENTOS ---
        showNewEventModal: () => {
            if(window.ui) window.ui.modal(`<h4 class="fw-black mb-3">Nueva Actividad</h4><p class="text-muted small mb-4">Ingresa el nombre para comenzar.</p><input type="text" id="new-ev-name" class="form-control mb-4" placeholder="Ej: Caminata al Volcán"><div class="d-grid gap-2"><button onclick="paymentsApp.createNewEvent()" class="btn btn-primary py-3 rounded-pill fw-bold shadow">CREAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`);
        },
        createNewEvent: async () => {
            const name = document.getElementById('new-ev-name')?.value.trim();
            if (!name) return window.ui.toast("El nombre es obligatorio");
            const newEv = {
                id: Date.now(), name, minCap: 8, maxCap: '14', includes: [], eventType: 'Caminata Recreativa', stage: '', days: 1, dateStart: '', timeStart: '', dateEnd: '', timeEnd: '', location: 'Parque de Tres Ríos - Escuela', locationOther: '', currency: '¢', price: 0, reserve: 0,
                paymentMethods: JSON.parse(JSON.stringify(MASTER_DATA.defaultAccounts)),
                walkers: [], isConfigCollapsed: false, isWalkersCollapsed: false
            };
            await window.PaymentsStore.addEvent(newEv);
            window.ui.closeModal();
            window.ui.toast("Actividad creada");
            paymentsController.openEvent(newEv.id);
        },
        openEvent: (id) => {
            window.PaymentsStore.setCurrentEvent(id);
            const ev = window.PaymentsStore.getCurrentEvent();
            if (!ev) return;
            document.getElementById('start-view').classList.add('hidden');
            document.getElementById('event-form').classList.remove('hidden');
            paymentsController.renderConfigForm(ev);
            paymentsController.applyCollapsibleState();
            paymentsController.renderWalkers();
        },
        backToMain: () => {
            window.PaymentsStore.setCurrentEvent(null);
            document.getElementById('event-form').classList.add('hidden');
            document.getElementById('totals-area').classList.add('hidden');
            document.getElementById('walker-detail-view').classList.add('hidden');
            document.getElementById('start-view').classList.remove('hidden');
            paymentsController.renderMainList();
        },

        // --- 5. RENDER CONFIG ---
        renderConfigForm: (ev) => {
            const container = document.getElementById('config-content');
            if(!container) return;
            const isColon = ev.currency === '¢';
            
            let html = `
                <div class="row g-3 mb-3"><div class="col-12"><label class="form-label">Nombre de la Actividad</label><input type="text" class="form-control fw-bold" value="${ev.name || ''}" oninput="paymentsApp.updateConfig('name', this.value)"></div></div>
                <div class="row g-3 mb-3">
                    <div class="col-6"><label class="form-label">Cap. Mínima</label><input type="number" class="form-control" value="${ev.minCap || 8}" oninput="paymentsApp.updateConfig('minCap', this.value)"></div>
                    <div class="col-6"><label class="form-label">Cap. Máxima</label><select class="form-select" onchange="paymentsApp.updateConfig('maxCap', this.value)">${MASTER_DATA.maxCaps.map(c => `<option value="${c}" ${ev.maxCap === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                    <div class="col-12"><label class="form-label">Tipo de Evento</label><select class="form-select" onchange="paymentsApp.updateConfig('eventType', this.value)">${MASTER_DATA.eventTypes.map(t => `<option value="${t}" ${ev.eventType === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
                    ${ev.eventType === 'El Camino de Costa Rica' ? `<div class="col-12"><label class="form-label text-primary">Seleccione La Etapa</label><select class="form-select border-primary" onchange="paymentsApp.updateConfig('stage', this.value)"><option value="">-- Seleccionar --</option>${MASTER_DATA.stages.map(s => `<option value="${s}" ${ev.stage === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>` : ''}
                </div>
                <div class="row g-3 mb-3 bg-slate-50 p-3 rounded-4 border">
                    <div class="col-12"><label class="form-label">Cantidad de Días</label><select class="form-select" onchange="paymentsApp.updateConfig('days', this.value)">${Array.from({length: 15}, (_, i) => i + 1).map(d => `<option value="${d}" ${ev.days == d ? 'selected' : ''}>${d} ${d===1?'Día':'Días'}</option>`).join('')}</select></div>
                    ${ev.days == 1 ? `
                        <div class="col-6"><label class="form-label">Fecha Evento</label><input type="date" class="form-control" value="${ev.dateStart || ''}" onchange="paymentsApp.updateConfig('dateStart', this.value)"></div>
                        <div class="col-6"><label class="form-label">Hora Salida</label><input type="time" class="form-control" value="${ev.timeStart || ''}" onchange="paymentsApp.updateConfig('timeStart', this.value)"></div>
                    ` : `
                        <div class="col-6"><label class="form-label">Fecha Salida</label><input type="date" class="form-control" value="${ev.dateStart || ''}" onchange="paymentsApp.updateConfig('dateStart', this.value)"></div>
                        <div class="col-6"><label class="form-label">Hora Salida</label><input type="time" class="form-control" value="${ev.timeStart || ''}" onchange="paymentsApp.updateConfig('timeStart', this.value)"></div>
                        <div class="col-6"><label class="form-label">Fecha Regreso</label><input type="date" class="form-control" value="${ev.dateEnd || ''}" onchange="paymentsApp.updateConfig('dateEnd', this.value)"></div>
                        <div class="col-6"><label class="form-label">Hora Regreso</label><input type="time" class="form-control" value="${ev.timeEnd || ''}" onchange="paymentsApp.updateConfig('timeEnd', this.value)"></div>
                    `}
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-12"><label class="form-label">Salida de</label><select class="form-select" onchange="paymentsApp.updateConfig('location', this.value)">${MASTER_DATA.locations.map(l => `<option value="${l}" ${ev.location === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
                    ${ev.location === 'Otro' ? `<div class="col-12"><label class="form-label text-primary">Indicar Lugar</label><input type="text" class="form-control border-primary" value="${ev.locationOther || ''}" placeholder="Especifique lugar..." oninput="paymentsApp.updateConfig('locationOther', this.value)"></div>` : ''}
                </div>
                <div class="mb-3"><label class="form-label">Incluye</label><div class="d-flex flex-wrap gap-2">${MASTER_DATA.includesOptions.map(opt => { const active = (ev.includes || []).includes(opt); const cls = active ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-light'; return `<button onclick="paymentsApp.toggleInclude('${opt}')" class="btn btn-sm border rounded-pill ${cls}">${opt}</button>`; }).join('')}</div></div>
                <div class="row g-3 mb-3 bg-indigo-50 p-3 rounded-4 border border-indigo-100">
                    <div class="col-12 text-primary fw-bold small text-uppercase mb-1">Datos Financieros</div>
                    <div class="col-6"><label class="form-label">Moneda</label><select class="form-select" onchange="paymentsApp.updateConfig('currency', this.value)"><option value="¢" ${isColon ? 'selected' : ''}>Colones (¢)</option><option value="$" ${!isColon ? 'selected' : ''}>Dólares ($)</option></select></div>
                    <div class="col-6"><label class="form-label">Precio</label><input type="number" class="form-control fw-bold" placeholder="0" value="${ev.price || ''}" oninput="paymentsApp.updateConfig('price', this.value)"></div>
                    <div class="col-12"><label class="form-label">Reserva Mínima</label><input type="number" class="form-control" placeholder="0" value="${ev.reserve || ''}" oninput="paymentsApp.updateConfig('reserve', this.value)"></div>
                </div>
                <div class="mb-3"><label class="form-label d-flex justify-content-between"><span>Cuentas para Pago</span><button onclick="paymentsApp.addPaymentMethod()" class="btn btn-xs btn-outline-primary rounded-pill py-0 px-2" style="font-size:0.7rem">+ Agregar</button></label>
                    ${(ev.paymentMethods || []).map((m, i) => `<div class="d-flex gap-2 mb-2 align-items-center bg-white p-2 rounded border"><div class="flex-grow-1"><input type="text" class="form-control form-control-sm border-0 p-0 mb-1 fw-bold text-dark" value="${m.number}" placeholder="Número/Cuenta" oninput="paymentsApp.updatePaymentMethod(${i}, 'number', this.value)"><input type="text" class="form-control form-control-sm border-0 p-0 text-muted small" value="${m.name}" placeholder="Nombre Titular" oninput="paymentsApp.updatePaymentMethod(${i}, 'name', this.value)"></div><button onclick="paymentsApp.removePaymentMethod(${i})" class="btn btn-sm text-danger"><i class="ph-bold ph-trash"></i></button></div>`).join('')}
                </div>`;
            container.innerHTML = html;
        },

        updateConfig: (field, value) => {
            const updates = {};
            if (['price', 'reserve', 'minCap', 'days'].includes(field)) updates[field] = parseFloat(value) || 0;
            else updates[field] = value;
            window.PaymentsStore.updateCurrentEvent(updates);
            if (['eventType', 'days', 'location', 'currency'].includes(field)) {
                paymentsController.renderConfigForm(window.PaymentsStore.getCurrentEvent());
                if (field === 'currency' || field === 'price') paymentsController.renderTotals();
            }
        },
        toggleInclude: (item) => {
            const ev = window.PaymentsStore.getCurrentEvent();
            if (!ev) return;
            let includes = ev.includes || [];
            if (includes.includes(item)) includes = includes.filter(i => i !== item); else includes.push(item);
            window.PaymentsStore.updateCurrentEvent({ includes });
            paymentsController.renderConfigForm(window.PaymentsStore.getCurrentEvent());
        },
        addPaymentMethod: () => {
            const ev = window.PaymentsStore.getCurrentEvent();
            if (!ev) return;
            const methods = ev.paymentMethods || [];
            methods.push({ type: 'Otro', number: '', name: '' });
            window.PaymentsStore.updateCurrentEvent({ paymentMethods: methods });
            paymentsController.renderConfigForm(window.PaymentsStore.getCurrentEvent());
        },
        updatePaymentMethod: (index, field, value) => {
            const ev = window.PaymentsStore.getCurrentEvent();
            if (!ev) return;
            const methods = [...ev.paymentMethods];
            if (methods[index]) {
                methods[index][field] = value;
                clearTimeout(paymentsController.detailTimeout);
                paymentsController.detailTimeout = setTimeout(() => window.PaymentsStore.updateCurrentEvent({ paymentMethods: methods }), 500);
            }
        },
        removePaymentMethod: (index) => {
            const ev = window.PaymentsStore.getCurrentEvent();
            if (!ev) return;
            const methods = ev.paymentMethods.filter((_, i) => i !== index);
            window.PaymentsStore.updateCurrentEvent({ paymentMethods: methods });
            paymentsController.renderConfigForm(window.PaymentsStore.getCurrentEvent());
        },

        // --- 6. COLAPSABLES ---
        toggleConfig: () => {
            const ev = window.PaymentsStore.getCurrentEvent();
            if(!ev) return;
            window.PaymentsStore.updateCurrentEvent({ isConfigCollapsed: !ev.isConfigCollapsed });
            paymentsController.applyCollapsibleState();
        },
        toggleWalkers: () => {
            const ev = window.PaymentsStore.getCurrentEvent();
            if(!ev) return;
            window.PaymentsStore.updateCurrentEvent({ isWalkersCollapsed: !ev.isWalkersCollapsed });
            paymentsController.applyCollapsibleState();
        },
        applyCollapsibleState: () => {
            const ev = window.PaymentsStore.getCurrentEvent();
            if(!ev) return;
            const configContent = document.getElementById('config-content');
            const configCaret = document.getElementById('config-caret');
            if(configContent && configCaret) {
                if(ev.isConfigCollapsed) { configContent.classList.add('hidden'); configCaret.classList.replace('ph-caret-up', 'ph-caret-down'); }
                else { configContent.classList.remove('hidden'); configCaret.classList.replace('ph-caret-down', 'ph-caret-up'); }
            }
            
            const walkersContent = document.getElementById('walkers-content');
            const walkersCaret = document.getElementById('walkers-caret');
            const walkerBadge = document.getElementById('walker-count');

            if(walkersContent && walkersCaret) {
                if(ev.isWalkersCollapsed) { 
                    walkersContent.classList.add('hidden'); 
                    walkersCaret.classList.replace('ph-caret-up', 'ph-caret-down'); 
                    
                    // Actualizar Badge: Mostrar cuántos están colapsados
                    if(walkerBadge) walkerBadge.innerText = `${ev.walkers.length} Participantes`;
                }
                else { 
                    walkersContent.classList.remove('hidden'); 
                    walkersCaret.classList.replace('ph-caret-down', 'ph-caret-up');
                    
                    // Actualizar Badge: Mostrar "Personas" cuando está abierto
                    if(walkerBadge) walkerBadge.innerText = `${ev.walkers.length} Personas`;
                }
            }
        },

        // --- 7. CAMINANTES ---
        addWalker: async () => {
            await window.PaymentsStore.addWalker({ id: Date.now(), nombre: '', cedula: '', telefono: '', pagos: [], isCollapsed: false });
            window.ui.toast("Caminante agregado");
            paymentsController.renderWalkers();
        },
        updateWalkerField: (id, field, val) => {
            if (field === 'nombre') paymentsController.handleUserAutocomplete(id, val);
            clearTimeout(paymentsController.detailTimeout);
            paymentsController.detailTimeout = setTimeout(() => { window.PaymentsStore.updateWalker(id, field, val); }, 500);
        },
        
        // --- 8. AUTOCOMPLETADO Y SELECTOR (FIX: DUPLICADOS) ---
        
        // Helper Render: Centralizamos la lógica de pintar filas para usarla en filtro y carga inicial
        renderDirectoryList: (users) => {
            const ev = window.PaymentsStore.getCurrentEvent();
            const existingCedulas = new Set();
            
            // Recopilar qué usuarios ya existen en el evento actual
            if (ev && ev.walkers) {
                ev.walkers.forEach(w => {
                    if (w.cedula) existingCedulas.add(w.cedula);
                    else if(w.nombre) existingCedulas.add(w.nombre.trim()); 
                });
            }

            if (!users || users.length === 0) {
                return '<div class="p-4 text-center text-muted small">No se encontraron resultados</div>';
            }

            return users.map(u => {
                // Verificar duplicidad por Cédula o Nombre completo
                const key = u.cedula || (`${u.nombre} ${u.apellido1||''} ${u.apellido2||''}`).trim();
                const isAdded = existingCedulas.has(key);

                // Estilos Deshabilitados si ya existe
                const rowClass = isAdded 
                    ? 'bg-slate-50 opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer hover:bg-slate-50';
                
                const onClick = isAdded 
                    ? '' 
                    : `onclick="paymentsApp.selectRegisteredUser(${u.id})"`;
                
                const icon = isAdded 
                    ? '<i class="ph-bold ph-check text-success fs-5"></i>' 
                    : '<i class="ph-bold ph-plus-circle text-primary fs-5"></i>';
                
                const statusBadge = isAdded 
                    ? '<span class="badge bg-success-subtle text-success border border-success-subtle ms-2" style="font-size:0.6rem">EN LISTA</span>' 
                    : '';

                return `
                <div class="d-flex align-items-center justify-content-between p-3 border-bottom ${rowClass}" ${onClick}>
                    <div class="d-flex align-items-center gap-3">
                        <div class="rounded-circle bg-light flex-center fw-bold ${isAdded ? 'text-secondary' : 'text-primary'} border" style="width:40px; height:40px;">
                            ${u.nombre.charAt(0)}${u.apellido1 ? u.apellido1.charAt(0) : ''}
                        </div>
                        <div>
                            <div class="fw-bold ${isAdded ? 'text-muted' : 'text-dark'}">${u.nombre} ${u.apellido1 || ''}</div>
                            <div class="small text-muted">${u.cedula || 'Sin ID'} ${statusBadge}</div>
                        </div>
                    </div>
                    ${icon}
                </div>`;
            }).join('');
        },

        showRegisteredUsersModal: async () => {
            // FIX: Refrescar datos desde la DB al momento de abrir el modal
            try {
                if(typeof db !== 'undefined') {
                    const dirData = await db.find('app_users_directory');
                    if (dirData && dirData.list) {
                        paymentsController.userDirectory = dirData.list;
                    }
                }
            } catch (err) { console.warn("Error refrescando directorio", err); }

            if (!paymentsController.userDirectory || paymentsController.userDirectory.length === 0) {
                return window.ui.toast("El directorio está vacío. Agrega miembros primero.");
            }

            // Usamos el Helper
            const listHtml = paymentsController.renderDirectoryList(paymentsController.userDirectory);

            window.ui.modal(`
                <div class="text-start">
                    <h4 class="fw-black mb-3">Seleccionar Miembro</h4>
                    <div class="input-wrapper mb-3">
                        <i class="ph ph-magnifying-glass input-icon text-muted"></i>
                        <input type="text" class="form-control ps-5" placeholder="Buscar..." oninput="paymentsApp.filterUserModal(this.value)">
                    </div>
                    <div id="modal-user-list" class="overflow-auto border rounded-3" style="max-height: 350px;">
                        ${listHtml}
                    </div>
                    <div class="d-grid mt-3">
                        <button onclick="ui.closeModal()" class="btn btn-light rounded-pill">Cancelar</button>
                    </div>
                </div>
            `);
        },

        filterUserModal: (term) => {
            const container = document.getElementById('modal-user-list');
            if(!container) return;
            
            const filtered = paymentsController.userDirectory.filter(u => 
                (u.nombre || '').toLowerCase().includes(term.toLowerCase()) || 
                (u.cedula || '').includes(term) ||
                (u.apellido1 || '').toLowerCase().includes(term.toLowerCase())
            );
            
            // Usamos el Helper para mantener lógica de deshabilitados en búsqueda
            container.innerHTML = paymentsController.renderDirectoryList(filtered);
        },

        selectRegisteredUser: async (userId) => {
            const user = paymentsController.userDirectory.find(u => u.id === userId);
            if (!user) return;

            const newWalker = {
                id: Date.now(), 
                nombre: `${user.nombre} ${user.apellido1 || ''} ${user.apellido2 || ''}`.trim(), 
                cedula: user.cedula || '', 
                telefono: user.movil || user.telefono || '', 
                pagos: [],
                isCollapsed: false 
            };

            await window.PaymentsStore.addWalker(newWalker);
            window.ui.closeModal();
            window.ui.toast("Usuario agregado correctamente");
            paymentsController.renderWalkers();
        },

        handleUserAutocomplete: (walkerId, query) => {
            const existingBox = document.getElementById('autocomplete-suggestions');
            if (existingBox) existingBox.remove();
            if (!query || query.length < 2) return;
            const matches = (paymentsController.userDirectory || []).filter(u => (u.nombre || '').toLowerCase().includes(query.toLowerCase()) || (u.apellido1 || '').toLowerCase().includes(query.toLowerCase()));
            if (matches.length === 0) return;
            const activeInput = document.activeElement;
            if (!activeInput) return;
            const box = document.createElement('div');
            box.id = 'autocomplete-suggestions';
            box.className = 'autocomplete-box shadow-lg rounded-3 border bg-white overflow-hidden fade-in';
            box.style.position = 'absolute'; box.style.zIndex = '9999';
            const rect = activeInput.getBoundingClientRect();
            box.style.top = `${rect.bottom + window.scrollY + 5}px`; box.style.left = `${rect.left + window.scrollX}px`; box.style.width = `${rect.width}px`; box.style.maxHeight = '200px'; box.style.overflowY = 'auto';
            box.innerHTML = matches.map(u => `<div class="p-2 border-bottom hover:bg-slate-50 cursor-pointer d-flex justify-content-between align-items-center" onclick="paymentsApp.selectSuggestedUser(${walkerId}, ${u.id})"><div><div class="fw-bold small text-dark">${u.nombre} ${u.apellido1 || ''}</div><div class="text-muted" style="font-size:0.65rem">ID: ${u.cedula}</div></div><i class="ph-bold ph-plus-circle text-primary"></i></div>`).join('');
            document.body.appendChild(box);
            activeInput.setAttribute('data-autocomplete', 'true');
        },
        selectSuggestedUser: (walkerId, userId) => {
            const user = (paymentsController.userDirectory || []).find(u => u.id === userId);
            if (!user) return;
            window.PaymentsStore.updateWalker(walkerId, 'nombre', `${user.nombre} ${user.apellido1 || ''} ${user.apellido2 || ''}`.trim());
            window.PaymentsStore.updateWalker(walkerId, 'cedula', user.cedula || '');
            window.PaymentsStore.updateWalker(walkerId, 'telefono', user.movil || user.telefono || '');
            const box = document.getElementById('autocomplete-suggestions'); if(box) box.remove();
            paymentsController.renderWalkers(); window.ui.toast("Datos cargados");
        },

        toggleWalkerCard: (id) => { const w = window.PaymentsStore.getWalker(id); if(w) { window.PaymentsStore.updateWalker(id, 'isCollapsed', !(w.isCollapsed === true)); paymentsController.renderWalkers(); } },

        // --- 9. SEGURIDAD DE BORRADO ---
        confirmDeleteEvent: (id) => window.ui.modal(`<div class="mb-3 text-warning"><i class="ph-fill ph-warning-circle fs-1"></i></div><h4 class="fw-black">¿Borrar Actividad?</h4><div class="d-grid gap-2 mt-4"><button onclick="paymentsApp.step2DeleteEvent(${id})" class="btn btn-warning py-2 rounded-pill fw-bold text-dark">SÍ, CONTINUAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        step2DeleteEvent: (id) => window.ui.modal(`<div class="mb-3 text-danger"><i class="ph-fill ph-warning-octagon fs-1"></i></div><h4 class="fw-black text-danger">¡ADVERTENCIA!</h4><p class="text-muted small">Se perderán todos los datos.</p><div class="d-grid gap-2 mt-4"><button onclick="paymentsApp.step3DeleteEvent(${id})" class="btn btn-danger py-2 rounded-pill fw-bold">ENTIENDO</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        step3DeleteEvent: (id) => window.ui.modal(`<h4 class="fw-black">¿ESTÁ SEGURO?</h4><div class="d-grid gap-2 mt-4"><button onclick="paymentsApp.finalDeleteEvent(${id})" class="btn btn-dark py-2 rounded-pill fw-bold">SÍ, BORRAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        finalDeleteEvent: async (id) => { await window.PaymentsStore.deleteEvent(id); window.ui.closeModal(); paymentsController.renderMainList(); window.ui.toast("Eliminado"); },
        confirmDeleteWalker: (id) => window.ui.modal(`<h4 class="fw-black">¿Borrar Caminante?</h4><div class="d-grid gap-2 mt-4"><button onclick="paymentsApp.step2DeleteWalker(${id})" class="btn btn-warning py-2 rounded-pill fw-bold text-dark">SÍ, CONTINUAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        step2DeleteWalker: (id) => window.ui.modal(`<h4 class="fw-black text-danger">¡ADVERTENCIA!</h4><div class="d-grid gap-2 mt-4"><button onclick="paymentsApp.step3DeleteWalker(${id})" class="btn btn-danger py-2 rounded-pill fw-bold">ENTIENDO</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        step3DeleteWalker: (id) => window.ui.modal(`<h4 class="fw-black">¿ESTÁ SEGURO?</h4><div class="d-grid gap-2 mt-4"><button onclick="paymentsApp.finalDeleteWalker(${id})" class="btn btn-dark py-2 rounded-pill fw-bold">SÍ, BORRAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        finalDeleteWalker: async (id) => { await window.PaymentsStore.deleteWalker(id); window.ui.closeModal(); paymentsController.renderWalkers(); window.ui.toast("Eliminado"); },

        // --- 10. EXPORT ---
        exportAllToJSON: () => { if (window.PaymentsExport && window.PaymentsStore) { window.PaymentsExport.toJSON(window.PaymentsStore.getAllEvents()); if(window.ui) window.ui.toast("Respaldo descargado"); } },
        triggerImport: () => document.getElementById('import-file-input').click(),
        importFromJSON: (input) => { if (window.PaymentsExport) window.PaymentsExport.fromJSON(input, async (json) => { await window.PaymentsStore.replaceData(json); paymentsController.renderMainList(); }); },
        exportTxt: (id) => { const w = window.PaymentsStore.getWalker(id); const ev = window.PaymentsStore.getCurrentEvent(); if(w && ev) window.PaymentsExport.toTXT(w, ev, ev.price, ev.currency); },
        exportPng: () => { const id = window.PaymentsManager ? window.PaymentsManager.selectedWalkerId : paymentsController.selectedWalkerId; if(id) paymentsController.showInvoiceModal(id); },
        showInvoiceModal: (id) => { const w = window.PaymentsStore.getWalker(id); const ev = window.PaymentsStore.getCurrentEvent(); if(!w || !ev) return; const fins = window.PaymentsCalc.getWalkerFinancials(w, ev, paymentsController.lastExchangeRate); window.ui.modal(window.PaymentsExport.getInvoiceHTML(w, ev, { totalPagado: fins.totalPagado, deuda: fins.deuda })); },
        exportInvoicePng: () => { if(window.PaymentsExport) window.PaymentsExport.toPNG('invoice-capture'); },
        destroy: () => console.log("Cerrando controlador...")
    };

    window.ViewControllers = window.ViewControllers || {};
    window.ViewControllers.payments = paymentsController;
    window.paymentsApp = paymentsController;

})();