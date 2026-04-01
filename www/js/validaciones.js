// ==============================================================================
// ARCHIVO: js/validaciones.js
// DESCRIPCIÓN: Centralización de formatos, seguridad UI y previsualizaciones.
// ==============================================================================

// Variable global para manejar los avatares en todos los HTML
window.archivoAvatarTemp = null;

/**
 * Valida nombres (Ej: "Juan Carlos"):
 * - Bloquea números y caracteres especiales.
 * - Bloquea espacios al inicio.
 * - Permite máximo 1 espacio entre palabras.
 * - Aplica Title Case automático.
 */
function validarNombres(input) {
    let val = input.value;
    
    // 1. Remover todo lo que NO sea letras, acentos, ñ o espacios
    val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    
    // 2. Eliminar espacios al inicio de la caja
    val = val.replace(/^\s+/, '');
    
    // 3. Evitar más de un espacio consecutivo entre nombres
    val = val.replace(/\s{2,}/g, ' ');
    
    // 4. Transformar a Title Case (Primera letra en mayúscula)
    val = val.toLowerCase().replace(/(?:^|\s)\w/g, function(match){ 
        return match.toUpperCase(); 
    });
    
    input.value = val;
    
    // Actualizar avatar autogenerado si existe la función (para index y dashboard)
    if(typeof actualizarAvatarIniciales === 'function') {
        actualizarAvatarIniciales();
    }
}

/**
 * Valida apellidos individuales (Ej: "Pérez"):
 * - Bloquea números, caracteres especiales y ESPACIOS por completo.
 * - Aplica Title Case automático.
 */
function validarApellidos(input) {
    let val = input.value;
    
    // 1. Remover TODO excepto letras, acentos y ñ (Bloquea espacios físicos)
    val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    
    // 2. Transformar a Title Case
    val = val.toLowerCase().replace(/(?:^|\s)\w/g, function(match){ 
        return match.toUpperCase(); 
    });
    
    input.value = val;
    
    if(typeof actualizarAvatarIniciales === 'function') {
        actualizarAvatarIniciales();
    }
}

/**
 * Limpia cualquier espacio residual al final de la caja cuando el usuario sale de ella
 */
function trimEspacios(input) {
    input.value = input.value.trim();
}

/**
 * Controla el "Ojito" de las contraseñas para ocultar/mostrar
 */
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("bi-eye", "bi-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("bi-eye-slash", "bi-eye");
    }
}

/**
 * Carga una imagen local seleccionada por el usuario para previsualizarla
 */
function previsualizarAvatar(event, previewId) {
    const file = event.target.files[0];
    if (file) {
        window.archivoAvatarTemp = file; 
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

/**
 * Separa una cadena completa ("Juan Carlos Pérez Silva") en Nombres y Apellidos
 */
function prellenarFormulario(nombreCompleto) {
    const partes = (nombreCompleto || "").trim().split(' ');
    const iNombres = document.getElementById('inputNombres');
    const iApellido1 = document.getElementById('inputApellido1');
    const iApellido2 = document.getElementById('inputApellido2');
    
    if(partes.length === 1) {
        iNombres.value = partes[0] || "";
        iApellido1.value = "";
        iApellido2.value = "";
    } else if (partes.length === 2) {
        iNombres.value = partes[0];
        iApellido1.value = partes[1];
        iApellido2.value = "";
    } else if (partes.length >= 3) {
        iApellido2.value = partes.pop(); // Última palabra es apellido2
        iApellido1.value = partes.pop(); // Penúltima es apellido1
        iNombres.value = partes.join(' '); // El resto es nombres
    }
}