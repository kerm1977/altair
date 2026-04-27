// ==============================================================================
// ARCHIVO: www/js/conexion_segura.js
// ROL: Lógica de Autenticación forzada a PocketBase y Radar Inteligente de UI
// ==============================================================================

// 1. ABRIR MODAL OCULTO DE CONEXIÓN
window.abrirModalConexion = function() {
    const statusText = document.getElementById('db-status-text').innerText;
    // Solo permitir que se abra si está sin conexión
    if (statusText.includes('Sin conexión') || statusText.includes('Verificando')) {
        const settingsModalEl = document.getElementById('settingsModal');
        if (settingsModalEl) {
            const settingsModal = bootstrap.Modal.getInstance(settingsModalEl);
            if(settingsModal) settingsModal.hide(); 
        }
        
        const authModalEl = document.getElementById('dbAuthModal');
        if (authModalEl) {
            const authModal = new bootstrap.Modal(authModalEl);
            authModal.show();
        }
    }
};

// 2. MOSTRAR/OCULTAR CONTRASEÑA
window.togglePasswordVisibility = function(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("bi-eye-slash", "bi-eye");
    } else {
        input.type = "password";
        icon.classList.replace("bi-eye", "bi-eye-slash");
    }
};

// 3. LÓGICA DE CONEXIÓN FORZADA A POCKETBASE
window.forzarConexionPB = async function() {
    const user = document.getElementById('db-user').value.trim();
    const pass = document.getElementById('db-pass').value.trim();
    const pin = document.getElementById('db-pin').value.trim();
    const errorDiv = document.getElementById('db-auth-error');
    const btn = document.getElementById('btn-force-connect');

    errorDiv.classList.add('d-none');

    if (!user || !pass || !pin) {
        errorDiv.innerText = "Por favor, completa todos los campos.";
        errorDiv.classList.remove('d-none');
        return;
    }

    if (pin !== "CR129x7848n") {
        errorDiv.innerText = "El PIN de seguridad es incorrecto.";
        errorDiv.classList.remove('d-none');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Conectando...`;

    try {
        // Usa la URL pública detectada en tu api_db.js
        const baseUrl = typeof POCKETBASE_URL !== 'undefined' ? POCKETBASE_URL : 'http://127.0.0.1:8090/api';
        console.log("Forzando conexión a:", baseUrl);
        
        let response = await fetch(`${baseUrl}/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: user, password: pass })
        });

        if (response.status === 404 || response.status === 400) {
            response = await fetch(`${baseUrl}/admins/auth-with-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: user, password: pass })
            });
        }

        if (response.ok) {
            // Actualizar la interfaz visualmente a Verde
            const statusIcon = document.getElementById('db-status-icon');
            const statusText = document.getElementById('db-status-text');
            const statusBadge = document.getElementById('db-status-badge');
            
            if (statusIcon) statusIcon.className = 'bi bi-circle-fill text-success me-1';
            if (statusText) {
                statusText.textContent = 'Base de datos en línea (Forzado)';
                statusText.className = 'text-success fw-bold';
            }
            if (statusBadge) {
                statusBadge.style.cursor = 'default';
                statusBadge.onclick = null; 
            }

            // Regresar al modal de Ajustes
            const authModalEl = document.getElementById('dbAuthModal');
            if (authModalEl) bootstrap.Modal.getInstance(authModalEl).hide();
            
            const settingsModalEl = document.getElementById('settingsModal');
            if (settingsModalEl) new bootstrap.Modal(settingsModalEl).show();
            
            // Disparar chequeo visual si existe
            if (typeof checkDatabaseConnection === 'function') checkDatabaseConnection(false);
            
        } else {
            errorDiv.innerText = "Usuario o contraseña de la base de datos incorrectos.";
            errorDiv.classList.remove('d-none');
        }
    } catch (e) {
        console.error("Error intentando conectar con PocketBase:", e);
        // Mensaje limpio en lugar de "Fallo Crítico"
        errorDiv.innerText = "No se pudo establecer conexión. Verifica que el servidor Tailscale de tu PC esté activo y tu celular tenga datos/WiFi.";
        errorDiv.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-plug-fill me-2"></i> Forzar Conexión`;
    }
};

// 4. RADAR INTELIGENTE (El vigilante silencioso)
document.addEventListener('DOMContentLoaded', () => {
    const btnContainer = document.getElementById('update-button-container');
    const badge = document.getElementById('badge-update-available');
    let modalAlertaMostrado = false;

    // Conectar el botón de la alerta gigante con la descarga OTA
    const btnDescargaModal = document.getElementById('btn-download-update');
    if (btnDescargaModal) {
        btnDescargaModal.addEventListener('click', function() {
            this.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Descargando e Instalando...`;
            this.disabled = true;
            if (typeof descargarActualizacionDirecta === 'function') {
                descargarActualizacionDirecta();
            }
        });
    }

    // Ejecutar el radar cada 2 segundos
    setInterval(() => {
        const statusTextEl = document.getElementById('db-status-text');
        if (!statusTextEl || !btnContainer) return;
        
        const statusText = statusTextEl.innerText || '';
        
        // REGLA 1: Mostrar/Ocultar el Botón de Actualizar según si hay conexión real
        if (statusText.includes('en línea')) {
            btnContainer.classList.remove('d-none');
        } else {
            btnContainer.classList.add('d-none');
        }

        // REGLA 2: Lanzar la alerta gigante a la cara del usuario si hay una actualización
        if (badge && !badge.classList.contains('d-none') && !modalAlertaMostrado) {
            modalAlertaMostrado = true; 
            
            // Cerrar menú de ajustes
            const settingsModalEl = document.getElementById('settingsModal');
            if (settingsModalEl) {
                const sModal = bootstrap.Modal.getInstance(settingsModalEl);
                if (sModal) sModal.hide();
            }
            
            // Mostrar ventana gigante
            const updateModalEl = document.getElementById('updateAppModal');
            if (updateModalEl) {
                const updateModal = new bootstrap.Modal(updateModalEl);
                updateModal.show();
            }
        }
    }, 2000);
});