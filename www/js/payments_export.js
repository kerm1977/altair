/**
 * payments_export.js
 * Maneja la lógica de Exportación (JSON, TXT, PNG) y generación de Facturas.
 */
(function() {

    const PaymentsExport = {
        
        // --- JSON BACKUP ---
        toJSON: (data) => {
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_tribuplay_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        fromJSON: (fileInput, callback) => {
            const file = fileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    if (Array.isArray(json)) callback(json);
                    else throw new Error("Formato inválido");
                } catch (err) {
                    console.error(err);
                    if(window.ui) window.ui.toast("Error al leer JSON");
                }
                fileInput.value = '';
            };
            reader.readAsText(file);
        },

        // --- TXT REPORT ---
        toTXT: (walker, eventOrName, eventPrice, eventCurrency) => {
            let event = {};
            if (typeof eventOrName === 'object') {
                event = eventOrName;
            } else {
                event = { name: eventOrName, price: eventPrice, currency: eventCurrency };
            }
            
            const cur = event.currency || '¢';
            
            let content = `TRIBUPLAY - REPORTE DE PAGOS\n============================\n`;
            content += `Actividad: ${event.name || ''}\n`;
            if (event.eventType) content += `Tipo: ${event.eventType} ${event.stage ? '- ' + event.stage : ''}\n`;
            
            // Lógica de fechas para TXT
            if (event.days) {
                content += `Duración: ${event.days} día(s)\n`;
                if (event.days == 1) {
                    content += `Fecha: ${event.dateStart || ''} ${event.timeStart ? '@ ' + event.timeStart : ''}\n`;
                } else {
                    content += `Salida: ${event.dateStart || ''} ${event.timeStart || ''}\n`;
                    content += `Regreso: ${event.dateEnd || ''} ${event.timeEnd || ''}\n`;
                }
            }
            
            const loc = event.location === 'Otro' ? event.locationOther : event.location;
            if (loc) content += `Lugar: ${loc}\n`;

            content += `\nDATOS DEL CLIENTE\n`;
            content += `Nombre: ${walker.nombre || ''}\n`;
            content += `Cédula: ${walker.cedula || ''}\n`;
            content += `Teléfono: ${walker.telefono || ''}\n`;
            content += `Precio Paquete: ${cur}${event.price || 0}\n`;
            content += `----------------------------\nDETALLE DE ABONOS:\n`;
            
            walker.pagos.forEach((p, i) => {
                let dateStr = p.fecha || 'N/A';
                const rate = p.exchangeRate || 0;
                const paySymbol = p.payCurrency || cur;
                content += `${i+1}. ${p.tipo}: ${paySymbol}${p.monto} (TC: ${rate})  [${dateStr}]\n`;
            });

            const blob = new Blob([content], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pago_${(walker.nombre || 'cliente').replace(/\s+/g, '_')}.txt`;
            link.click();
        },

        // --- INVOICE MODAL GENERATION ---
        getInvoiceHTML: (walker, event, totals) => {
            const { totalPagado, deuda } = totals;
            const cur = event.currency;
            const dateNow = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            const isPaid = deuda <= 0;

            // --- 1. Preparar Datos Extendidos del Evento ---
            const stageText = event.stage ? ` • ${event.stage}` : '';
            const typeText = event.eventType ? `${event.eventType}${stageText}` : 'Evento General';
            
            // Ubicación
            const locationText = event.location === 'Otro' ? (event.locationOther || 'Por definir') : (event.location || 'Por definir');
            
            // Fechas y Horarios
            const formatDate = (d) => d ? new Date(d.replace(/-/g, '\/')).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'}) : '--/--';
            let dateInfo = '';
            
            if (event.days == 1) {
                // Formato 1 Día: Fecha única y Hora Salida
                const time = event.timeStart ? convertTime(event.timeStart) : '';
                dateInfo = `<div class="d-flex justify-content-between">
                    <span><i class="ph-bold ph-calendar-blank me-1"></i>${formatDate(event.dateStart)}</span>
                    <span><i class="ph-bold ph-clock me-1"></i>${time}</span>
                </div>`;
            } else {
                // Formato Multi-día: Salida y Regreso
                const tStart = event.timeStart ? convertTime(event.timeStart) : '';
                const tEnd = event.timeEnd ? convertTime(event.timeEnd) : '';
                dateInfo = `
                <div class="mb-1"><span class="text-muted small">Salida:</span> <strong>${formatDate(event.dateStart)}</strong> ${tStart}</div>
                <div><span class="text-muted small">Regreso:</span> <strong>${formatDate(event.dateEnd)}</strong> ${tEnd}</div>
                `;
            }

            // Lista de Incluye (Tags)
            let includesHTML = '';
            if (event.includes && event.includes.length > 0) {
                const tags = event.includes.map(i => `<span class="badge bg-white text-secondary border border-light fw-normal me-1 mb-1 text-dark">${i}</span>`).join('');
                includesHTML = `<div class="mt-3 pt-2 border-top border-light"><div class="small text-muted mb-1">Incluye:</div><div>${tags}</div></div>`;
            }

            // Lista de Cuentas Bancarias (Solo si no ha pagado todo)
            let accountsHTML = '';
            if (!isPaid && event.paymentMethods && event.paymentMethods.length > 0) {
                accountsHTML = `
                <div class="mt-3 bg-white p-2 rounded border border-light">
                    <h6 class="text-uppercase text-muted fw-bold mb-2" style="font-size:0.65rem; letter-spacing:0.5px">Cuentas para Pago</h6>
                    ${event.paymentMethods.map(m => `
                        <div class="d-flex justify-content-between align-items-center small mb-1 p-1 rounded hover:bg-slate-50">
                            <div><span class="badge bg-light text-dark border me-1">${m.type}</span> <span class="fw-bold select-all">${m.number}</span></div>
                            <div class="text-muted" style="font-size:0.65rem">${m.name}</div>
                        </div>
                    `).join('')}
                </div>`;
            }

            // --- 2. Historial de Pagos ---
            let totalReservas = 0;
            let totalAbonos = 0;

            const historyRows = walker.pagos.map((p, i) => { // Agregamos el índice 'i'
                const monto = parseFloat(p.monto) || 0;
                const rate = parseFloat(p.exchangeRate) || 1;
                let normalizedVal = (p.payCurrency === cur) ? monto : ((cur === '¢') ? (monto * rate) : (monto / rate));

                if (p.tipo === 'Reserva') totalReservas += normalizedVal;
                else totalAbonos += normalizedVal;

                let txtColones, txtDolares;
                if (p.payCurrency === '¢') {
                    txtColones = `¢${monto.toLocaleString()}`;
                    txtDolares = `$${(monto / rate).toFixed(2)}`;
                } else {
                    txtDolares = `$${monto.toLocaleString()}`;
                    txtColones = `¢${Math.floor(monto * rate).toLocaleString()}`;
                }

                return `
                    <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                        <div>
                            <div class="fw-bold text-dark small">${p.fecha || 'N/A'}</div>
                            <div class="text-uppercase text-muted d-flex align-items-center" style="font-size:0.7rem;">
                                <!-- CONSECUTIVO AGREGADO AQUÍ -->
                                <span class="me-1 fw-bold">${i + 1}.</span> ${p.tipo} 
                                <span class="ms-2 badge bg-light text-secondary border border-secondary-subtle font-monospace" style="font-size:0.65rem">TC: ${rate}</span>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold text-dark" style="font-size:0.9rem">${txtColones}</div>
                            <div class="fw-bold text-secondary opacity-75" style="font-size:0.75rem">${txtDolares}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // --- 3. Estilos Dinámicos ---
            const eventBlockStyle = isPaid 
                ? 'bg-white border-2 border-success position-relative' 
                : 'bg-slate-50 border border-slate-200';
            
            const eventBlockBadge = isPaid
                ? `<span class="position-absolute top-0 end-0 m-3 badge bg-success text-white fw-bold px-3 py-1 shadow-sm">CANCELADO</span>`
                : '';

            return `
            <div id="invoice-capture" class="bg-white p-4 text-start relative overflow-hidden" style="max-width: 450px; margin: 0 auto; font-family: sans-serif;">
                
                <!-- HEADER -->
                <div class="text-center mb-4">
                    <!-- TÍTULO NARANJA -->
                    <h5 class="fw-black mb-0 text-uppercase tracking-tight" style="color: #fd7e14;">La Tribu de Los Libres</h5>
                    <p class="text-muted small mb-0">Comprobante de Actividad</p>
                </div>
                
                <!-- FICHA TÉCNICA DEL EVENTO -->
                <div class="${eventBlockStyle} p-3 rounded-4 mb-4 shadow-sm">
                    ${eventBlockBadge}
                    
                    <div class="mb-3">
                        <div class="text-uppercase fw-bold small" style="color: #fd7e14; font-size:0.7rem">${typeText}</div>
                        <div class="fw-black text-dark fs-5 lh-sm">${event.name}</div>
                    </div>

                    <div class="row g-2 small text-dark">
                        <!-- Fecha y Hora -->
                        <div class="col-12 bg-white p-2 rounded border border-light">
                            ${dateInfo}
                        </div>
                        
                        <!-- Ubicación -->
                        <div class="col-12 d-flex align-items-start mt-2">
                            <i class="ph-fill ph-map-pin text-danger me-2 mt-1"></i>
                            <div>
                                <span class="text-muted d-block" style="font-size:0.65rem">PUNTO DE ENCUENTRO</span>
                                <span class="fw-bold">${locationText}</span>
                            </div>
                        </div>
                    </div>

                    ${includesHTML}
                    ${accountsHTML}
                    
                    ${isPaid ? '<div class="mt-3 text-center border-top border-success pt-2"><span class="fw-black text-success fs-5" style="letter-spacing: 2px;">¡PAGO COMPLETO!</span></div>' : ''}
                </div>

                <!-- DATOS DEL CLIENTE -->
                <div class="border-bottom border-2 pb-3 mb-3">
                    <div class="fw-bold fs-5 mb-1 text-uppercase">${walker.nombre}</div>
                    <div class="d-flex justify-content-between small text-muted">
                        <span>ID: <span class="fw-bold text-dark">${walker.cedula || '---'}</span></span>
                        <span>Tel: <span class="fw-bold text-dark">${walker.telefono || '---'}</span></span>
                    </div>
                </div>

                <!-- RESUMEN FINANCIERO -->
                <div class="mb-4 bg-light p-3 rounded-3 border border-light">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="small text-muted">Precio Paquete</span>
                        <span class="fw-bold text-dark">${cur}${event.price.toLocaleString()}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                        <span class="small text-muted">Total Abonado</span>
                        <span class="fw-bold text-success">${cur}${totalPagado.toLocaleString()}</span>
                    </div>
                    <div class="d-flex justify-content-between border-top pt-2 mt-2">
                        <span class="small fw-bold text-dark">SALDO PENDIENTE</span>
                        <span class="fw-black fs-5 ${isPaid ? 'text-success' : 'text-danger'}">${cur}${Math.max(0, deuda).toLocaleString()}</span>
                    </div>
                </div>

                <!-- HISTORIAL -->
                <div class="mb-2">
                    <h6 class="small fw-bold text-muted mb-3 uppercase border-bottom pb-1">Movimientos</h6>
                    ${historyRows}
                </div>
                
                <!-- FOOTER -->
                <div class="text-center small text-muted italic mt-5 pt-3 border-top">
                    Emitido: ${dateNow}
                </div>
                <div class="text-center mt-2 text-muted small opacity-75 fw-bold" style="font-size: 0.7rem;">
                    Hecho con <span style="color: #ef4444;">&hearts;</span> Por La Tribu de Los Libres
                </div>
            </div>
            
            <!-- BOTONES DE ACCIÓN -->
            <div class="d-grid gap-2 mt-4 px-2">
                <!-- BOTÓN NARANJA -->
                <button onclick="paymentsApp.exportInvoicePng()" class="btn rounded-pill py-3 shadow-sm fw-bold text-white" style="background-color: #fd7e14; border-color: #fd7e14;">
                    <i class="ph-bold ph-download-simple me-2"></i>Descargar Imagen
                </button>
                <button onclick="ui.closeModal()" class="btn btn-light rounded-pill py-3">Cerrar</button>
            </div>
            `;
        },

        // --- PNG EXPORT ---
        toPNG: (elementId) => {
            const element = document.getElementById(elementId);
            if(!element) return;
            
            if(window.ui) window.ui.toast("Generando imagen...");
            
            if(typeof html2canvas !== 'undefined') {
                html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `Comprobante_TribuPlay_${Date.now()}.png`;
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                    if(window.ui) window.ui.toast("Imagen guardada");
                });
            } else {
                console.error("Librería html2canvas no encontrada");
            }
        }
    };

    // Helper para formato de hora 24h a 12h
    function convertTime(time24) {
        if(!time24) return '';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    }

    window.PaymentsExport = PaymentsExport;
})();