/**
 * TribuPlay - Motor de Pagos Móvil
 * Versión: Multievento con Persistencia en DB, Conversión Bimoneda y Exportación.
 */

// 1. GESTIÓN DE INTERFAZ (UI)
const ui = {
    // Notificaciones tipo Toast
    toast: (msg) => {
        const el = document.getElementById('toast');
        if (!el) return;
        el.innerText = msg;
        el.classList.add('opacity-100');
        el.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
            el.classList.remove('opacity-100');
            el.style.transform = 'translateX(-50%) translateY(-20px)';
        }, 3000);
    },

    // Ventanas Modales Personalizadas
    modal: (html) => {
        const content = document.getElementById('modal-content');
        const overlay = document.getElementById('modal-overlay');
        if (!content || !overlay) return;
        content.innerHTML = html;
        overlay.style.display = 'flex';
    },

    closeModal: () => {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.style.display = 'none';
    }
};

// 2. LÓGICA DE NEGOCIO Y PERSISTENCIA
const paymentsApp = {
    allEvents: [],        // Colección de todos los eventos
    currentEvent: null,   // Evento activo en edición
    selectedWalkerId: null,
    detailTimeout: null,  // Para optimización de guardado
    lastExchangeRate: 530, // Memoria del último tipo de cambio ingresado

    // --- INICIALIZACIÓN ---
    init: async () => {
        if (typeof db !== 'undefined') {
            try {
                await db.init();
                await paymentsApp.loadFromStorage();
            } catch (e) {
                console.error("Error inicializando almacenamiento:", e);
                ui.toast("Error al cargar datos guardados");
            }
        }
        paymentsApp.renderMainList();
    },

    // Cargar lista de eventos desde la base de datos
    loadFromStorage: async () => {
        try {
            const data = await db.find('app_events_store');
            if (data && data.list) {
                paymentsApp.allEvents = data.list;
            }
        } catch (e) {
            console.warn("No se encontraron eventos previos o error en consulta");
        }
    },

    // Guardar estado global en la base de datos
    saveToStorage: async () => {
        try {
            const dataToSave = { 
                email: 'app_events_store', 
                list: paymentsApp.allEvents,
                lastUpdate: Date.now() 
            };
            try {
                await db.update('app_events_store', dataToSave);
            } catch (err) {
                await db.insert(dataToSave);
            }
        } catch (e) {
            console.error("Error crítico de persistencia:", e);
        }
    },

    // --- JSON IMPORT/EXPORT ---
    exportAllToJSON: () => {
        const dataStr = JSON.stringify(paymentsApp.allEvents, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_tribuplay_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        ui.toast("Copia de seguridad descargada");
    },

    triggerImport: () => {
        document.getElementById('import-file-input').click();
    },

    importFromJSON: (input) => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (Array.isArray(json)) {
                    paymentsApp.allEvents = json;
                    await paymentsApp.saveToStorage();
                    paymentsApp.renderMainList();
                    ui.toast("Datos restaurados correctamente");
                } else {
                    ui.toast("Error: Formato de archivo inválido");
                }
            } catch (err) {
                console.error(err);
                ui.toast("Error al leer el archivo JSON");
            }
            input.value = ''; // Reset
        };
        reader.readAsText(file);
    },

    // --- GESTIÓN DE EVENTOS ---
    renderMainList: () => {
        const container = document.getElementById('saved-events-list');
        if (!container) return;

        if (paymentsApp.allEvents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 border rounded-4 bg-white opacity-50">
                    <i class="ph ph-folder-open display-4"></i>
                    <p class="mt-2">No tienes eventos creados aún</p>
                </div>
            `;
            return;
        }

        container.innerHTML = paymentsApp.allEvents.map(ev => {
            const totalRecaudado = paymentsApp.calculateEventTotal(ev);

            return `
            <div class="event-item-card fade-in mb-3">
                <div onclick="paymentsApp.openEvent(${ev.id})" class="flex-grow-1 cursor-pointer">
                    <h6 class="fw-bold mb-1 text-primary">${ev.name || ''}</h6>
                    <div class="small text-muted d-flex gap-3">
                        <span><i class="ph ph-users me-1"></i>${ev.walkers.length} Personas</span>
                        <span><i class="ph ph-wallet me-1"></i>${ev.currency}${totalRecaudado.toLocaleString()}</span>
                    </div>
                </div>
                <button onclick="paymentsApp.confirmDeleteEvent(${ev.id})" class="btn btn-sm text-danger border-0">
                    <i class="ph ph-trash fs-5"></i>
                </button>
            </div>
            `;
        }).join('');
    },

    showNewEventModal: () => {
        ui.modal(`
            <h4 class="fw-black mb-3">Crear Nuevo Evento</h4>
            <p class="text-muted small mb-4">Define un nombre para tu nuevo registro de pagos.</p>
            <input type="text" id="new-ev-name" class="form-control mb-4" placeholder="Ej: Tour a Tortuguero">
            <div class="d-grid gap-2">
                <button onclick="paymentsApp.createNewEvent()" class="btn btn-primary py-3 rounded-pill fw-bold shadow">CREAR AHORA</button>
                <button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button>
            </div>
        `);
    },

    createNewEvent: async () => {
        const nameInput = document.getElementById('new-ev-name');
        const name = nameInput.value.trim();
        if (!name) return ui.toast("Ingresa un nombre para el evento");

        const newEv = {
            id: Date.now(),
            name: name,
            days: 1,
            currency: '¢',
            price: 0,
            reserve: 0,
            walkers: []
        };

        paymentsApp.allEvents.unshift(newEv);
        await paymentsApp.saveToStorage();
        ui.closeModal();
        paymentsApp.openEvent(newEv.id);
        ui.toast("Evento creado con éxito");
    },

    openEvent: (id) => {
        const ev = paymentsApp.allEvents.find(e => e.id === id);
        if (!ev) return;

        paymentsApp.currentEvent = ev;
        
        document.getElementById('start-view').classList.add('hidden');
        document.getElementById('event-form').classList.remove('hidden');
        document.getElementById('totals-area').classList.remove('hidden');

        const nameInput = document.getElementById('ev-name');
        if(nameInput) nameInput.value = ev.name || '';
        
        const daySelect = document.getElementById('ev-days');
        daySelect.innerHTML = '';
        for(let i=1; i<=15; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.selected = (ev.days === i);
            opt.innerText = i + (i === 1 ? ' Día' : ' Días');
            daySelect.appendChild(opt);
        }

        paymentsApp.toggleDaysLogic(true);
        paymentsApp.renderWalkers();
    },

    backToMain: () => {
        paymentsApp.currentEvent = null;
        document.getElementById('event-form').classList.add('hidden');
        document.getElementById('totals-area').classList.add('hidden');
        document.getElementById('start-view').classList.remove('hidden');
        paymentsApp.renderMainList();
    },

    updateEventName: (val) => {
        if (!paymentsApp.currentEvent) return;
        paymentsApp.currentEvent.name = val;
        paymentsApp.saveToStorage();
    },

    // --- EDICIÓN DINÁMICA ---
    toggleDaysLogic: (isInitialLoad = false) => {
        if (!paymentsApp.currentEvent) return;
        
        const days = parseInt(document.getElementById('ev-days').value);
        const container = document.getElementById('dynamic-fields');
        
        if (!isInitialLoad) {
            paymentsApp.currentEvent.days = days;
            paymentsApp.saveToStorage();
        }
        
        let html = '';
        if (days === 1) {
            html = `
                <div class="col-12 col-md-6">
                    <label class="form-label">Precio del Evento (${paymentsApp.currentEvent.currency})</label>
                    <input type="number" id="ev-price" class="form-control" placeholder="0" value="${paymentsApp.currentEvent.price || ''}" oninput="paymentsApp.updateBaseData()">
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label">Reserva con ${paymentsApp.currentEvent.currency}:</label>
                    <input type="number" id="ev-reserve" class="form-control" placeholder="0" value="${paymentsApp.currentEvent.reserve || ''}" oninput="paymentsApp.updateBaseData()">
                </div>
            `;
        } else {
            html = `
                <div class="col-6">
                    <label class="form-label">Moneda Meta</label>
                    <select id="ev-currency" class="form-select" onchange="paymentsApp.updateBaseData()">
                        <option value="¢" ${paymentsApp.currentEvent.currency === '¢' ? 'selected' : ''}>Colones (¢)</option>
                        <option value="$" ${paymentsApp.currentEvent.currency === '$' ? 'selected' : ''}>Dólares ($)</option>
                    </select>
                </div>
                <div class="col-6">
                    <label class="form-label">Precio</label>
                    <input type="number" id="ev-price" class="form-control" placeholder="0" value="${paymentsApp.currentEvent.price || ''}" oninput="paymentsApp.updateBaseData()">
                </div>
                <div class="col-12">
                    <label class="form-label">Reserva Mínima</label>
                    <input type="number" id="ev-reserve" class="form-control" placeholder="0" value="${paymentsApp.currentEvent.reserve || ''}" oninput="paymentsApp.updateBaseData()">
                </div>
            `;
        }
        container.innerHTML = html;
        paymentsApp.renderTotals();
    },

    updateBaseData: () => {
        if (!paymentsApp.currentEvent) return;
        
        const price = document.getElementById('ev-price')?.value;
        const reserve = document.getElementById('ev-reserve')?.value;
        const currency = document.getElementById('ev-currency')?.value;

        paymentsApp.currentEvent.price = Math.floor(price || 0);
        paymentsApp.currentEvent.reserve = Math.floor(reserve || 0);
        if (currency) paymentsApp.currentEvent.currency = currency;
        
        paymentsApp.renderTotals();
        paymentsApp.saveToStorage();
    },

    // --- GESTIÓN DE PERSONAS (WALKERS) ---
    addWalker: () => {
        if (!paymentsApp.currentEvent) return;
        
        const walker = {
            id: Date.now(),
            nombre: '',
            cedula: '',
            telefono: '',
            pagos: []
        };
        
        paymentsApp.currentEvent.walkers.push(walker);
        paymentsApp.renderWalkers();
        paymentsApp.saveToStorage();
        ui.toast("Nuevo caminante en lista");
    },

    renderWalkers: () => {
        const container = document.getElementById('walkers-container');
        const countBadge = document.getElementById('walker-count');
        if (!container || !paymentsApp.currentEvent) return;
        
        const walkers = paymentsApp.currentEvent.walkers;
        countBadge.innerText = `${walkers.length} Personas`;
        container.innerHTML = '';

        walkers.forEach((w, idx) => {
            const card = document.createElement('div');
            card.className = 'app-card walker-card fade-in';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div onclick="paymentsApp.viewWalkerDetail(${w.id})" class="walker-link cursor-pointer flex-grow-1">
                        <h5 class="fw-bold mb-0 text-primary"><i class="ph ph-user-circle me-2"></i>${w.nombre || 'Persona ' + (idx+1)}</h5>
                        <small class="text-muted">ID: ${w.cedula || ''} | Ver Ficha</small>
                    </div>
                    <button onclick="paymentsApp.confirmDeleteWalker(${w.id})" class="btn btn-sm text-danger border-0">
                        <i class="ph ph-trash-simple fs-4"></i>
                    </button>
                </div>
                <div class="row g-2">
                    <div class="col-12"><input type="text" class="form-control form-control-sm" placeholder="Nombre completo" value="${w.nombre || ''}" oninput="paymentsApp.updateWalkerField(${w.id}, 'nombre', this.value)"></div>
                    <div class="col-6"><input type="number" class="form-control form-control-sm" placeholder="ID" value="${w.cedula || ''}" oninput="paymentsApp.updateWalkerField(${w.id}, 'cedula', this.value)"></div>
                    <div class="col-6"><input type="number" class="form-control form-control-sm" placeholder="Cel" value="${w.telefono || ''}" oninput="paymentsApp.updateWalkerField(${w.id}, 'telefono', this.value)"></div>
                </div>
            `;
            container.appendChild(card);
        });
        paymentsApp.renderTotals();
    },

    updateWalkerField: (id, field, val) => {
        const w = paymentsApp.currentEvent.walkers.find(x => x.id === id);
        if (w) {
            if (field === 'nombre') {
                w.nombre = val.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
            } else {
                w[field] = val;
            }
            clearTimeout(paymentsApp.detailTimeout);
            paymentsApp.detailTimeout = setTimeout(() => paymentsApp.saveToStorage(), 500);
        }
    },

    // --- VISTA DETALLADA DE CLIENTE ---
    viewWalkerDetail: (id) => {
        paymentsApp.selectedWalkerId = id;
        const walker = paymentsApp.currentEvent.walkers.find(x => x.id === id);
        if (!walker) return;

        document.getElementById('event-form').classList.add('hidden');
        document.getElementById('totals-area').classList.add('hidden');
        
        const detailBox = document.getElementById('walker-detail-view');
        detailBox.classList.remove('hidden');
        
        paymentsApp.renderDetailContent(walker);
    },

    renderDetailContent: (walker) => {
        const detailBox = document.getElementById('walker-detail-view');
        const cur = paymentsApp.currentEvent.currency;
        const otherCur = cur === '$' ? '¢' : '$';
        
        // Calcular total recaudado
        const totalPagadoBase = walker.pagos.reduce((s, p) => {
            const m = parseFloat(p.monto) || 0;
            const r = parseFloat(p.exchangeRate) || paymentsApp.lastExchangeRate;
            if (p.payCurrency === cur) return s + m;
            return s + (cur === '¢' ? (m * r) : (m / r));
        }, 0);

        const pendiente = Math.max(0, paymentsApp.currentEvent.price - totalPagadoBase);
        
        // Conversiones duales
        const equivAbonado = cur === '$' 
            ? (totalPagadoBase * paymentsApp.lastExchangeRate) 
            : (totalPagadoBase / paymentsApp.lastExchangeRate);

        const equivPendiente = cur === '$'
            ? (pendiente * paymentsApp.lastExchangeRate)
            : (pendiente / paymentsApp.lastExchangeRate);

        const fmtAbonado = cur === '$' ? totalPagadoBase.toFixed(1) : totalPagadoBase.toLocaleString();
        const fmtEquivAbonado = cur === '¢' ? equivAbonado.toFixed(1) : Math.floor(equivAbonado).toLocaleString();
        
        const fmtPendiente = cur === '$' ? pendiente.toFixed(1) : pendiente.toLocaleString();
        const fmtEquivPendiente = cur === '¢' ? equivPendiente.toFixed(1) : Math.floor(equivPendiente).toLocaleString();

        detailBox.innerHTML = `
            <div id="export-area" class="app-card shadow-lg border-primary fade-in">
                <div class="d-flex align-items-center mb-4">
                    <button onclick="paymentsApp.closeDetail()" class="btn btn-light rounded-circle me-3 flex-center" style="width:40px;height:40px">
                        <i class="ph ph-arrow-left fs-4"></i>
                    </button>
                    <div class="flex-grow-1">
                        <h2 class="h5 fw-black mb-0">${walker.nombre || 'Detalle'}</h2>
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle">Ficha de Cliente</span>
                    </div>
                    
                    <!-- BOTÓN EXPORTAR -->
                    <div class="dropdown">
                        <button class="btn btn-sm btn-dark rounded-pill px-3 dropdown-toggle" type="button" data-bs-toggle="dropdown">Exportar</button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                            <li><button class="dropdown-item py-2" onclick="paymentsApp.showInvoiceModal(${walker.id})"><i class="ph ph-receipt me-2"></i>Ver Factura</button></li>
                            <li><button class="dropdown-item py-2" onclick="paymentsApp.exportTxt(${walker.id})"><i class="ph ph-file-text me-2"></i>Reporte TXT</button></li>
                            <li><button class="dropdown-item py-2" onclick="paymentsApp.exportPng()"><i class="ph ph-image me-2"></i>Comprobante PNG</button></li>
                        </ul>
                    </div>
                </div>

                <div class="row g-3 mb-4 bg-light p-3 rounded-4">
                    <div class="col-6"><div class="small text-muted">ID:</div><div class="fw-bold">${walker.cedula || ''}</div></div>
                    <div class="col-6 text-end"><div class="small text-muted">Tel:</div><div class="fw-bold">${walker.telefono || ''}</div></div>
                    
                    <div class="col-12 border-top mt-2 pt-2">
                        <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded border">
                            <span class="small text-muted fw-bold">Precio del Paquete:</span>
                            <span class="fw-bold text-primary" style="font-size: 1.1em">${cur}${paymentsApp.currentEvent.price.toLocaleString()}</span>
                        </div>

                        <div class="row">
                            <div class="col-6">
                                <div class="small text-muted uppercase fw-bold" style="font-size:0.65rem">Abonado:</div>
                                <div class="fw-bold text-success" style="font-size:1.1em">${cur}${fmtAbonado}</div>
                                <div class="small text-secondary fw-bold opacity-75" style="font-size:0.8em">≈ ${otherCur}${fmtEquivAbonado}</div>
                            </div>
                            <div class="col-6 text-end">
                                <div class="small text-muted uppercase fw-bold" style="font-size:0.65rem">Falta:</div>
                                <div class="fw-bold text-danger" style="font-size:1.1em">${cur}${fmtPendiente}</div>
                                <div class="small text-secondary fw-bold opacity-75" style="font-size:0.8em">≈ ${otherCur}${fmtEquivPendiente}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="fw-bold text-muted small uppercase">Registro de Pagos</span>
                    <button onclick="paymentsApp.addPaymentToWalker(${walker.id})" class="btn btn-primary btn-sm rounded-pill px-3 fw-bold">
                        <i class="ph ph-plus-circle me-1"></i>Añadir Pago
                    </button>
                </div>

                <div id="payment-rows-container">
                    ${paymentsApp.renderPaymentRows(walker)}
                </div>
            </div>
        `;
    },

    // --- NUEVO: FUNCIÓN PARA COLAPSAR PAGO ---
    togglePayment: (wId, pId) => {
        const walker = paymentsApp.currentEvent.walkers.find(x => x.id === wId);
        const p = walker.pagos.find(x => x.id === pId);
        if(p) {
            p.expanded = !p.expanded;
            paymentsApp.renderDetailContent(walker); // Refresca para mostrar cambios
            paymentsApp.saveToStorage();
        }
    },

    renderPaymentRows: (walker) => {
        if (walker.pagos.length === 0) return `<div class="text-center py-4 text-muted small italic">No hay pagos registrados</div>`;
        
        return walker.pagos.map((p, idx) => {
            const monto = parseFloat(p.monto) || 0;
            const rate = parseFloat(p.exchangeRate) || 0;
            
            // Cálculos Individuales por pago
            let valColones = 0;
            let valDolares = 0;
            
            if (p.payCurrency === '$') {
                // Si pago es en Dólares:
                valDolares = monto;
                valColones = Math.floor(monto * rate);
            } else {
                // Si pago es en Colones:
                valColones = monto;
                valDolares = rate > 0 ? (monto / rate) : 0;
            }

            const strColones = valColones.toLocaleString();
            const strDolares = valDolares.toFixed(1);

            // Clase para ocultar/mostrar
            const bodyClass = p.expanded ? '' : 'hidden';
            const iconClass = p.expanded ? 'ph-caret-up' : 'ph-caret-down';

            // Usamos || '' para eliminar ceros visuales en inputs
            return `
            <div class="payment-item fade-in mb-3 shadow-sm bg-white border border-light overflow-hidden rounded-4">
                
                <!-- CABECERA (SIEMPRE VISIBLE) -->
                <div class="d-flex justify-content-between align-items-center p-3 bg-light cursor-pointer" onclick="paymentsApp.togglePayment(${walker.id}, ${p.id})">
                    <div class="d-flex align-items-center gap-2">
                         <span class="badge bg-dark rounded-pill">PAGO #${idx+1}</span>
                         <i class="ph ${iconClass} text-muted"></i>
                    </div>
                    <!-- DELETE BUTTON CON SEGURIDAD -->
                    <button onclick="event.stopPropagation(); paymentsApp.confirmDeletePayment(${walker.id}, ${p.id})" class="btn btn-sm text-danger p-0 border-0">
                        <i class="ph ph-trash fs-4"></i>
                    </button>
                </div>
                
                <!-- CUERPO COLAPSABLE -->
                <div class="${bodyClass} p-3 border-top">
                    <!-- BLOQUE 1: MONEDA / MONTO -->
                    <div class="row g-2 mb-2">
                        <div class="col-6">
                             <label class="form-label small mb-1 opacity-50">Moneda</label>
                             <select class="form-select form-select-sm fw-bold" onchange="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'payCurrency', this.value)">
                                <option value="¢" ${p.payCurrency === '¢' ? 'selected' : ''}>¢ (Col)</option>
                                <option value="$" ${p.payCurrency === '$' ? 'selected' : ''}>$ (Dol)</option>
                            </select>
                        </div>
                        <div class="col-6">
                             <label class="form-label small mb-1 opacity-50">Monto</label>
                             <input type="number" class="form-control form-control-sm fw-bold" placeholder="0" value="${p.monto || ''}" 
                                oninput="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'monto', this.value)">
                        </div>
                    </div>

                    <!-- BLOQUE 2: TIPO CAMBIO / FECHA -->
                    <div class="row g-2 mb-2">
                        <div class="col-6">
                            <label class="form-label small mb-1 opacity-50">T. Cambio</label>
                            <input type="number" class="form-control form-control-sm" placeholder="0" value="${p.exchangeRate || ''}" 
                                oninput="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'exchangeRate', this.value)">
                        </div>
                         <div class="col-6">
                            <label class="form-label small mb-1 opacity-50">Fecha</label>
                            <input type="date" class="form-control form-control-sm" value="${p.fecha || ''}" 
                                onchange="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'fecha', this.value)">
                        </div>
                    </div>

                    <!-- BLOQUE 3: CONCEPTO -->
                    <div class="mb-3">
                         <label class="form-label small mb-1 opacity-50">Concepto</label>
                         <select class="form-select form-select-sm" onchange="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'tipo', this.value)">
                            <option value="Reserva" ${p.tipo === 'Reserva' ? 'selected' : ''}>Reserva</option>
                            <option value="Abono" ${p.tipo === 'Abono' ? 'selected' : ''}>Abono</option>
                        </select>
                    </div>

                    <!-- BLOQUE 4: NOTA -->
                    <div class="mb-3">
                        <label class="form-label small mb-1 opacity-50">Nota</label>
                        <textarea class="form-control form-control-sm" rows="2" placeholder="Detalles adicionales..."
                            oninput="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'note', this.value)">${p.note || ''}</textarea>
                    </div>

                    <hr class="opacity-10 my-3">

                    <!-- BLOQUE 5: TOTALES DEL PAGO -->
                    <div class="row text-center">
                        <div class="col-6 border-end">
                            <label class="d-block small text-muted fw-bold" style="font-size:0.6rem">TOTAL EN COLONES</label>
                            <span class="fw-bold text-dark small">¢${strColones}</span>
                        </div>
                        <div class="col-6">
                            <label class="d-block small text-muted fw-bold" style="font-size:0.6rem">TOTAL EN DÓLARES</label>
                            <span class="fw-bold text-dark small">$${strDolares}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    addPaymentToWalker: (wId) => {
        const w = paymentsApp.currentEvent.walkers.find(x => x.id === wId);
        if (!w) return;
        const hasReserva = w.pagos.some(p => p.tipo === 'Reserva');
        w.pagos.push({ 
            id: Date.now(), 
            tipo: hasReserva ? 'Abono' : 'Reserva', 
            monto: 0,
            fecha: new Date().toISOString().split('T')[0],
            payCurrency: paymentsApp.currentEvent.currency,
            exchangeRate: paymentsApp.lastExchangeRate,
            expanded: true, // Nace abierto
            note: ''
        });
        paymentsApp.renderDetailContent(w);
        paymentsApp.saveToStorage();
    },

    updateWalkerPayment: (wId, pId, field, val) => {
        const w = paymentsApp.currentEvent.walkers.find(x => x.id === wId);
        const p = w.pagos.find(x => x.id === pId);
        if (p) {
            if (field === 'monto' || field === 'exchangeRate') {
                p[field] = parseFloat(val) || 0;
                if (field === 'exchangeRate' && p[field] > 0) paymentsApp.lastExchangeRate = p[field];
            } else {
                p[field] = val;
            }
            
            paymentsApp.saveToStorage();
            paymentsApp.renderTotals();

            // Usamos debounce para no cerrar el teclado ni perder foco al escribir
            clearTimeout(paymentsApp.detailTimeout);
            paymentsApp.detailTimeout = setTimeout(() => {
                paymentsApp.renderDetailContent(w);
            }, 1000); // 1 segundo de espera antes de redibujar para actualizar cálculos
        }
    },

    // --- NUEVO SISTEMA DE BORRADO DE PAGOS (3 PASOS) ---
    confirmDeletePayment: (wId, pId) => {
        ui.toast("Paso 1: Solicitud de borrado");
        ui.modal(`
            <div class="mb-3 text-danger"><i class="ph-fill ph-warning-octagon fs-1"></i></div>
            <h4 class="fw-black">¿BORRAR PAGO?</h4>
            <p class="text-muted small">Paso 2 de 3: ¿Seguro que deseas eliminar este registro de pago?</p>
            <div class="d-grid gap-2 mt-4">
                <button onclick="paymentsApp.finalDeletePayment(${wId}, ${pId})" class="btn btn-danger py-3 fw-bold rounded-pill">SÍ, ELIMINAR</button>
                <button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button>
            </div>
        `);
    },

    finalDeletePayment: (wId, pId) => {
        const w = paymentsApp.currentEvent.walkers.find(x => x.id === wId);
        if (w) {
            w.pagos = w.pagos.filter(x => x.id !== pId);
            paymentsApp.renderDetailContent(w);
            paymentsApp.saveToStorage();
            paymentsApp.renderTotals();
            ui.closeModal();
            ui.toast("Pago eliminado (Paso 3)");
        }
    },

    closeDetail: () => {
        document.getElementById('walker-detail-view').classList.add('hidden');
        document.getElementById('event-form').classList.remove('hidden');
        document.getElementById('totals-area').classList.remove('hidden');
        paymentsApp.renderWalkers();
    },

    // --- CÁLCULOS GLOBALES ---
    calculateEventTotal: (ev) => {
        return ev.walkers.reduce((sum, w) => {
            return sum + w.pagos.reduce((pSum, p) => {
                const m = parseFloat(p.monto) || 0;
                const r = parseFloat(p.exchangeRate) || paymentsApp.lastExchangeRate;
                if (p.payCurrency === ev.currency) return pSum + m;
                // Conversión inversa para el total general
                return pSum + (ev.currency === '¢' ? (m * r) : (m / r));
            }, 0);
        }, 0);
    },

    renderTotals: () => {
        const area = document.getElementById('totals-area');
        if (!area || !paymentsApp.currentEvent) return;

        const cur = paymentsApp.currentEvent.currency;
        const otherCur = cur === '$' ? '¢' : '$';
        const meta = paymentsApp.currentEvent.price;
        
        const recaudadoBase = paymentsApp.calculateEventTotal(paymentsApp.currentEvent);
        // Faltante se oculta aquí, solo se muestra en ficha.
        
        // Equivalente total recaudado
        const equivRecaudado = cur === '$' 
            ? (recaudadoBase * paymentsApp.lastExchangeRate) 
            : (recaudadoBase / paymentsApp.lastExchangeRate);
            
        // Formato para el equivalente global
        const fmtEquiv = cur === '$' 
            ? Math.floor(equivRecaudado).toLocaleString() // Si es $, equiv es ¢ (sin decimal)
            : equivRecaudado.toFixed(1); // Si es ¢, equiv es $ (1 decimal)

        area.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="small opacity-75 uppercase fw-bold" style="font-size:0.65rem">Recaudado (${cur})</div>
                    <div class="h3 fw-black m-0">${cur}${recaudadoBase.toLocaleString()}</div>
                    <div class="small text-white opacity-50 italic" style="font-size:0.7rem">≈ ${otherCur}${fmtEquiv}</div>
                </div>
                <div class="text-end opacity-50">
                    <div class="small uppercase fw-bold" style="font-size:0.65rem">Meta Global</div>
                    <div class="fw-bold">${cur}${meta.toLocaleString()}</div>
                </div>
            </div>`;
    },

    // --- SEGURIDAD Y BORRADO (3 PASOS) ---
    confirmDeleteEvent: (id) => {
        ui.toast("Paso 1: Solicitud borrado");
        ui.modal(`
            <div class="mb-3 text-danger"><i class="ph-fill ph-warning-octagon fs-1"></i></div>
            <h4 class="fw-black">¿BORRAR EVENTO?</h4>
            <p class="text-muted small">Paso 2 de 3: Eliminarás datos permanentes.</p>
            <div class="d-grid gap-2 mt-4"><button onclick="paymentsApp.finalDeleteEvent(${id})" class="btn btn-danger py-3 fw-bold rounded-pill">SÍ, ELIMINAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`);
    },

    finalDeleteEvent: async (id) => {
        paymentsApp.allEvents = paymentsApp.allEvents.filter(e => e.id !== id);
        await paymentsApp.saveToStorage();
        ui.closeModal();
        paymentsApp.renderMainList();
        ui.toast("Evento eliminado");
    },

    confirmDeleteWalker: (id) => {
        ui.toast("Paso 1: Borrar persona");
        ui.modal(`
            <h4 class="fw-bold">ELIMINAR CAMINANTE</h4>
            <p class="text-muted small">Paso 2 de 3: Se borrarán sus pagos.</p>
            <div class="d-grid gap-2">
                <button onclick="paymentsApp.finalDeleteWalker(${id})" class="btn btn-danger py-3 fw-bold rounded-pill">BORRAR DEFINITIVAMENTE</button>
                <button onclick="ui.closeModal()" class="btn btn-light">Cancelar</button>
            </div>`);
    },

    finalDeleteWalker: async (id) => {
        paymentsApp.currentEvent.walkers = paymentsApp.currentEvent.walkers.filter(w => w.id !== id);
        await paymentsApp.saveToStorage();
        ui.closeModal();
        paymentsApp.renderWalkers();
        ui.toast("Persona eliminada");
    },

    // --- FACTURA Y EXPORTACIÓN ---
    showInvoiceModal: (id) => {
        const walker = paymentsApp.currentEvent.walkers.find(x => x.id === id);
        if (!walker) return;
        const cur = paymentsApp.currentEvent.currency;
        const total = walker.pagos.reduce((s, p) => {
            const m = parseFloat(p.monto) || 0;
            const r = parseFloat(p.exchangeRate) || paymentsApp.lastExchangeRate;
            if (p.payCurrency === cur) return s + m;
            return s + (cur === '¢' ? (m * r) : (m / r));
        }, 0);
        
        const deuda = Math.max(0, paymentsApp.currentEvent.price - total);
        const dateNow = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

        const html = `
            <div id="invoice-capture" class="bg-white p-4 rounded-4 text-start relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10"><i class="ph-fill ph-ticket display-1 text-primary"></i></div>
                <h5 class="fw-black text-primary mb-1">COMPROBANTE DE PAGO</h5>
                <p class="text-muted small mb-4">${paymentsApp.currentEvent.name}</p>
                
                <div class="border-bottom pb-3 mb-3">
                    <div class="fw-bold fs-5">${walker.nombre}</div>
                    <div class="small text-muted">ID: ${walker.cedula || 'N/A'}</div>
                </div>

                <div class="mb-4">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="small text-muted">Total Abonado</span>
                        <span class="fw-bold text-success">${cur}${total.toLocaleString()}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                        <span class="small text-muted">Saldo Pendiente</span>
                        <span class="fw-bold text-danger">${cur}${Math.max(0, deuda).toLocaleString()}</span>
                    </div>
                     <div class="d-flex justify-content-between border-top pt-2 mt-2">
                        <span class="small fw-bold">Precio Paquete</span>
                        <span class="fw-bold">${cur}${paymentsApp.currentEvent.price.toLocaleString()}</span>
                    </div>
                </div>

                <div class="bg-light p-3 rounded-3 mb-4">
                    <h6 class="small fw-bold text-muted mb-2 uppercase">Historial Reciente</h6>
                    ${walker.pagos.map(p => `
                        <div class="d-flex justify-content-between small mb-1">
                            <span>${p.fecha || 'N/A'} (${p.tipo})</span>
                            <span class="fw-bold">${p.payCurrency}${p.monto}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="text-center small text-muted italic">Emitido: ${dateNow}</div>
            </div>
            
            <div class="d-grid gap-2 mt-3">
                <button onclick="paymentsApp.exportInvoicePng()" class="btn btn-primary rounded-pill py-2 shadow-sm">
                    <i class="ph-bold ph-download-simple me-2"></i>Descargar Imagen
                </button>
                <button onclick="ui.closeModal()" class="btn btn-light rounded-pill py-2">Cerrar</button>
            </div>
        `;
        ui.modal(html);
    },

    exportInvoicePng: () => {
        const element = document.getElementById('invoice-capture');
        if(!element) return;
        ui.toast("Generando imagen...");
        html2canvas(element, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Factura_TribuPlay_${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            ui.toast("Imagen guardada");
        });
    },

    exportTxt: (id) => {
        const walker = paymentsApp.currentEvent.walkers.find(x => x.id === id);
        if (!walker) return;
        const cur = paymentsApp.currentEvent.currency;
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        let content = `TRIBUPLAY - REPORTE DE PAGOS\n============================\n`;
        content += `Evento: ${paymentsApp.currentEvent.name || ''}\n`;
        content += `Caminante: ${walker.nombre || ''}\n`;
        content += `Cédula: ${walker.cedula || ''}\n`;
        content += `Precio del Paquete: ${cur}${paymentsApp.currentEvent.price || 0}\n`;
        content += `----------------------------\nDETALLE DE ABONOS:\n`;
        
        walker.pagos.forEach((p, i) => {
            let dateStr = "";
            if (p.fecha) {
                const parts = p.fecha.split('-');
                if (parts.length === 3) {
                    const monthIdx = parseInt(parts[1], 10) - 1;
                    const monthName = months[monthIdx] || parts[1];
                    dateStr = `[${parts[2]}/${monthName}/${parts[0]}]`;
                } else { dateStr = `[${p.fecha}]`; }
            }
            const rate = p.exchangeRate || 0;
            const paySymbol = p.payCurrency || cur;
            content += `${i+1}.${p.tipo}: ${paySymbol}${p.monto} (TC: ${rate})  ${dateStr}\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pago_${(walker.nombre || 'cliente').replace(/\s+/g, '_')}.txt`;
        link.click();
        ui.toast("Reporte TXT descargado.");
    },

    exportPng: () => {
        // Redirige al nuevo modal de factura
        paymentsApp.showInvoiceModal(paymentsApp.selectedWalkerId);
    }
};

window.onload = () => { paymentsApp.init(); };