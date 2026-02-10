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
            // 2. Cargar el HTML de la vista (Cache busting para evitar versiones viejas)
            const htmlResponse = await fetch(`${routeName}.html?v=${Date.now()}`);
            
            if (!htmlResponse.ok) {
                throw new Error(`Archivo ${routeName}.html no encontrado (${htmlResponse.status})`);
            }
            
            const htmlContent = await htmlResponse.text();

            // 3. Inyectar HTML en el outlet
            if (outlet) {
                outlet.innerHTML = htmlContent;
                outlet.classList.remove('hidden');
            }

            // 4. Cargar el Controlador JS asociado (ej: js/users.js)
            await router.loadScript(`js/${routeName}.js`);

            // 5. Inicializar el Controlador (Si existe y tiene init)
            // Esperamos un pequeño tick para asegurar que el DOM se pintó
            setTimeout(async () => {
                if (window.ViewControllers && window.ViewControllers[routeName] && window.ViewControllers[routeName].init) {
                    console.log(`▶️ Iniciando controlador: ${routeName}`);
                    await window.ViewControllers[routeName].init();
                } else {
                    console.warn(`⚠️ Controlador ${routeName} no encontrado o sin método init()`);
                }
            }, 50);

        } catch (error) {
            console.error("🚨 Error de Navegación:", error);
            alert("Error cargando la sección: " + error.message);
            
            // Restaurar la vista principal si falla
            router.goHome();
        }
    },

    // Volver al menú principal
    goHome: () => {
        const outlet = document.getElementById('router-outlet');
        const mainContainer = document.getElementById('main-app-container');
        
        // Limpiar outlet y mostrar home
        if (outlet) outlet.innerHTML = '';
        if (mainContainer) mainContainer.classList.remove('hidden');
        
        console.log("🏠 Volviendo al inicio");
    }
};

// Exponer globalmente
window.router = router;