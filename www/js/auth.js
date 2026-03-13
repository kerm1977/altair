// ============================================================================
// ⚠️ FRAGMENTO 2: AUTENTICACIÓN (js/auth.js)
// ⚠️ SIRVE PARA: Manejar el inicio y cierre de sesión, y la validación de 
//                credenciales hasheadas conectándose con el FRAGMENTO 1.
// ============================================================================

/**
 * Procesa el intento de inicio de sesión.
 * Convierte la clave a SHA-256 y consulta el servicio de base de datos.
 */
async function iniciarSesionApp() {
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

    // Estado de carga en el botón
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>INGRESANDO...';
    }
    
    if (errorDiv) errorDiv.classList.add('d-none');

    try {
        // 1. Cifrado de la contraseña ingresada (SHA-256)
        const encoder = new TextEncoder();
        const data = encoder.encode(rawPass);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passHashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 2. Consulta a la Base de Datos
        // IMPORTANTE: sqliteService.login comparará passHashed contra lo que hay en la DB
        const user = await window.sqliteService.login(emailInput, passHashed);

        if (user) {
            if (user.estado !== 'inactivo') {
                window.mostrarNotificacion(`¡Bienvenido de nuevo, ${user.nombre || 'Usuario'}!`, "success");
                
                // Guardar la sesión de forma persistente
                await window.sqliteService.setSession(user);
                
                requestAnimationFrame(() => {
                    window.cargarVista('inicio', 'Inicio');
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
        console.error("[Auth] Error en login:", e);
        if (errorDiv) {
            errorDiv.textContent = "Error de conexión con la base de datos.";
            errorDiv.classList.remove('d-none');
        }
        restaurarBotonLogin(btnSubmit);
    }
}

/**
 * Devuelve el botón de login a su estado original.
 */
function restaurarBotonLogin(btn) {
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'INGRESAR AL SISTEMA';
    }
}

/**
 * Cierra la sesión activa y redirige al login.
 */
async function cerrarSesion() {
    try {
        await window.sqliteService.clearSession();
        window.mostrarNotificacion('Sesión cerrada correctamente', 'info');
        window.cargarVista('login', 'Login');
    } catch (e) {
        window.location.reload();
    }
}

// --- EXPORTAR AL ENTORNO GLOBAL ---
window.iniciarSesionApp = iniciarSesionApp;
window.cerrarSesion = cerrarSesion;