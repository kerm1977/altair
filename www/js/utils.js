// ============================================================================
// ⚠️ FRAGMENTO 6: UTILIDADES Y ARRANQUE GLOBAL (js/utils.js)
// ⚠️ SIRVE PARA: Mostrar notificaciones nativas/web y arrancar toda la app 
//                esperando que el motor de base de datos termine de iniciar.
//                *INCLUYE DELEGACIÓN DE EVENTOS PARA EL OJO DEL LOGIN*
// ============================================================================

// CORRECCIÓN VITAL: Usamos el objeto global 'window' en lugar de 'let' 
// para evitar el error fatal de "redeclaration of let appToast" si la página se recarga.
window.appToastInstance = null;

/**
 * Muestra un mensaje flotante (Toast) en la parte superior o inferior.
 * @param {string} mensaje - El texto a mostrar.
 * @param {string} tipo - El color de Bootstrap (success, danger, info, etc).
 */
function mostrarNotificacion(mensaje, tipo = 'primary') {
    const toastEl = document.getElementById('appToast');
    const toastHeader = document.getElementById('toast-header');
    const toastBody = document.getElementById('toast-message');
    
    if(toastHeader) toastHeader.className = `toast-header text-white bg-${tipo}`;
    if(toastBody) toastBody.innerText = mensaje;
    
    // Usamos la variable global segura
    if (!window.appToastInstance && window.bootstrap) {
        window.appToastInstance = new window.bootstrap.Toast(toastEl, { delay: 2500 });
    }
    
    if(window.appToastInstance) {
        window.appToastInstance.show();
    } else {
        // Fallback visual si Bootstrap aún no ha cargado
        if (toastEl) {
            toastEl.style.display = 'block';
            toastEl.classList.add('show');
            setTimeout(() => {
                toastEl.classList.remove('show');
                toastEl.style.display = 'none';
            }, 2500);
        }
    }
}

/**
 * Función que orquestra el encendido de la aplicación.
 * Prepara el motor nativo, los temas y carga la vista inicial.
 */
async function bootApp() {
    // Configuración específica para dispositivos Android reales
    if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {                
        document.documentElement.style.setProperty('--android-nav-spacing', '28px');
    }

    // Inicialización del motor de temas (modo oscuro)
    if (window.ThemeManager) {
        await window.ThemeManager.init();
    }

    // Verificamos que el servicio de base de datos exista antes de iniciar
    if (window.sqliteService) {
        const dbReady = await window.sqliteService.init();
        const usuarioActivo = await window.sqliteService.getSession();
        
        requestAnimationFrame(() => {
            // Enrutamiento inicial dependiendo de si hay sesión activa
            if (usuarioActivo && dbReady) {
                window.cargarVista('inicio', 'Inicio');
            } else {
                window.cargarVista('login', 'Login');
            }
        });
    } else {
        console.error("[Boot] Error: sqliteService no encontrado en el objeto window.");
    }
}

// ============================================================================
// 🛠️ DELEGACIÓN DE EVENTOS GLOBAL (Blindado contra cambios de vista)
// ============================================================================
document.addEventListener('click', (e) => {
    // 1. Lógica del "Ojito" para ver contraseñas
    // Buscamos si el clic fue en un botón con la clase de toggle o el icono dentro de él
    const btnToggle = e.target.closest('.btn-toggle-password') || 
                      (e.target.classList.contains('bi-eye') || e.target.classList.contains('bi-eye-slash') ? e.target.parentElement : null);

    if (btnToggle) {
        // Buscamos el input de contraseña que está dentro del mismo grupo (Input Group de Bootstrap)
        const parent = btnToggle.closest('.input-group') || btnToggle.parentElement;
        const input = parent.querySelector('input');
        const icon = btnToggle.querySelector('i');

        if (input && icon) {
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            }
        }
    }
});

// INICIO DE LA APLICACIÓN: Espera a que el HTML cargue para ejecutar el boot
window.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que todos los scripts carguen sus funciones en 'window'
    setTimeout(bootApp, 15);
});

// --- EXPORTAR AL ENTORNO GLOBAL ---
window.mostrarNotificacion = mostrarNotificacion;