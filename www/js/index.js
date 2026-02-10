/**
 * index.js
 * Punto de entrada de la aplicación.
 * Responsabilidad: Iniciar DB, Configurar UI global y Router.
 */
(function() {
    
    const AppInit = {
        // Estado global básico
        user: null,

        start: async () => {
            console.log("📱 Iniciando TribuPlay...");

            // 1. Inicializar Base de Datos (Si existe db.js)
            if (typeof db !== 'undefined') {
                try {
                    await db.init();
                    console.log("✅ DB Inicializada");
                } catch (e) {
                    console.error("❌ Error DB:", e);
                    if(window.ui) window.ui.toast("Error de Base de Datos");
                }
            }

            // 2. Cargar Módulo de Pagos (Si estamos en la vista de pagos)
            // Esto asegura que paymentsApp exista antes de que el usuario haga click
            if (window.router && window.router.loadScript) {
                try {
                    // Cargamos el cerebro de pagos
                    await window.router.loadScript('js/payments.js');
                    
                    // Inicializamos el controlador si existe
                    if (window.ViewControllers && window.ViewControllers.payments) {
                        await window.ViewControllers.payments.init();
                    }
                } catch (e) {
                    console.error("Error cargando módulo de pagos:", e);
                }
            }

            // 3. Ocultar pantalla de carga (si la hubiera) y mostrar la app
            document.body.classList.add('loaded');
        }
    };

    // Exponer globalmente
    window.app = AppInit;

    // Arrancar cuando el navegador esté listo
    window.onload = () => {
        AppInit.start();
    };

})();