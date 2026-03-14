// ============================================================================
// ⚠️ FRAGMENTO 2: AUTENTICACIÓN (js/auth.js)
// ⚠️ SIRVE PARA: Manejar el inicio y cierre de sesión, y la validación de 
//                credenciales hasheadas conectándose con el FRAGMENTO 1 (SQLite).
// ============================================================================

/**
 * Procesa el intento de inicio de sesión.
 * Convierte la clave a SHA-256 y consulta el servicio de base de datos nativo.
 * @param {Event} e - (Opcional) Evento de envío de formulario para evitar recargas.
 */
async function iniciarSesionApp(e) {
    if (e) e.preventDefault(); // Evita que la página intente recargarse si es un <form>

    const btnSubmit = document.getElementById('btn-login-submit');
    const emailInput = document.getElementById('login-email')?.value.trim();
    const rawPass = document.getElementById('login-pass')?.value;
    const errorDiv = document.getElementById('login-error');

    if (!emailInput || !rawPass) {
        if (errorDiv) {
            errorDiv.textContent = "Por favor, completa todos los campos.";
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    // Estado de carga en el botón (UX)
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>INGRESANDO...';
    }
    
    // Ocultar errores previos
    if (errorDiv) errorDiv.classList.add('d-none');

    try {
        // 1. Cifrado de la contraseña ingresada (Algoritmo SHA-256)
        // Esto garantiza que nunca viajen contraseñas en texto plano.
        const encoder = new TextEncoder();
        const data = encoder.encode(rawPass);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passHashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 2. Consulta a la Base de Datos Local
        // IMPORTANTE: sqliteService.login comparará passHashed contra lo guardado en la DB nativa.
        const user = await window.sqliteService.login(emailInput, passHashed);

        if (user) {
            if (user.estado !== 'inactivo') {
                if (window.mostrarNotificacion) {
                    window.mostrarNotificacion(`¡Bienvenido de nuevo, ${user.nombre || 'Usuario'}!`, "success");
                }
                
                // Guardar la sesión de forma persistente en SQLite o LocalStorage
                await window.sqliteService.setSession(user);
                
                // Redirigir al inicio de manera fluida y sin recargas
                requestAnimationFrame(() => {
                    if (typeof window.cargarVista === 'function') {
                        window.cargarVista('inicio', 'Inicio');
                    } else {
                        window.location.reload();
                    }
                });
            } else {
                errorDiv.textContent = "Tu cuenta está inactiva o ha sido bloqueada.";
                errorDiv.classList.remove('d-none');
                restaurarBotonLogin(btnSubmit);
            }
        } else {
            errorDiv.textContent = "Credenciales incorrectas o usuario inexistente.";
            errorDiv.classList.remove('d-none');
            restaurarBotonLogin(btnSubmit);
        }
    } catch(e) {
        console.error("[Auth] Error crítico en el login:", e);
        if (errorDiv) {
            errorDiv.textContent = "Error de conexión con la base de datos local.";
            errorDiv.classList.remove('d-none');
        }
        restaurarBotonLogin(btnSubmit);
    }
}

/**
 * Devuelve el botón de login a su estado original si ocurre un error.
 * @param {HTMLElement} btn - Referencia al botón del DOM.
 */
function restaurarBotonLogin(btn) {
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'INGRESAR AL SISTEMA';
    }
}

/**
 * Cierra la sesión activa borrando la memoria y redirige al login.
 */
async function cerrarSesion() {
    try {
        await window.sqliteService.clearSession();
        
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion('Sesión cerrada correctamente.', 'info');
        }
        
        if (typeof window.cargarVista === 'function') {
            window.cargarVista('login', 'Login');
        } else {
            window.location.reload();
        }
    } catch (e) {
        console.error("[Auth] Fallo al cerrar sesión:", e);
        window.location.reload();
    }
}

/**
 * Maneja el flujo de "Olvidó su contraseña"
 * Por ahora (como app offline/híbrida), instruye al usuario a pedir soporte.
 */
function recuperarContrasena() {
    if (window.mostrarNotificacion) {
        window.mostrarNotificacion('Por favor, contacta al Administrador de tu sistema para obtener un nuevo código de acceso.', 'warning');
    }
}

// --- EXPORTAR AL ENTORNO GLOBAL ---
// Esto es necesario para que funciones atadas al HTML con onclick="" funcionen.
window.iniciarSesionApp = iniciarSesionApp;
window.cerrarSesion = cerrarSesion;
window.recuperarContrasena = recuperarContrasena;