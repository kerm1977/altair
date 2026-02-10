/**
 * payments_mgr.js
 * Sub-Controlador para la Gestión de Pagos y Detalles de Caminantes.
 * Maneja la vista "walker-detail-view" y la interacción CRUD de pagos.
 */
(function() {

    const PaymentsManager = {
        detailTimeout: null, 
        selectedWalkerId: null,

        // --- GESTIÓN DE VISTA (DOM) ---

        viewDetail: (walkerId, lastExchangeRate) => {
            PaymentsManager.selectedWalkerId = walkerId;
            const walker = window.PaymentsStore.getWalker(walkerId);
            if (!walker) return;

            document.getElementById('event-form').classList.add('hidden');
            document.getElementById('totals-area').classList.add('hidden');
            document.getElementById('walker-detail-view').classList.remove('hidden');

            PaymentsManager.renderDetail(walker, lastExchangeRate);
        },

        closeDetail: (renderWalkersCallback) => {
            document.getElementById('walker-detail-view').classList.add('hidden');
            document.getElementById('event-form').classList.remove('hidden');
            
            if (renderWalkersCallback) renderWalkersCallback();
        },

        // --- RENDERIZADO INTERNO ---

        renderDetail: (walker, lastExchangeRate) => {
            const ev = window.PaymentsStore.getCurrentEvent();
            const box = document.getElementById('walker-detail-view');
            
            if(!box || !ev || !window.PaymentsCalc || !window.PaymentsRender) return;

            // 1. Cálculos
            const fins = window.PaymentsCalc.getWalkerFinancials(walker, ev, lastExchangeRate);
            const evtTotal = window.PaymentsCalc.getEventTotal(ev, lastExchangeRate);
            
            // 2. Datos para la vista
            const cur = ev.currency;
            const otherCur = cur === '$' ? '¢' : '$';
            
            const evtEquiv = cur === '$' ? (evtTotal * lastExchangeRate) : (evtTotal / lastExchangeRate);
            const fmtEvtTotal = evtTotal.toLocaleString();
            const fmtEvtEquiv = cur === '$' ? Math.floor(evtEquiv).toLocaleString() : evtEquiv.toFixed(1);
            
            const fmt = {
                abonado: cur === '$' ? fins.totalPagado.toFixed(1) : fins.totalPagado.toLocaleString(),
                deuda: cur === '$' ? fins.deuda.toFixed(1) : fins.deuda.toLocaleString(),
                eqAbonado: cur === '¢' ? fins.equivAbonado.toFixed(1) : Math.floor(fins.equivAbonado).toLocaleString(),
                eqDeuda: cur === '¢' ? fins.equivPendiente.toFixed(1) : Math.floor(fins.equivPendiente).toLocaleString()
            };

            // 3. Inyección HTML
            box.innerHTML = `
                <div class="app-card shadow-lg border-primary fade-in">
                     <div class="d-flex align-items-center mb-4">
                        <button onclick="paymentsApp.closeDetail()" class="btn btn-light rounded-circle me-3 flex-center" style="width:40px;height:40px"><i class="ph ph-arrow-left fs-4"></i></button>
                        <div class="flex-grow-1"><h2 class="h5 fw-black mb-0">${walker.nombre || 'Detalle'}</h2><span class="badge bg-primary-subtle text-primary border border-primary-subtle">Ficha de Cliente</span></div>
                        
                        <div class="dropdown">
                            <button class="btn btn-sm btn-dark rounded-pill px-3 dropdown-toggle" type="button" data-bs-toggle="dropdown">Exportar</button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                                <li><button class="dropdown-item py-2" onclick="paymentsApp.showInvoiceModal(${walker.id})"><i class="ph ph-receipt me-2"></i>Ver Factura</button></li>
                                <li><button class="dropdown-item py-2" onclick="paymentsApp.exportTxt(${walker.id})"><i class="ph ph-file-text me-2"></i>Reporte TXT</button></li>
                                <li><button class="dropdown-item py-2" onclick="paymentsApp.exportPng()"><i class="ph ph-image me-2"></i>Comprobante PNG</button></li>
                            </ul>
                        </div>
                    </div>

                    <!-- BARRA DE TOTALES DEL EVENTO -->
                    <div class="bg-dark text-white p-3 rounded-4 mb-4 shadow-sm">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="small opacity-75 uppercase fw-bold" style="font-size:0.65rem">Recaudado Evento (${cur})</div>
                                <div class="h3 fw-black m-0">${cur}${fmtEvtTotal}</div>
                                <div class="small text-white opacity-50 italic" style="font-size:0.7rem">≈ ${otherCur}${fmtEvtEquiv}</div>
                            </div>
                            <div class="text-end opacity-50">
                                <div class="small uppercase fw-bold" style="font-size:0.65rem">Meta Global</div>
                                <div class="fw-bold">${cur}${ev.price.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div class="row g-3 mb-4 bg-light p-3 rounded-4">
                        <div class="col-6"><div class="small text-muted">ID:</div><div class="fw-bold">${walker.cedula || ''}</div></div>
                        <div class="col-6 text-end"><div class="small text-muted">Tel:</div><div class="fw-bold">${walker.telefono || ''}</div></div>
                        <div class="col-12 border-top mt-2 pt-2">
                             <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded border">
                                <span class="small text-muted fw-bold">Precio del Paquete:</span>
                                <span class="fw-bold text-primary" style="font-size: 1.1em">${cur}${ev.price.toLocaleString()}</span>
                            </div>
                             <div class="row">
                                <div class="col-6">
                                    <div class="small text-muted uppercase fw-bold" style="font-size:0.65rem">Abonado:</div>
                                    <div class="fw-bold text-success" style="font-size:1.1em">${cur}${fmt.abonado}</div>
                                    <div class="small text-secondary fw-bold opacity-75" style="font-size:0.8em">≈ ${otherCur}${fmt.eqAbonado}</div>
                                </div>
                                <div class="col-6 text-end">
                                    <div class="small text-muted uppercase fw-bold" style="font-size:0.65rem">Falta:</div>
                                    <div class="fw-bold text-danger" style="font-size:1.1em">${cur}${fmt.deuda}</div>
                                    <div class="small text-secondary fw-bold opacity-75" style="font-size:0.8em">≈ ${otherCur}${fmt.eqDeuda}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="fw-bold text-muted small uppercase">Registro de Pagos</span>
                        <button onclick="paymentsApp.addPaymentToWalker(${walker.id})" class="btn btn-primary btn-sm rounded-pill px-3 fw-bold"><i class="ph ph-plus-circle me-1"></i>Añadir Pago</button>
                    </div>

                    <div id="payment-rows-container">
                        ${window.PaymentsRender.paymentRows(walker)}
                    </div>
                </div>`;
        },

        // --- C. ACCIONES DE PAGOS ---
        addPayment: async (walkerId, defaultRate) => {
            const ev = window.PaymentsStore.getCurrentEvent();
            const walker = window.PaymentsStore.getWalker(walkerId);
            const hasReserva = walker.pagos.some(p => p.tipo === 'Reserva');
            
            await window.PaymentsStore.addPayment(walkerId, {
                id: Date.now(),
                tipo: hasReserva ? 'Abono' : 'Reserva',
                monto: 0,
                fecha: new Date().toISOString().split('T')[0],
                payCurrency: ev.currency,
                exchangeRate: defaultRate,
                expanded: true,
                isEditing: true, // El pago nuevo nace editable
                note: ''
            });
            
            PaymentsManager.renderDetail(walker, defaultRate);
        },

        togglePayment: async (walkerId, paymentId, currentRate) => {
            await window.PaymentsStore.togglePaymentExpand(walkerId, paymentId);
            const walker = window.PaymentsStore.getWalker(walkerId);
            PaymentsManager.renderDetail(walker, currentRate);
        },

        updatePayment: (walkerId, paymentId, field, val, currentRate, rateChangeCallback) => {
            window.PaymentsStore.updatePayment(walkerId, paymentId, field, val, (p) => {
                if (field === 'exchangeRate' && p.exchangeRate > 0) {
                    if(rateChangeCallback) rateChangeCallback(p.exchangeRate);
                }
            });

            clearTimeout(PaymentsManager.detailTimeout);
            PaymentsManager.detailTimeout = setTimeout(() => {
                const w = window.PaymentsStore.getWalker(walkerId);
                const ev = window.PaymentsStore.getCurrentEvent();
                PaymentsManager.renderContent(w, ev, currentRate); // Usamos renderContent para evitar flickering
            }, 800);
        },

        // --- D. SEGURIDAD DE EDICIÓN (CANDADO) ---
        
        confirmEditPayment: (wId, pId) => {
            if(window.ui) window.ui.toast("⚠️ Advertencia de Seguridad");
            
            if(window.ui) window.ui.modal(`
                <div class="mb-3 text-warning"><i class="ph-fill ph-warning fs-1"></i></div>
                <h4 class="fw-black mb-2">¿EDITAR PAGO?</h4>
                <p class="text-muted small mb-4">
                    Modificar un pago registrado puede alterar el historial contable y generar inconsistencias. 
                    <br><br><strong>Editar es perjudicial si no estás seguro.</strong>
                </p>
                <div class="d-grid gap-2">
                    <button onclick="paymentsApp.enableEditPayment(${wId}, ${pId})" class="btn btn-warning py-2 rounded-pill fw-bold text-dark">SÍ, QUIERO EDITAR</button>
                    <button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button>
                </div>
            `);
        },

        enableEditPayment: async (wId, pId, currentRate) => {
            // Desbloquear los campos
            await window.PaymentsStore.updatePayment(wId, pId, 'isEditing', true);
            if(window.ui) window.ui.closeModal();
            
            const walker = window.PaymentsStore.getWalker(wId);
            PaymentsManager.renderDetail(walker, currentRate);
            
            if(window.ui) window.ui.toast("Campos Desbloqueados 🔓");
        },

        // --- E. FINALIZAR EDICIÓN (NUEVO) ---
        confirmFinishEdit: (wId, pId) => {
            if(window.ui) window.ui.modal(`
                <div class="mb-3 text-primary"><i class="ph-fill ph-check-circle fs-1"></i></div>
                <h4 class="fw-black mb-2">¿FINALIZAR EDICIÓN?</h4>
                <div class="d-grid gap-2 mt-4">
                    <button onclick="paymentsApp.finishEditPayment(${wId}, ${pId})" class="btn btn-primary py-2 rounded-pill fw-bold">SÍ, FINALIZAR</button>
                    <button onclick="ui.closeModal()" class="btn btn-light py-2">CANCELAR</button>
                </div>
            `);
        },

        finishEditPayment: async (wId, pId, currentRate) => {
            // Volver a bloquear campos
            await window.PaymentsStore.updatePayment(wId, pId, 'isEditing', false);
            if(window.ui) window.ui.closeModal();
            
            const walker = window.PaymentsStore.getWalker(wId);
            PaymentsManager.renderDetail(walker, currentRate);
            
            if(window.ui) window.ui.toast("Edición Finalizada 🔒");
        },

        // --- F. BORRADO ---
        confirmDeletePayment: (wId, pId) => {
            if(window.ui) window.ui.modal(`<h4>¿BORRAR PAGO?</h4><div class="d-grid gap-2 mt-3"><button onclick="paymentsApp.finalDeletePayment(${wId}, ${pId})" class="btn btn-danger py-2 rounded-pill">BORRAR</button><button onclick="ui.closeModal()" class="btn btn-light">Cancelar</button></div>`);
        },

        finalDeletePayment: async (wId, pId, lastRate) => {
            await window.PaymentsStore.deletePayment(wId, pId);
            if(window.ui) window.ui.closeModal();
            
            const walker = window.PaymentsStore.getWalker(wId);
            const ev = window.PaymentsStore.getCurrentEvent();
            PaymentsManager.renderDetail(walker, lastRate);
            
            if(window.ui) window.ui.toast("Pago eliminado");
        }
    };

    window.PaymentsManager = PaymentsManager;
})();