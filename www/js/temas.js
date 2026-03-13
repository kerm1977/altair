// =========================================================
// TEMAS.JS - CONTROLADOR DE MODO OSCURO NATIVO (Blindado)
// =========================================================

const ThemeManager = {
    init: async function() {
        // 1. Cargar preferencia guardada o usar 'light' por defecto
        const savedTheme = localStorage.getItem('theme') || 'light';
        await this.setTheme(savedTheme);

        // 2. Delegación de Eventos Pura (Event Delegation)
        // Atrapamos el evento a nivel de documento para no perderlo cuando la vista cambia
        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'switch-modo-oscuro') {
                this.toggle(e.target.checked);
            }
        });
        
        // 3. Sincronización visual cuando se inyecta la vista
        // Creamos un observador para detectar cuándo el switch aparece en pantalla
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.addedNodes.length) {
                    const switchEl = document.getElementById('switch-modo-oscuro');
                    if (switchEl) {
                        switchEl.checked = (localStorage.getItem('theme') === 'dark');
                    }
                }
            }
        });
        
        // Empezamos a observar el contenedor principal de la app
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            observer.observe(appRoot, { childList: true, subtree: true });
        } else {
             // Fallback por si app-root aún no existe
             document.addEventListener('DOMContentLoaded', () => {
                 const root = document.getElementById('app-root');
                 if(root) observer.observe(root, { childList: true, subtree: true });
             });
        }
    },

    toggle: async function(isDark) {
        const newTheme = isDark ? 'dark' : 'light';
        await this.setTheme(newTheme);
    },

    setTheme: async function(theme) {
        // 1. Guardar localmente
        localStorage.setItem('theme', theme);
        
        // 2. Aplicar al DOM (Bootstrap 5.3 detecta esto)
        document.documentElement.setAttribute('data-bs-theme', theme);
        
        // 3. Modificar la UI Nativa de Android/iOS (Barra de estado)
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            try {
                const { StatusBar, Style } = capacitorExports;
                
                await StatusBar.setOverlaysWebView({ overlay: false });

                if (theme === 'dark') {
                    // Modo oscuro: Fondo oscuro, iconos claros
                    await StatusBar.setBackgroundColor({ color: '#1e1e1e' });
                    // El "Style.Dark" significa *fondo oscuro*, por lo que los iconos se ponen blancos
                    await StatusBar.setStyle({ style: Style.Dark }); 
                } else {
                    // Modo claro: Usamos tu color primary azul, iconos claros
                    await StatusBar.setBackgroundColor({ color: '#0d6efd' }); 
                    await StatusBar.setStyle({ style: Style.Dark }); 
                }
            } catch(e) {
                console.log("[ThemeManager] StatusBar no soportado o en fallback Web", e);
            }
        }
    }
};

// Exponer globalmente INMEDIATAMENTE
window.ThemeManager = ThemeManager;

// Auto-inicialización instantánea si el DOM ya estaba listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}