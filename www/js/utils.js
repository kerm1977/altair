// ============================================================================
// ⚠️ FRAGMENTO 6: UTILIDADES Y ARRANQUE GLOBAL (js/utils.js)
// ⚠️ SIRVE PARA: Mostrar notificaciones nativas/web y arrancar toda la app 
//                esperando que el motor de base de datos termine de iniciar.
// ============================================================================

// CORRECCIÓN VITAL: Usamos el objeto global 'window' en lugar de 'let' 
// para evitar el error fatal de "redeclaration of let appToast" si la página se recarga.
window.appToastInstance = null;

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
        toastEl.style.display = 'block';
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
            toastEl.style.display = 'none';
        }, 2500);
    }
}

async function bootApp() {
    // Configuración específica para dispositivos Android reales
    if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {                
        document.documentElement.style.setProperty('--android-nav-spacing', '28px');
    }

    // Inicialización del motor de temas (modo oscuro)
    if (window.ThemeManager) {
        await window.ThemeManager.init();
    }

    // Usamos 'window.' para llamar a funciones que están en otros fragmentos (database.js)
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
}

// INICIO DE LA APLICACIÓN: Espera a que el HTML cargue para ejecutar el boot
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(bootApp, 10);
});

// --- EXPORTAR AL ENTORNO GLOBAL ---
// (Eliminamos las exportaciones viejas de index.js para evitar errores)
// Solo exportamos lo que le pertenece a este archivo de utilidades:
window.mostrarNotificacion = mostrarNotificacion;