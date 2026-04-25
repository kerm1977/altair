// ==============================================================================
// ARCHIVO: js/conexion_checker.js
// ROL: Comprobador visual de estado de conexión al backend (PocketBase)
// ==============================================================================

async function checkDatabaseConnection() {
    const statusIcon = document.getElementById('db-status-icon');
    const statusText = document.getElementById('db-status-text');
    const badge = document.getElementById('db-status-badge');
    
    if (!statusIcon || !statusText) return;

    try {
        // Creamos un cronómetro: Si no responde en 3 segundos, abortamos (no se queda pegado)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Usamos el endpoint de salud oficial de PocketBase (/api/health)
        // POCKETBASE_URL debe venir de tu api_db.js
        const baseUrl = typeof POCKETBASE_URL !== 'undefined' ? POCKETBASE_URL : 'http://127.0.0.1:8090/api';
        const healthUrl = `${baseUrl}/health`;

        const response = await fetch(healthUrl, {
            method: 'GET',
            signal: controller.signal // Enlazamos el cronómetro a la petición
        });

        clearTimeout(timeoutId); // Apagamos el cronómetro si respondió a tiempo

        if (response.ok) {
            // 🟢 CONECTADO
            statusIcon.className = 'bi bi-circle-fill text-success me-1';
            statusText.textContent = 'Base de datos en línea';
            statusText.className = 'text-success fw-bold';
        } else {
            throw new Error('Respuesta del servidor fallida');
        }
    } catch (error) {
        // 🔴 DESCONECTADO (Sin internet o servidor apagado)
        statusIcon.className = 'bi bi-circle-fill text-danger me-1';
        statusText.textContent = 'Sin conexión a la BD';
        statusText.className = 'text-danger fw-bold';
    }
}

// Escuchar cada vez que el usuario abra el modal de ajustes para hacer un ping fresco
const settingsModalEl = document.getElementById('settingsModal');
if (settingsModalEl) {
    settingsModalEl.addEventListener('show.bs.modal', () => {
        const statusIcon = document.getElementById('db-status-icon');
        const statusText = document.getElementById('db-status-text');
        
        // Poner estado de "Cargando"
        statusIcon.className = 'bi bi-circle-fill text-warning me-1 spinner-grow spinner-grow-sm';
        statusText.textContent = 'Verificando conexión...';
        statusText.className = 'text-secondary fw-bold';
        
        checkDatabaseConnection();
    });
}

// Ejecutar la comprobación inicial apenas cargue la app
document.addEventListener('DOMContentLoaded', checkDatabaseConnection);