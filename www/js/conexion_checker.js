// ==============================================================================
// ARCHIVO: js/conexion_checker.js
// ROL: Comprobador visual en TIEMPO REAL del estado de conexión (PocketBase)
// ==============================================================================

let conexionInterval = null;
let verificando = false; // Bandera para evitar que las peticiones choquen entre sí

// La función ahora acepta un parámetro "silencioso" para no hacer parpadear la UI
async function checkDatabaseConnection(modoSilencioso = false) {
    if (verificando) return; // Si ya está buscando, no lanzar otra búsqueda paralela
    verificando = true;

    const statusIcon = document.getElementById('db-status-icon');
    const statusText = document.getElementById('db-status-text');
    
    if (!statusIcon || !statusText) {
        verificando = false;
        return;
    }

    // Solo mostramos el estado "Verificando..." (amarillo) si NO es silencioso
    if (!modoSilencioso) {
        statusIcon.className = 'bi bi-circle-fill text-warning me-1 spinner-grow spinner-grow-sm';
        statusText.textContent = 'Verificando conexión...';
        statusText.className = 'text-secondary fw-bold';
    }

    try {
        // Cronómetro de seguridad ampliado a 8 segundos. Los túneles a veces tardan en despertar.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Usamos la URL que definiste en api_db.js
        const baseUrl = typeof POCKETBASE_URL !== 'undefined' ? POCKETBASE_URL : 'http://127.0.0.1:8090/api';
        
        // Agregamos un "cache-buster" (?t=...) para que el celular no recicle respuestas viejas
        const healthUrl = `${baseUrl}/health?t=${new Date().getTime()}`;

        const response = await fetch(healthUrl, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId); // Se cancela el aborto porque sí respondió

        if (response.ok) {
            // 🟢 CONECTADO (Actualiza la UI en vivo)
            statusIcon.className = 'bi bi-circle-fill text-success me-1';
            statusText.textContent = 'Base de datos en línea';
            statusText.className = 'text-success fw-bold';
        } else {
            throw new Error(`El servidor rechazó la conexión (Status: ${response.status})`);
        }
    } catch (error) {
        console.warn("⚠️ Fallo en el latido de conexión:", error.message);
        // 🔴 DESCONECTADO (Se cayó la red o se apagó Tailscale)
        statusIcon.className = 'bi bi-circle-fill text-danger me-1';
        statusText.textContent = 'Sin conexión a la BD';
        statusText.className = 'text-danger fw-bold';
    } finally {
        verificando = false; // Liberar bandera
    }
}

// -------------------------------------------------------------
// MOTOR DE TIEMPO REAL (HEARTBEAT)
// -------------------------------------------------------------
function iniciarMonitorConexion() {
    // 1. Chequeo inicial con animación (No silencioso)
    checkDatabaseConnection(false);
    
    // 2. Limpiar cualquier monitor previo por seguridad
    if (conexionInterval) clearInterval(conexionInterval);
    
    // 3. Crear el latido: Cada 5 segundos revisa silenciosamente
    conexionInterval = setInterval(() => {
        checkDatabaseConnection(true); // Silencioso = true
    }, 5000);
}

// Escuchar cuando el usuario abre el modal (Fuerza una revisión animada)
const settingsModalEl = document.getElementById('settingsModal');
if (settingsModalEl) {
    settingsModalEl.addEventListener('show.bs.modal', () => {
        checkDatabaseConnection(false);
    });
}

// Iniciar cuando arranca la página (Navegador)
document.addEventListener('DOMContentLoaded', iniciarMonitorConexion);

// Iniciar cuando la App de Android despierta (sale del segundo plano)
document.addEventListener('resume', () => {
    checkDatabaseConnection(false); // Revisión animada instantánea al volver a la app
}, false);