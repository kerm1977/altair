/**
 * router.js - Sistema de Navegación SPA
 * Versión Robusta con manejo de errores, carga dinámica y soporte de audio persistente.
 * CORRECCIÓN: Eliminación de home.html y gestión de inercia en reproductor.
 */
const router = {
    
    // Carga scripts JS dinámicamente y asegura que no se dupliquen
    loadScript: (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`✅ Script cargado: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Error cargando script: ${src}`);
                reject(new Error(`No se pudo cargar el script ${src}`));
            };
            
            document.body.appendChild(script);
        });
    },

    // Navegación principal
    navigate: async (routeName) => {
        // MEJORA: home.html no existe, si se llama a 'home' o 'index' vamos directo a goHome()
        if (!routeName || routeName === 'home' || routeName === 'index') {
            router.goHome();
            return;
        }

        console.log(`🧭 Navegando a: ${routeName}`);
        
        const outlet = document.getElementById('router-outlet');
        const mainContainer = document.getElementById('main-app-container');

        // Ocultar menú principal
        if(mainContainer) mainContainer.classList.add('hidden');

        try {
            // Cargar HTML de la vista
            const response = await fetch(`${routeName}.html?v=${Date.now()}`);
            if (!response.ok) throw new Error(`Vista ${routeName} no encontrada`);
            
            const html = await response.text();
            
            // Inyectar en el Outlet
            if (outlet) {
                // Antes de inyectar, si ya hay contenido, nos aseguramos de no romper procesos
                outlet.innerHTML = html;
                outlet.classList.remove('hidden');
            }

            // Cargar el Controlador JS asociado
            try {
                await router.loadScript(`js/${routeName}.js`);
            } catch (scriptErr) {
                console.warn(`Nota: No se encontró script para ${routeName}.`);
            }

            // Inicializar el Controlador
            // El delay de 100ms es vital para que el DOM se asiente y el init no encuentre elementos nulos
            setTimeout(async () => {
                if (window.ViewControllers && window.ViewControllers[routeName] && window.ViewControllers[routeName].init) {
                    console.log(`▶️ Iniciando módulo: ${routeName}`);
                    await window.ViewControllers[routeName].init();
                }
            }, 100);

        } catch (error) {
            console.error("🚨 Error de Navegación:", error);
            router.goHome();
        }
    },

    // Volver al menú principal (Maneja la persistencia de la música)
    goHome: () => {
        console.log("🏠 Volviendo al inicio - Activando modo fondo");
        const outlet = document.getElementById('router-outlet');
        const mainContainer = document.getElementById('main-app-container');
        
        // 1. NOTIFICACIÓN DE FONDO: 
        // Antes de vaciar el HTML, avisamos al player que pase a modo flotante.
        // Esto es lo que evita que la música se detenga al borrar el outlet.
        if (window.ViewControllers && window.ViewControllers.player) {
            if (typeof window.ViewControllers.player.prepareForBackground === 'function') {
                window.ViewControllers.player.prepareForBackground();
            } else if (typeof window.ViewControllers.player.showMiniPlayer === 'function') {
                window.ViewControllers.player.showMiniPlayer();
            }
        }

        if (outlet) {
            // Limpiamos la vista actual para liberar memoria pero el audio ya debe estar en el body.
            outlet.innerHTML = '';
            outlet.classList.add('hidden');
        }
        
        if (mainContainer) {
            mainContainer.classList.remove('hidden');
        }
        
        console.log("✅ Inicio restaurado");
    }
};

// Capturar el botón físico de "Atrás" en Android y el gesto de atrás en navegadores
window.onpopstate = function() {
    router.goHome();
};

// Exponer globalmente
window.router = router;