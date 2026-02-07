
// EXPOSICIÓN GLOBAL
window.app = app;
window.ui = ui;
window.validators = validators;
window.router = router;

// Arranque
window.onload = async () => {
    // Protección contra fallos críticos de inicio
    try {
        // 1. Inicializar DB (Si existe)
        // Agregamos un Timeout de seguridad de 1 segundo para evitar el "Spin of death"
        if(typeof db !== 'undefined' && db.init) {
            const dbTimeout = new Promise((_, reject) => setTimeout(() => reject("DB Timeout"), 1000));
            await Promise.race([db.init(), dbTimeout]).catch(err => {
                console.warn("Advertencia: DB lenta o fallo", err);
            });
        }
        
        // 2. Configurar herramientas
        if (app.setupDevTools) app.setupDevTools();
        if (ui.updateRefreshButton) ui.updateRefreshButton(app.showRefresh);

        // 3. Enrutamiento
        const saved = localStorage.getItem('miApp_current');
        if(saved) {
            try {
                app.user = JSON.parse(saved);
                router.navigate('home');
            } catch (e) {
                // Si el JSON está corrupto
                localStorage.removeItem('miApp_current');
                router.navigate('login');
            }
        } else {
            router.navigate('login');
        }

    } catch (e) {
        console.error("Error fatal en arranque:", e);
        // Intento final de mostrar algo
        const outlet = document.getElementById('router-outlet');
        if(outlet) outlet.innerHTML = '<div class="p-8 text-center"><h2 class="text-red-500 font-bold">Error de Carga</h2><p>Revisa la consola.</p></div>';
    }
};