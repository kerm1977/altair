// ============================================================================
// ARCHIVO: www/js/index.js
// RESPONSABILIDAD: SOLO ARRANQUE. (Limpio de código duplicado)
// ============================================================================

window.appToast = window.appToast || null;

window.mostrarNotificacion = function(mensaje, tipo = 'primary') {
    const toastEl = document.getElementById('appToast');
    const toastHeader = document.getElementById('toast-header');
    const toastBody = document.getElementById('toast-message');
    
    if(toastHeader) toastHeader.className = `toast-header text-white bg-${tipo}`;
    if(toastBody) toastBody.innerText = mensaje;
    
    if (!window.appToast && window.bootstrap) {
        window.appToast = new window.bootstrap.Toast(toastEl, { delay: 2500 });
    }
    
    if(window.appToast) {
        window.appToast.show();
    } else {
        toastEl.style.display = 'block';
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
            toastEl.style.display = 'none';
        }, 2500);
    }
};

window.irAtrasGlobal = function() {
    const titleEl = document.getElementById('view-title');
    if(!titleEl) return;
    const t = titleEl.innerText.toLowerCase();
    if (t.includes('edit') || t.includes('usuarios')) window.cargarVista('perfil', 'Mi Perfil');
    else window.cargarVista('inicio', 'Inicio');
};

window.bootApp = async function() {
    if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {                
        document.documentElement.style.setProperty('--android-nav-spacing', '28px');
    }

    if (window.ThemeManager && typeof window.ThemeManager.init === 'function') {
        await window.ThemeManager.init();
    }

    let dbReady = false;
    if (window.sqliteService && typeof window.sqliteService.init === 'function') {
        dbReady = await window.sqliteService.init();
    }

    let usuarioActivo = null;
    if (window.sqliteService && typeof window.sqliteService.getSession === 'function') {
        usuarioActivo = await window.sqliteService.getSession();
    }
    
    requestAnimationFrame(() => {
        if (usuarioActivo && dbReady) {
            window.cargarVista('inicio', 'Inicio');
        } else {
            window.cargarVista('login', 'Login');
        }
    });
};

if (!window.appBooted) {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.bootApp, 10);
    });
    window.appBooted = true;
}