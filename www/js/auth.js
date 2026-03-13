// ============================================================================
// ⚠️ FRAGMENTO 2: AUTENTICACIÓN (A FUTURO SERÁ: js/auth.js)
// ⚠️ SIRVE PARA: Manejar el inicio y cierre de sesión, y la validación de 
//                credenciales hasheadas conectándose con el FRAGMENTO 1.
//                *Nota: El registro ya está separado en js/registro.js*
// ============================================================================
async function iniciarSesionApp() {
    const btnSubmit = document.getElementById('btn-login-submit');
    const emailInput = document.getElementById('login-email').value;
    const rawPass = document.getElementById('login-pass').value;
    const errorDiv = document.getElementById('login-error');

    if(btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>INGRESANDO...';
    }
    
    errorDiv.classList.add('d-none');

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawPass);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passInput = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const user = await sqliteService.login(emailInput, passInput);

        if (user && user.estado !== 'inactivo') {
            window.mostrarNotificacion("¡Acceso concedido!", "success");
            await sqliteService.setSession(user);
            
            requestAnimationFrame(() => {
                window.cargarVista('inicio', 'Inicio');
            });
        } else if (user && user.estado === 'inactivo') {
            errorDiv.textContent = "Tu cuenta está inactiva o ha sido bloqueada.";
            errorDiv.classList.remove('d-none');
            if(btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'INGRESAR AL SISTEMA';
            }
        } else {
            errorDiv.textContent = "Credenciales incorrectas o usuario inexistente en DB.";
            errorDiv.classList.remove('d-none');
            if(btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'INGRESAR AL SISTEMA';
            }
        }
    } catch(e) {
        errorDiv.textContent = "Error interno de base de datos.";
        errorDiv.classList.remove('d-none');
        if(btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'INGRESAR AL SISTEMA';
        }
    }
}

async function cerrarSesion() {
    await sqliteService.clearSession();
    window.mostrarNotificacion('Sesión cerrada correctamente', 'success');
    window.cargarVista('login', 'Login');
}

// --- EXPORTAR AL ENTORNO GLOBAL ---
window.iniciarSesionApp = iniciarSesionApp;
window.cerrarSesion = cerrarSesion;