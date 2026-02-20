/**
 * Lógica para la vista de Cambio de Contraseña (cambiarPass.html)
 * Usamos el objeto global 'window' para que las funciones siempre estén 
 * disponibles para el HTML sin importar si la vista se cargó dinámicamente.
 */

// 1. VISIBILIDAD DE CONTRASEÑAS (Toggle Ojo)
window.togglePass = function(inputId, iconId) {
    const inputPass = document.getElementById(inputId);
    const iconoOjo = document.getElementById(iconId);
    
    if (!inputPass || !iconoOjo) return;

    if (inputPass.type === 'password') {
        inputPass.type = 'text';
        iconoOjo.className = 'bi bi-eye-slash-fill fs-5 text-primary';
    } else {
        inputPass.type = 'password';
        iconoOjo.className = 'bi bi-eye-fill fs-5 text-secondary';
    }
};

// Función para cerrar sesión globalmente
window.cerrarSesion = function() {
    if (typeof window.setLoginState === 'function') {
        window.setLoginState(false);
    }
    window.location.hash = 'login';
};

// 2. PROCESAMIENTO DEL FORMULARIO Y CONEXIÓN A LA API
window.procesarCambioPass = async function(event) {
    event.preventDefault(); // Detiene el recargo de página por defecto

    // Obtener valores
    const passActual = document.getElementById('passActual').value;
    const passNueva = document.getElementById('passNueva').value;
    const passConfirmar = document.getElementById('passConfirmar').value;

    // Referencias UI
    const alertaError = document.getElementById('alertaPass');
    const alertaExito = document.getElementById('exitoPass');
    const btn = document.getElementById('btnActualizarPass');
    const btnText = document.getElementById('btnPassText');
    const btnSpinner = document.getElementById('btnPassSpinner');

    // Limpiar alertas previas
    if(alertaError) alertaError.classList.add('d-none');
    if(alertaExito) alertaExito.classList.add('d-none');

    // Validaciones Locales Inmediatas
    if (passNueva !== passConfirmar) {
        alertaError.textContent = 'Las nuevas contraseñas no coinciden.';
        alertaError.classList.remove('d-none');
        return;
    }

    if (passNueva.length < 6) {
        alertaError.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
        alertaError.classList.remove('d-none');
        return;
    }

    if (passActual === passNueva) {
        alertaError.textContent = 'La nueva contraseña no puede ser igual a la actual.';
        alertaError.classList.remove('d-none');
        return;
    }

    // --- PREPARAR PETICIÓN AL BACKEND ---
    btn.disabled = true;
    btnText.textContent = 'Actualizando...';
    btnSpinner.classList.remove('d-none');

    try {
        /** * Aquí conectarías con tu backend real en PythonAnywhere:
         * * const response = await fetch('https://kenth1977.pythonanywhere.com/api/altairV1/change_password', {
         * method: 'POST',
         * headers: { 'Content-Type': 'application/json' },
         * body: JSON.stringify({ actual: passActual, nueva: passNueva })
         * });
         * const result = await response.json();
         */
        
        // Simulación de latencia de red (1.5 segundos)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulación de resultado exitoso desde Flask
        const result = { status: 'ok', mensaje: 'Contraseña actualizada en SQLite.' };

        if (result.status === 'ok') {
            alertaExito.textContent = '¡Contraseña actualizada correctamente!';
            alertaExito.classList.remove('d-none');
            
            // Limpiar formulario
            document.getElementById('form-cambiar-pass').reset();

            // Redirigir de regreso al perfil después de 2 segundos (usando hash si es un SPA)
            setTimeout(() => {
                window.location.hash = 'perfil'; 
                // O si no usas hash en tu app: window.location.href = 'perfil.html';
            }, 2000);
        } else {
            throw new Error(result.mensaje || 'Error desconocido al actualizar.');
        }

    } catch (error) {
        alertaError.textContent = "Error: " + error.message;
        alertaError.classList.remove('d-none');
    } finally {
        // Restaurar estado del botón siempre
        btn.disabled = false;
        btnText.textContent = 'Guardar Cambios';
        btnSpinner.classList.add('d-none');
    }
};
