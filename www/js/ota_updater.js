// ==============================================================================
// ARCHIVO: www/js/ota_updater.js
// ROL: Sistema de Actualizaciones Automáticas (OTA) interactivo
// ==============================================================================

let globalUpdateData = null;

async function verificarActualizacionesOTA() {
    const btnCheck = document.getElementById('btn-check-update');
    const iconCheck = document.getElementById('icon-check-update');
    const textCheck = document.getElementById('text-check-update');
    const badgeUpdate = document.getElementById('badge-update-available');
    
    try {
        // 1. EL ANTÍDOTO AL BUCLE: Notificar a Capacitor inmediatamente que la app arrancó bien
        // Si no hacemos esto, el sistema asume que la actualización dañó la app y hace ROLLBACK.
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.CapacitorUpdater) {
            try {
                await Capacitor.Plugins.CapacitorUpdater.notifyAppReady();
                console.log("✅ App viva y lista. Rollback de seguridad desactivado.");
            } catch(e) {
                console.warn("No se requirió notificar notifyAppReady:", e);
            }
        }

        if (!btnCheck) return;

        // 2. Verificar si acabamos de actualizar exitosamente (Mensaje de Éxito Flotante)
        const justUpdatedVersion = localStorage.getItem('just_updated');
        if (justUpdatedVersion) {
            localStorage.removeItem('just_updated');
            
            const exitoDiv = document.createElement('div');
            exitoDiv.className = 'position-fixed top-0 start-50 translate-middle-x mt-4 bg-success text-white px-4 py-3 rounded shadow-lg text-center fw-bold';
            exitoDiv.style.zIndex = "9999";
            exitoDiv.innerHTML = `<i class="bi bi-check-circle-fill fs-4 d-block mb-1"></i> ¡Éxito!<br>La versión ${justUpdatedVersion} se instaló correctamente.`;
            document.body.appendChild(exitoDiv);
            
            setTimeout(() => {
                exitoDiv.style.transition = "opacity 0.8s ease";
                exitoDiv.style.opacity = "0";
                setTimeout(() => exitoDiv.remove(), 800);
            }, 5000);
        }

        if (typeof Capacitor === 'undefined' || !Capacitor.Plugins.CapacitorUpdater) {
            btnCheck.disabled = true;
            textCheck.innerText = "Solo en App Móvil";
            iconCheck.className = 'bi bi-phone';
            return;
        }

        const baseUrl = typeof POCKETBASE_URL !== 'undefined' ? POCKETBASE_URL : 'http://127.0.0.1:8090/api';
        const url = `${baseUrl}/collections/ota_updates/records?filter=(activa=true)&perPage=1`;
        
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("No se pudo conectar al servidor OTA.");

        const datos = await respuesta.json();

        if (datos.items && datos.items.length > 0) {
            const ultimaActualizacion = datos.items[0];
            const versionServidor = ultimaActualizacion.version.trim();

            // 3. Leer la versión real instalada reportada por el motor nativo del celular
            let versionLocal = localStorage.getItem('installed_version') || '0.0.0';
            try {
                const estado = await Capacitor.Plugins.CapacitorUpdater.current();
                if (estado && estado.bundle && estado.bundle !== 'builtin') {
                    versionLocal = estado.bundle.trim();
                    localStorage.setItem('installed_version', versionLocal);
                }
            } catch(e) {
                console.warn("No se pudo leer el estado interno de CapacitorUpdater", e);
            }

            // 4. Comparar: ¿Necesitamos actualizar?
            if (versionServidor !== versionLocal) {
                globalUpdateData = ultimaActualizacion;
                
                btnCheck.disabled = false;
                btnCheck.classList.replace('btn-outline-dark', 'btn-success');
                iconCheck.className = 'bi bi-cloud-arrow-down-fill text-white';
                textCheck.innerText = `¡Instalar versión ${versionServidor}!`;
                
                // Configurar el botón de Ajustes para que abra el Modal Gigante
                btnCheck.setAttribute('data-bs-toggle', 'modal');
                btnCheck.setAttribute('data-bs-target', '#updateAppModal');
                
                if (badgeUpdate) badgeUpdate.classList.remove('d-none');
                return;
            }
        }

        // 5. SI LLEGA AQUÍ: LA APP YA ESTÁ ACTUALIZADA
        btnCheck.disabled = true;
        btnCheck.classList.remove('btn-success');
        btnCheck.classList.add('btn-outline-dark');
        btnCheck.removeAttribute('data-bs-toggle'); 
        btnCheck.removeAttribute('data-bs-target');
        iconCheck.className = 'bi bi-check-circle-fill text-success';
        textCheck.innerText = "App actualizada al día";
        if (badgeUpdate) badgeUpdate.classList.add('d-none');

    } catch (error) {
        console.error("❌ Error en OTA:", error);
        if (btnCheck) {
            btnCheck.disabled = true;
            iconCheck.className = 'bi bi-wifi-off text-danger';
            textCheck.innerText = "Servidor OTA inalcanzable";
            if (badgeUpdate) badgeUpdate.classList.add('d-none');
        }
    }
}

