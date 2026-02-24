async function buscarActualizacion() {
    // Validar si el objeto nativo Capacitor está inyectado
    if (typeof Capacitor === 'undefined' || !Capacitor.Plugins.CapacitorUpdater) {
        alert("Las actualizaciones OTA solo funcionan dentro de la App instalada (Android/iOS).");
        return;
    }

    const btn = document.getElementById('global-update-btn');
    const originalIcon = btn.innerHTML;
    
    try {
        // Mostrar spinner de carga interactivo en el botón
        btn.innerHTML = '<div class="spinner-border text-primary" style="width: 1.5rem; height: 1.5rem;" role="status"></div>';
        
        // 1. Consultar a tu servidor PythonAnywhere (utilizando API_URL global de api_db.js)
        const res = await fetch(`${API_URL}/check_update`);
        const data = await res.json();

        if (data.url && data.version) {
            if (confirm(`Hay una nueva actualización disponible (v${data.version}). ¿Deseas descargar e instalar los cambios ahora?`)) {
                alert("Descargando actualización... La aplicación parpadeará y se reiniciará sola cuando termine.");
                
                const { CapacitorUpdater } = Capacitor.Plugins;
                
                // 2. Descargar el .zip en segundo plano a la memoria del teléfono
                const version = await CapacitorUpdater.download({
                    url: data.url,
                    version: data.version,
                });
                
                // 3. Aplicar los nuevos archivos HTML/CSS/JS y recargar la vista
                await CapacitorUpdater.set({ id: version.id });
            }
        } else {
            alert("Tu aplicación ya está al día con la última versión.");
        }
    } catch (error) {
        console.error("Error al buscar actualización:", error);
        alert("No hay nuevas actualizaciones publicadas o revisa tu conexión a internet.");
    } finally {
        // Restaurar el icono de la nube
        btn.innerHTML = originalIcon;
    }
}

async function buscarActualizacion() {
        // Referencias a los elementos del modal
        const modalEl = document.getElementById('modalOTA');
        // Usamos getInstance o creamos uno nuevo para evitar conflictos
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);

        const title = document.getElementById('otaModalTitle');
        const icon = document.getElementById('otaIcon');
        const spinner = document.getElementById('otaSpinner');
        const msg = document.getElementById('otaMessage');
        const btnCancel = document.getElementById('otaCancelBtn');
        const btnConfirm = document.getElementById('otaConfirmBtn');
        const btnCloseTop = document.getElementById('otaCloseBtnTop');

        // 1. Resetear el diseño del modal al estado inicial de carga
        title.innerText = "Buscando actualización...";
        icon.className = "bi bi-cloud-arrow-down text-primary mb-3 d-none";
        spinner.classList.remove('d-none');
        msg.innerHTML = "Conectando con el servidor...<br><small class='text-muted'>Por favor espera unos segundos.</small>";
        
        btnConfirm.classList.add('d-none');
        btnCancel.innerText = "Cancelar";
        btnCancel.classList.remove('d-none');
        btnCancel.disabled = false;
        btnCloseTop.classList.remove('d-none');

        // Limpiamos los eventos previos del botón de confirmación clonándolo
        const nuevoBtnConfirm = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(nuevoBtnConfirm, btnConfirm);

        // Mostrar el modal
        modal.show();

        // 2. Validación: Solo funciona en dispositivo nativo
        if (typeof Capacitor === 'undefined' || !Capacitor.Plugins.CapacitorUpdater) {
            spinner.classList.add('d-none');
            icon.className = "bi bi-phone-vibrate text-warning mb-3 d-block";
            title.innerText = "Solo para App Instalada";
            msg.innerText = "Las actualizaciones automáticas en la nube solo funcionan cuando instalas el APK en un teléfono Android o iOS.";
            btnCancel.innerText = "Cerrar";
            return;
        }

        try {
            // 3. Consultar la versión al servidor
            const res = await fetch(`${API_URL}/check_update`);
            const data = await res.json();

            if (data.url && data.version) {
                // HAY ACTUALIZACIÓN DISPONIBLE
                spinner.classList.add('d-none');
                icon.className = "bi bi-cloud-arrow-down-fill text-primary mb-3 d-block";
                title.innerText = "¡Nueva Versión!";
                msg.innerHTML = `Se ha encontrado la versión <b>v${data.version}</b> con mejoras.<br>¿Deseas descargarla e instalarla?`;
                
                nuevoBtnConfirm.classList.remove('d-none');
                
                // Lógica al presionar "Actualizar Ahora"
                nuevoBtnConfirm.addEventListener('click', async () => {
                    // Cambiamos a estado de "Descarga en progreso"
                    title.innerText = "Descargando...";
                    msg.innerHTML = "Aplicando los cambios en segundo plano.<br><b>La app parpadeará y se reiniciará sola.</b>";
                    icon.classList.add('d-none');
                    spinner.classList.remove('d-none');
                    
                    // Ocultamos botones para forzar al usuario a esperar
                    nuevoBtnConfirm.classList.add('d-none');
                    btnCancel.classList.add('d-none');
                    btnCloseTop.classList.add('d-none');

                    try {
                        const { CapacitorUpdater } = Capacitor.Plugins;
                        
                        // Inicia la descarga
                        const version = await CapacitorUpdater.download({
                            url: data.url,
                            version: data.version,
                        });
                        
                        // Aplica la actualización y recarga el webview instantáneamente
                        await CapacitorUpdater.set({ id: version.id });
                    } catch (err) {
                        // En caso de que se corte el internet en medio de la descarga
                        spinner.classList.add('d-none');
                        icon.className = "bi bi-x-circle text-danger mb-3 d-block";
                        title.innerText = "Fallo la Descarga";
                        msg.innerText = "Hubo un problema de conexión al aplicar la actualización. Inténtalo de nuevo.";
                        btnCancel.innerText = "Cerrar";
                        btnCancel.classList.remove('d-none');
                        btnCloseTop.classList.remove('d-none');
                    }
                });

            } else {
                // NO HAY ACTUALIZACIONES
                spinner.classList.add('d-none');
                icon.className = "bi bi-check-circle-fill text-success mb-3 d-block";
                title.innerText = "Todo al Día";
                msg.innerText = "Ya tienes la última versión instalada. ¡Tu App está lista para la acción!";
                btnCancel.innerText = "Genial";
            }
        } catch (error) {
            console.error("Error al buscar actualización:", error);
            
            // ERROR DE SERVIDOR O INTERNET
            spinner.classList.add('d-none');
            icon.className = "bi bi-wifi-off text-danger mb-3 d-block";
            title.innerText = "Sin Conexión";
            msg.innerText = "No pudimos conectar con el servidor para buscar actualizaciones.";
            btnCancel.innerText = "Cerrar";
        }
    }