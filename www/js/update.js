/**
 * Lógica para las Actualizaciones OTA (Over-The-Air) usando Capacitor Updater.
 * Permite descargar la carpeta 'www' desde PythonAnywhere e instalarla.
 */

async function buscarActualizacion() {
    // Referencias a los elementos del modal
    const modalEl = document.getElementById('modalOTA');
    if (!modalEl) return console.error("No se encontró el modalOTA en el DOM");

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
    if (typeof window.Capacitor === 'undefined' || !window.Capacitor.Plugins.CapacitorUpdater) {
        spinner.classList.add('d-none');
        icon.className = "bi bi-phone-vibrate text-warning mb-3 d-block";
        title.innerText = "Solo para App Instalada";
        msg.innerText = "Las actualizaciones automáticas en la nube solo funcionan cuando instalas el APK en un teléfono Android o iOS.";
        btnCancel.innerText = "Cerrar";
        return;
    }

    try {
        // 3. Consultar la versión al servidor
        const res = await fetch(`${API_URL}/check_update`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store' // Evitar caché del navegador
        });
        
        const data = await res.json();

        // NUEVO: Si el servidor de Python nos mandó un error explícito, lo atrapamos aquí
        if (data.error) {
            throw new Error(`Servidor: ${data.error}`);
        }

        // NOTA: Validamos 'timestamp' porque app.py ahora envía la fecha exacta del www.zip
        if (data.url && data.timestamp) {
            
            // 4. Comprobar si ya tenemos esta versión específica instalada
            const versionLocal = localStorage.getItem('app_version_timestamp');
            const versionServidor = data.timestamp.toString();

            if (versionLocal === versionServidor) {
                // NO HAY ACTUALIZACIONES NUEVAS (El zip es el mismo)
                spinner.classList.add('d-none');
                icon.className = "bi bi-check-circle-fill text-success mb-3 d-block";
                title.innerText = "Todo al Día";
                msg.innerText = "Ya tienes la última versión instalada. ¡Tu App está lista para la acción!";
                btnCancel.innerText = "Genial";
                return;
            }

            // HAY ACTUALIZACIÓN DISPONIBLE
            spinner.classList.add('d-none');
            icon.className = "bi bi-cloud-arrow-down-fill text-primary mb-3 d-block";
            title.innerText = "¡Nueva Actualización!";
            
            // Mostrar qué archivos cambiaron (vienen desde app.py para que el usuario vea la "magia")
            let archivosHtml = "";
            if (data.archivos && data.archivos.length > 0) {
                archivosHtml = `<div class='text-start mt-3 p-2 bg-light rounded border' style='font-size: 0.75rem; max-height: 80px; overflow-y: auto;'>
                    <strong class="text-primary">Cambios detectados:</strong><br>- ${data.archivos.join("<br>- ")}
                </div>`;
            }

            msg.innerHTML = `Se ha encontrado una nueva versión en el servidor.<br>¿Deseas descargarla e instalarla? ${archivosHtml}`;
            
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
                    const { CapacitorUpdater } = window.Capacitor.Plugins;
                    
                    // Inicia la descarga
                    const version = await CapacitorUpdater.download({
                        url: data.url,
                        version: versionServidor, // Usamos la fecha como identificador de versión
                    });
                    
                    // Guardamos la fecha en el teléfono para no volver a descargar este mismo www.zip
                    localStorage.setItem('app_version_timestamp', versionServidor);
                    
                    // Aplica la actualización y recarga el webview instantáneamente
                    await CapacitorUpdater.set({ id: version.id });
                } catch (err) {
                    console.error("Error OTA al descargar o aplicar el ZIP:", err);
                    // En caso de que se corte el internet en medio de la descarga
                    spinner.classList.add('d-none');
                    icon.className = "bi bi-x-circle text-danger mb-3 d-block";
                    title.innerText = "Fallo la Descarga";
                    msg.innerText = "Hubo un problema de conexión al aplicar la actualización. Verifica tu internet e inténtalo de nuevo.";
                    btnCancel.innerText = "Cerrar";
                    btnCancel.classList.remove('d-none');
                    btnCloseTop.classList.remove('d-none');
                }
            });

        } else {
            throw new Error("Respuesta del servidor incompleta. Faltan datos críticos como la URL o el Timestamp.");
        }
    } catch (error) {
        console.error("Error al buscar actualización:", error);
        
        // ERROR DE SERVIDOR O INTERNET CON DETALLE REAL
        spinner.classList.add('d-none');
        icon.className = "bi bi-exclamation-triangle-fill text-danger mb-3 d-block";
        title.innerText = "Error de Actualización";
        
        // Verificamos si es un error de red o un error devuelto por Python
        if (error.message === "Failed to fetch" || error.message.includes("NetworkError")) {
            msg.innerText = "No tienes internet o el servidor está apagado.";
        } else {
            msg.innerHTML = `No pudimos procesar la actualización.<br><br><small class='text-danger fw-bold'>Detalle técnico: ${error.message}</small>`;
        }
        
        btnCancel.innerText = "Cerrar";
    }
}