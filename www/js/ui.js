/**
 * ui.js - Herramientas de Interfaz Globales
 * Maneja notificaciones (toasts) y ventanas modales.
 */
(function() {
    
    const ui = {
        // Notificaciones tipo Toast
        toast: (msg) => {
            const el = document.getElementById('toast');
            if (!el) return;
            el.innerText = msg;
            el.classList.add('opacity-100');
            el.style.transform = 'translateX(-50%) translateY(0)';
            setTimeout(() => {
                el.classList.remove('opacity-100');
                el.style.transform = 'translateX(-50%) translateY(-20px)';
            }, 3000);
        },

        // Ventanas Modales Personalizadas
        modal: (html) => {
            const content = document.getElementById('modal-content');
            const overlay = document.getElementById('modal-overlay');
            if (!content || !overlay) return;
            content.innerHTML = html;
            overlay.style.display = 'flex';
        },

        closeModal: () => {
            const overlay = document.getElementById('modal-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    };

    // Exponer globalmente
    window.ui = ui;

})();