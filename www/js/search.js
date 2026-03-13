// =========================================================
// SEARCH.JS - CONTROLADOR DE BÚSQUEDA EN VIVO (Autónomo)
// =========================================================

const SearchManager = {
    // Variable para manejar el "Debounce" (evitar saturar la DB)
    timeoutId: null,

    init: function() {
        // Delegación de Eventos Pura: Escuchamos el evento 'input' en toda la app
        // Así no importa si la vista se recarga, nunca perderemos el enganche.
        document.addEventListener('input', (e) => {
            // Detectamos el buscador por su ID o por su Placeholder (Fallback seguro)
            if (e.target && (e.target.id === 'buscador-usuarios' || (e.target.placeholder && e.target.placeholder.includes('Buscar usuario')))) {
                const tbody = document.getElementById('lista-usuarios-admin');
                if (tbody) {
                    this.buscar(e.target.value.trim(), tbody);
                }
            }
        });
    },

    /**
     * Función principal para orquestar la búsqueda
     */
    buscar: function(termino, tbody) {
        // Limpiamos el timeout anterior si el usuario teclea rápido
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Si el buscador está vacío, restauramos toda la tabla inmediatamente
        if (!termino || termino === '') {
            this.ejecutarBusqueda('', tbody);
            return;
        }

        // Mostrar un pequeño feedback visual de "Buscando..."
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-primary py-4"><div class="spinner-border spinner-border-sm me-2"></div>Buscando coincidencias...</td></tr>';

        // Esperamos 300ms después de que deje de escribir para consultar SQLite (Rendimiento Extremo)
        this.timeoutId = setTimeout(() => {
            this.ejecutarBusqueda(termino, tbody);
        }, 300);
    },

    /**
     * Función interna que interactúa con la BD y repinta la UI
     */
    ejecutarBusqueda: async function(termino, tbody) {
        try {
            let resultados = [];

            // 1. Obtener datos (filtrados o completos)
            if (termino && termino !== '') {
                if (window.sqliteService) {
                    resultados = await window.sqliteService.buscarUsuarios(termino);
                } else {
                    console.error("[SearchManager] Error: sqliteService no encontrado.");
                    return;
                }
            } else {
                if (window.sqliteService) {
                    resultados = await window.sqliteService.getUsuarios();
                }
            }

            // 2. Dibujar resultados usando la función del index.js
            if (window.renderizarUsuarios) {
                window.renderizarUsuarios(resultados, tbody);
                
                // 3. Manejar el caso de "Cero Resultados" de forma amigable
                if (resultados.length === 0) {
                    requestAnimationFrame(() => {
                        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4"><i class="bi bi-search me-2"></i>No se encontraron resultados para "<b>${termino}</b>"</td></tr>`;
                    });
                }
            } else {
                console.error("[SearchManager] Error: renderizarUsuarios no expuesto en window.");
            }

        } catch (error) {
            console.error("[SearchManager] Error en la búsqueda:", error);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error al consultar la base de datos</td></tr>';
            }
        }
    }
};

// Exponer el controlador globalmente
window.SearchManager = SearchManager;

// Auto-inicialización instantánea
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SearchManager.init());
} else {
    SearchManager.init();
}