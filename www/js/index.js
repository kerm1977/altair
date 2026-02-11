/**
 * index.js
 * Punto de entrada de la aplicación.
 * Responsabilidad: Iniciar DB, Configurar UI global, Router y PERMISOS.
 */
(function() {
    
    const AppInit = {
        // Estado global básico
        user: null,

        start: async () => {
            console.log("📱 Iniciando TribuPlay...");

            // 0. SOLICITAR PERMISOS NATIVOS (Android)
            // Esto es crítico para poder guardar archivos, usar cámara, etc.
            await AppInit.requestNativePermissions();

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
            if (window.router && window.router.loadScript) {
                try {
                    await window.router.loadScript('js/payments.js');
                    
                    if (window.ViewControllers && window.ViewControllers.payments) {
                        await window.ViewControllers.payments.init();
                    }
                } catch (e) {
                    console.error("Error cargando módulo de pagos:", e);
                }
            }

            // 3. Ocultar pantalla de carga
            document.body.classList.add('loaded');
        },

        // --- GESTIÓN DE PERMISOS ---
        requestNativePermissions: async () => {
            // Solo ejecutar en dispositivo real
            if (!window.Capacitor || !window.Capacitor.isNative) return;

            const { Filesystem, Camera } = window.Capacitor.Plugins;

            try {
                console.log("🛡️ Solicitando Permisos Nativos...");

                // 1. Permisos de Archivos (Para exportar)
                if (Filesystem) {
                    const fsStatus = await Filesystem.checkPermissions();
                    if (fsStatus.publicStorage !== 'granted') {
                        await Filesystem.requestPermissions();
                    }
                }

                // 2. Permisos de Cámara y Galería
                // (Requiere haber instalado @capacitor/camera)
                if (Camera) {
                    const camStatus = await Camera.checkPermissions();
                    
                    // Si falta permiso de Cámara O de Galería (Photos)
                    if (camStatus.camera !== 'granted' || camStatus.photos !== 'granted') {
                        // Pedir ambos
                        await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
                    }
                }

                // Nota: Los permisos de micrófono y contactos requieren plugins específicos
                // y se solicitan usualmente al momento de usar la función, no al inicio.

            } catch (e) {
                console.warn("⚠️ Error gestionando permisos (¿Falta algún plugin?):", e);
            }
        }
    };

    // Exponer globalmente
    window.app = AppInit;

    // Arrancar cuando el navegador esté listo
    window.onload = () => {
        AppInit.start();
    };

})();