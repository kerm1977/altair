/**
 * payments_render.js
 * Encargado puramente de generar el HTML (Templates) para el módulo de pagos.
 */
(function() {
    
    const PaymentsRender = {
        
        // Renderiza la lista principal de eventos
        mainList: (events, calculateTotalFn) => {
            if (!events || events.length === 0) {
                return `
                    <div class="text-center py-5 border rounded-4 bg-white opacity-50">
                        <i class="ph ph-folder-open display-4"></i>
                        <p class="mt-2">No tienes eventos creados aún</p>
                    </div>`;
            }

            return events.map(ev => {
                const totalRecaudado = calculateTotalFn(ev);
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
                </div>`;
            }).join('');
        },

        // Renderiza la lista de caminantes (ACORDEÓN)
        walkerList: (walkers) => {
            if (!walkers || walkers.length === 0) return '<div class="text-center py-4 opacity-50 small italic">Agrega personas a tu lista</div>';

            return walkers.map((w, idx) => {
                const isCollapsed = w.isCollapsed === true; 
                
                const caretIcon = isCollapsed ? 'ph-caret-down' : 'ph-caret-up';
                const bodyClass = isCollapsed ? 'hidden' : '';
                const headerRadius = isCollapsed ? 'rounded-4' : 'rounded-top-4 border-bottom'; 
                const cardBorder = isCollapsed ? '' : 'border-primary shadow-sm';

                return `
                <div class="app-card walker-card fade-in p-0 mb-3 ${cardBorder}" style="border: 1px solid #e2e8f0;">
                    
                    <!-- HEADER (Siempre visible: Nombre + Botones) -->
                    <div class="d-flex justify-content-between align-items-center p-3 bg-white cursor-pointer ${headerRadius}" onclick="paymentsApp.toggleWalkerCard(${w.id})">
                        <div class="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
                            <div class="bg-light rounded-circle flex-center text-muted" style="width:32px; height:32px; min-width:32px;">
                                <i class="ph ${caretIcon}"></i>
                            </div>
                            <div class="d-flex flex-column text-truncate">
                                <h6 class="fw-bold mb-0 text-primary text-truncate">${w.nombre || 'Participante ' + (idx+1)}</h6>
                                ${isCollapsed ? `<small class="text-muted" style="font-size:0.75rem">ID: ${w.cedula || '---'}</small>` : ''}
                            </div>
                        </div>
                        
                        <div class="d-flex align-items-center gap-1">
                             <!-- Botón Ver Ficha -->
                             <button onclick="event.stopPropagation(); paymentsApp.viewWalkerDetail(${w.id})" class="btn btn-sm btn-light border rounded-circle flex-center" style="width:36px;height:36px" title="Ver Pagos">
                                <i class="ph-bold ph-receipt text-primary"></i>
                             </button>
                             <!-- Botón Borrar -->
                             <button onclick="event.stopPropagation(); paymentsApp.confirmDeleteWalker(${w.id})" class="btn btn-sm text-danger rounded-circle flex-center" style="width:36px;height:36px">
                                <i class="ph-fill ph-trash-simple fs-5"></i>
                             </button>
                        </div>
                    </div>

                    <!-- BODY (Inputs Editables: Colapsable) -->
                    <div class="${bodyClass} p-3 bg-slate-50 rounded-bottom-4">
                        <div class="row g-2">
                            <div class="col-12">
                                <label class="form-label small opacity-50" style="font-size:0.65rem">Nombre Completo</label>
                                <input type="text" class="form-control form-control-sm fw-bold text-dark" placeholder="Ej: Juan Pérez" value="${w.nombre || ''}" 
                                    oninput="paymentsApp.updateWalkerField(${w.id}, 'nombre', this.value)" onclick="event.stopPropagation()">
                            </div>
                            <div class="col-6">
                                <label class="form-label small opacity-50" style="font-size:0.65rem">Identificación</label>
                                <input type="number" class="form-control form-control-sm" placeholder="Cédula" value="${w.cedula || ''}" 
                                    oninput="paymentsApp.updateWalkerField(${w.id}, 'cedula', this.value)" onclick="event.stopPropagation()">
                            </div>
                            <div class="col-6">
                                <label class="form-label small opacity-50" style="font-size:0.65rem">Teléfono</label>
                                <input type="number" class="form-control form-control-sm" placeholder="Celular" value="${w.telefono || ''}" 
                                    oninput="paymentsApp.updateWalkerField(${w.id}, 'telefono', this.value)" onclick="event.stopPropagation()">
                            </div>
                        </div>
                        
                        <div class="mt-3 pt-2 border-top text-center">
                             <small class="text-primary fw-bold cursor-pointer uppercase" style="font-size:0.7rem; letter-spacing:0.5px" onclick="paymentsApp.viewWalkerDetail(${w.id})">
                                Gestionar Pagos &rarr;
                             </small>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        },

        // Renderiza las filas de pagos individuales (CON CANDADO DE SEGURIDAD)
        paymentRows: (walker) => {
            if (walker.pagos.length === 0) return `<div class="text-center py-4 text-muted small italic">No hay pagos registrados</div>`;

            return walker.pagos.map((p, idx) => {
                const monto = parseFloat(p.monto) || 0;
                const rate = parseFloat(p.exchangeRate) || 0;
                let valColones = 0, valDolares = 0;

                if (p.payCurrency === '$') {
                    valDolares = monto;
                    valColones = Math.floor(monto * rate);
                } else {
                    valColones = monto;
                    valDolares = rate > 0 ? (monto / rate) : 0;
                }

                const bodyClass = p.expanded ? '' : 'hidden';
                const iconClass = p.expanded ? 'ph-caret-up' : 'ph-caret-down';
                
                // LÓGICA DE EDICIÓN
                const isEditing = p.isEditing === true;
                const disabledAttr = isEditing ? '' : 'disabled';
                const editBtnColor = isEditing ? 'text-success bg-success-subtle' : 'text-primary hover:bg-slate-100';
                const bgClass = isEditing ? 'bg-white border-primary shadow-md' : 'bg-slate-50 border-light';

                return `
                <div class="payment-item fade-in mb-3 ${bgClass} border overflow-hidden rounded-4 transition-all">
                    
                    <!-- Cabecera -->
                    <div class="d-flex justify-content-between align-items-center p-3 cursor-pointer border-bottom" onclick="paymentsApp.togglePayment(${walker.id}, ${p.id})">
                        <div class="d-flex align-items-center gap-2">
                             <span class="badge ${isEditing ? 'bg-primary' : 'bg-dark'} rounded-pill">PAGO #${idx+1}</span>
                             <!-- BADGE INTERACTIVO DE EDICIÓN -->
                             ${isEditing ? `<span onclick="event.stopPropagation(); paymentsApp.confirmFinishEdit(${walker.id}, ${p.id})" class="badge bg-warning text-dark small animate-pulse cursor-pointer hover:scale-105" title="Toca para finalizar edición">EDITANDO <i class="ph-bold ph-check ms-1"></i></span>` : ''}
                             <i class="ph ${iconClass} text-muted"></i>
                        </div>
                        
                        <div class="d-flex gap-2">
                            <!-- BOTÓN DE EDICIÓN (Lápiz) -->
                            ${!isEditing ? `
                            <button onclick="event.stopPropagation(); paymentsApp.confirmEditPayment(${walker.id}, ${p.id})" class="btn btn-sm ${editBtnColor} border rounded-circle flex-center" style="width:32px;height:32px" title="Habilitar Edición">
                                <i class="ph-bold ph-pencil-simple"></i>
                            </button>` : ''}

                            <button onclick="event.stopPropagation(); paymentsApp.confirmDeletePayment(${walker.id}, ${p.id})" class="btn btn-sm text-danger hover:bg-red-50 border rounded-circle flex-center" style="width:32px;height:32px">
                                <i class="ph-bold ph-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Cuerpo Editable / Bloqueado -->
                    <div class="${bodyClass} p-3">
                        <div class="row g-2 mb-2">
                            <div class="col-6">
                                 <label class="form-label small mb-1 opacity-50">Moneda</label>
                                 <select ${disabledAttr} class="form-select form-select-sm fw-bold" onchange="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'payCurrency', this.value)">
                                    <option value="¢" ${p.payCurrency === '¢' ? 'selected' : ''}>¢ (Col)</option>
                                    <option value="$" ${p.payCurrency === '$' ? 'selected' : ''}>$ (Dol)</option>
                                </select>
                            </div>
                            <div class="col-6">
                                 <label class="form-label small mb-1 opacity-50">Monto</label>
                                 <input ${disabledAttr} type="number" class="form-control form-control-sm fw-bold" placeholder="0" value="${p.monto || ''}" 
                                    oninput="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'monto', this.value)">
                            </div>
                        </div>

                        <div class="row g-2 mb-2">
                            <div class="col-6">
                                <label class="form-label small mb-1 opacity-50">T. Cambio</label>
                                <input ${disabledAttr} type="number" class="form-control form-control-sm" placeholder="0" value="${p.exchangeRate || ''}" 
                                    oninput="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'exchangeRate', this.value)">
                            </div>
                             <div class="col-6">
                                <label class="form-label small mb-1 opacity-50">Fecha</label>
                                <input ${disabledAttr} type="date" class="form-control form-control-sm" value="${p.fecha || ''}" 
                                    onchange="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'fecha', this.value)">
                            </div>
                        </div>

                        <div class="mb-3">
                             <label class="form-label small mb-1 opacity-50">Concepto</label>
                             <select ${disabledAttr} class="form-select form-select-sm" onchange="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'tipo', this.value)">
                                <option value="Reserva" ${p.tipo === 'Reserva' ? 'selected' : ''}>Reserva</option>
                                <option value="Abono" ${p.tipo === 'Abono' ? 'selected' : ''}>Abono</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label small mb-1 opacity-50">Nota</label>
                            <textarea ${disabledAttr} class="form-control form-control-sm" rows="2" placeholder="Detalles adicionales..."
                                oninput="paymentsApp.updateWalkerPayment(${walker.id}, ${p.id}, 'note', this.value)">${p.note || ''}</textarea>
                        </div>

                        <hr class="opacity-10 my-3">

                        <div class="row text-center opacity-75">
                            <div class="col-6 border-end">
                                <label class="d-block small text-muted fw-bold" style="font-size:0.6rem">COLONES</label>
                                <span class="fw-bold text-dark small">¢${valColones.toLocaleString()}</span>
                            </div>
                            <div class="col-6">
                                <label class="d-block small text-muted fw-bold" style="font-size:0.6rem">DÓLARES</label>
                                <span class="fw-bold text-dark small">$${valDolares.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        },

        newEventModal: () => `
            <h4 class="fw-black mb-3">Crear Nuevo Evento</h4>
            <p class="text-muted small mb-4">Define un nombre para tu nuevo registro de pagos.</p>
            <input type="text" id="new-ev-name" class="form-control mb-4" placeholder="Ej: Tour a Tortuguero">
            <div class="d-grid gap-2">
                <button onclick="paymentsApp.createNewEvent()" class="btn btn-primary py-3 rounded-pill fw-bold shadow">CREAR AHORA</button>
                <button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button>
            </div>`
    };

    window.PaymentsRender = PaymentsRender;
})();