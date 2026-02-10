/**
 * Controlador para dashboard.html
 */
(function() {
    
    const dashboardController = {
        selectedTech: 'web',

        // 1. INIT: Se llama automáticamente al entrar a la vista
        init: async () => {
            console.log("⚙️ Dashboard cargado");
            
            // Cargar configuración guardada
            const currentTech = localStorage.getItem('miApp_tech') || 'web';
            dashboardController.renderTechSelection(currentTech);
            
            // Cargar estado del botón refresh
            const showRefresh = localStorage.getItem('miApp_showRefresh') === 'true';
            const toggle = document.getElementById('refresh-toggle');
            if(toggle) toggle.checked = showRefresh;
        },

        // Métodos específicos de esta vista
        renderTechSelection: (techName) => {
            dashboardController.selectedTech = techName;
            
            // Actualizar UI
            document.querySelectorAll('.tech-card').forEach(el => el.classList.remove('active'));
            const card = document.getElementById(`card-${techName}`);
            if(card) card.classList.add('active');
        },

        selectTech: (techName) => {
            if(techName === 'cloud') {
                if(window.ui) window.ui.toast('Próximamente Cloud');
                return;
            }
            dashboardController.renderTechSelection(techName);
        },

        toggleRefresh: (e) => {
            const isChecked = e.target.checked;
            localStorage.setItem('miApp_showRefresh', isChecked);
            
            if(window.ui) window.ui.toast(isChecked ? "Botón Activado" : "Botón Oculto");
        },

        saveChanges: () => {
            localStorage.setItem('miApp_tech', dashboardController.selectedTech);
            
            if(window.ui) window.ui.toast("Configuración Guardada");
            
            // Recargar para aplicar cambios de DB
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        },

        // 2. DESTROY: Limpieza si fuera necesaria
        destroy: () => {
            console.log("👋 Saliendo de dashboard");
        }
    };

    // REGISTRO DEL CONTROLADOR (Debe coincidir con el nombre del archivo HTML)
    window.ViewControllers.dashboard = dashboardController;

})();