async function descargarActualizacionDirecta() {
    if (!globalUpdateData) return;

    const btnCheck = document.getElementById('btn-check-update');
    const btnDownloadModal = document.getElementById('btn-download-update');
    const btnLater = document.getElementById('btn-later-update');
    const progressContainer = document.getElementById('update-progress-container');
    const progressBar = document.getElementById('update-progress-bar');
    const progressText = document.getElementById('update-progress-text');

    // Bloquear UI para evitar dobles clics y mostrar preparación
    if (btnCheck) btnCheck.disabled = true;
    if (btnDownloadModal) {
        btnDownloadModal.disabled = true;
        btnDownloadModal.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Procesando...`;
    }
    if (btnLater) btnLater.classList.add('d-none'); 
    if (progressContainer) progressContainer.classList.remove('d-none');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.innerText = '0%';
        progressBar.classList.remove('bg-danger');
        progressBar.classList.add('bg-success');
    }

    try {
        const CapacitorUpdater = Capacitor.Plugins.CapacitorUpdater;
        
        // CORRECCIÓN MATEMÁTICA: ESCUCHADOR DE LA BARRA DE PROGRESO (0 a 100)
        CapacitorUpdater.addListener('download', (info) => {
            // Ya no multiplicamos por 100, la librería nativa entrega del 0 al 100 directo.
            const porcentaje = Math.min(100, Math.max(0, Math.round(info.percent))) || 0;
            
            if (progressBar) {
                progressBar.style.width = `${porcentaje}%`;
                progressBar.innerText = `${porcentaje}%`;
            }
            if (progressText) {
                progressText.innerText = `Descargando actualización: ${porcentaje}%`;
            }
        });

        const baseUrl = typeof POCKETBASE_URL !== 'undefined' ? POCKETBASE_URL.replace('/api', '') : 'http://127.0.0.1:8090';
        const urlDescarga = `${baseUrl}/api/files/ota_updates/${globalUpdateData.id}/${globalUpdateData.archivo_zip}`;

        if (progressText) progressText.innerText = "Conectando al servidor...";

        // Iniciar la descarga real
        const versionDescargada = await CapacitorUpdater.download({
            url: urlDescarga,
            version: globalUpdateData.version.trim()
        });

        // Preparando para instalar
        if (progressText) progressText.innerText = "¡Descarga completa! Instalando...";
        if (progressBar) {
            progressBar.classList.remove('progress-bar-animated');
            progressBar.style.width = '100%';
            progressBar.innerText = "100%";
        }

        // GUARDAMOS EL REGISTRO
        localStorage.setItem('installed_version', globalUpdateData.version.trim());
        localStorage.setItem('just_updated', globalUpdateData.version.trim());

        // Set e instala (Esto reiniciará la App y aplicará los cambios)
        await CapacitorUpdater.set({ id: versionDescargada.id });
        
    } catch (err) {
        console.error("Error al actualizar:", err);
        if (btnDownloadModal) {
            btnDownloadModal.disabled = false;
            btnDownloadModal.innerHTML = `<i class="bi bi-arrow-repeat me-1"></i> Reintentar Descarga`;
        }
        if (progressText) progressText.innerText = "Fallo en la descarga. Revisa tu conexión a internet.";
        if (progressBar) progressBar.classList.replace('bg-success', 'bg-danger');
        if (btnLater) btnLater.classList.remove('d-none');
    }
}

// Exponer la función para poder llamarla desde el HTML
window.descargarActualizacionDirecta = descargarActualizacionDirecta;

// EJECUCIÓN SEGURA: Usar DOMContentLoaded asegura que la app evite el Rollback al arrancar
document.addEventListener('DOMContentLoaded', () => {
    verificarActualizacionesOTA();
    
    // Conectar dinámicamente el botón del Modal Gigante a la función de descarga
    const btnDescargaModal = document.getElementById('btn-download-update');
    if (btnDescargaModal) {
        const nuevoBtn = btnDescargaModal.cloneNode(true);
        btnDescargaModal.parentNode.replaceChild(nuevoBtn, btnDescargaModal);
        nuevoBtn.addEventListener('click', descargarActualizacionDirecta);
    }
});

// Respaldo de inicialización
document.addEventListener('deviceready', () => {
    verificarActualizacionesOTA();
}, false);

// Volver a chequear si abren el modal de ajustes
const settingsModalEl_ota = document.getElementById('settingsModal');
if (settingsModalEl_ota) {
    settingsModalEl_ota.addEventListener('show.bs.modal', () => {
        verificarActualizacionesOTA();
    });
}