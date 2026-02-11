/**
 * router.js - Sistema de Navegación SPA
 * Versión Robusta con manejo de errores y carga dinámica.
 */
const router = {
    
    // Carga scripts JS dinámicamente y asegura que no se dupliquen
    loadScript: (src) => {
        return new Promise((resolve, reject) => {
            // Si ya existe, asumimos cargado
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
        console.log(`🧭 Navegando a: ${routeName}`);
        
        const outlet = document.getElementById('router-outlet');
        const mainContainer = document.getElementById('main-app-container');

        // 1. Mostrar indicador de carga (opcional, por ahora solo ocultamos el main)
        if(mainContainer) mainContainer.classList.add('hidden');

        try {
            // 2. Cargar HTML de la vista
            // Usamos ?v=... para cache busting simple durante desarrollo
            const response = await fetch(`${routeName}.html?v=${Date.now()}`);
            if (!response.ok) throw new Error(`Vista ${routeName} no encontrada (404)`);
            
            const html = await response.text();
            
            // 3. Inyectar en el Outlet
            if (outlet) {
                outlet.innerHTML = html;
                outlet.classList.remove('hidden');
            }

            // 4. Cargar el Controlador JS asociado (ej: js/users.js, js/player.js)
            // Solo intentamos cargar si no es una vista estática pura
            if (routeName !== 'home' && routeName !== 'index') {
                try {
                    await router.loadScript(`js/${routeName}.js`);
                } catch (scriptErr) {
                    console.warn(`Nota: No se encontró script para ${routeName}, asumiendo vista estática.`);
                }
            }

            // 5. Inicializar el Controlador (Si existe y tiene init)
            // Esperamos un pequeño tick para asegurar que el DOM se pintó
            setTimeout(async () => {
                if (window.ViewControllers && window.ViewControllers[routeName] && window.ViewControllers[routeName].init) {
                    console.log(`▶️ Iniciando controlador: ${routeName}`);
                    await window.ViewControllers[routeName].init();
                }
            }, 50);

        } catch (error) {
            console.error("🚨 Error de Navegación:", error);
            if(window.ui) window.ui.toast("Error cargando sección: " + routeName);
            
            // Restaurar la vista principal si falla
            router.goHome();
        }
    },

    // Volver al menú principal (Home/Index)
    goHome: () => {
        const outlet = document.getElementById('router-outlet');
        const mainContainer = document.getElementById('main-app-container');
        
        // Limpiar outlet y mostrar container principal
        if (outlet) outlet.innerHTML = '';
        if (mainContainer) mainContainer.classList.remove('hidden');
        
        // Detener música si venimos del player
        if (window.ViewControllers && window.ViewControllers.player && window.ViewControllers.player.stop) {
            window.ViewControllers.player.stop();
        }

        console.log("🏠 Volviendo al inicio");
    }
};

// Exponer globalmente
window.router = router;