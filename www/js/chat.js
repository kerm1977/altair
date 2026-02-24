/**
 * chat.js - Lógica para el Enjambre de Chat Privado (1 a 1)
 */

// 1. Apuntamos al dominio correcto y a la base de datos de tu app (ej: alatir)
const BASE_API = "https://kenth1977.pythonanywhere.com/api/alatir";

// Función de ayuda para obtener el PIN del usuario actual desde localStorage
function obtenerMiPin() {
    let pin = localStorage.getItem('tribu_pin');
    if (!pin) {
        try {
            const u = JSON.parse(localStorage.getItem('usuarioActual'));
            pin = u ? u.pin : null;
        } catch(e) {}
    }
    return pin;
}

function obtenerMiNombre() {
    let nombre = localStorage.getItem('tribu_nombre');
    if (!nombre) {
        try {
            const u = JSON.parse(localStorage.getItem('usuarioActual'));
            nombre = u ? u.nombre : 'Usuario';
        } catch(e) {}
    }
    return nombre || 'Usuario';
}


window.ChatManager = {
    chatActivoPin: null,   // Guarda el PIN de la persona con la que estamos hablando
    chatActivoNombre: null,

    // 1. OBTENER LISTA DE CONTACTOS
    async obtenerContactos() {
        const miPin = obtenerMiPin();
        if (!miPin) return [];
        try {
            const res = await fetch(`${BASE_API}/contactos/${miPin}`);
            const data = await res.json();
            return data.contactos || [];
        } catch (e) { return []; }
    },

    // 2. OBTENER MENSAJES DE UN CHAT PRIVADO
    async obtenerMensajesPrivados() {
        const miPin = obtenerMiPin();
        if (!miPin || !this.chatActivoPin) return [];
        try {
            const res = await fetch(`${BASE_API}/chat/${miPin}/${this.chatActivoPin}`);
            return await res.json();
        } catch (e) { return []; }
    },

    // 3. ENVIAR MENSAJE
    async enviarMensaje(texto, archivo = null) {
        const miNombre = obtenerMiNombre();
        const miPin = obtenerMiPin();

        if (!miPin || !this.chatActivoPin) return { error: "No hay chat activo" };

        const formData = new FormData();
        formData.append('nombre', miNombre);
        formData.append('sender_pin', miPin);
        formData.append('receiver_pin', this.chatActivoPin); // A quién va dirigido
        formData.append('texto', texto);
        if (archivo) formData.append('file', archivo);

        try {
            const res = await fetch(`${BASE_API}/chat/enviar`, {
                method: 'POST',
                body: formData // Fetch detecta FormData y pone los headers correctos solo
            });
            return await res.json();
        } catch (e) { 
            console.error("Error en envío:", e);
            return { error: "Fallo de conexión" }; 
        }
    },

    // 4. PINTAR LA LISTA DE CONTACTOS EN EL HTML
    renderizarContactos(contactos) {
        const container = document.getElementById('chat-contacts');
        if (!container) return;

        let html = '';
        contactos.forEach(c => {
            const inicial = c.nombre ? c.nombre.charAt(0).toUpperCase() : '?';
            const badge = c.no_leidos > 0 
                ? `<span class="badge bg-danger rounded-pill shadow-sm">${c.no_leidos}</span>` 
                : '';

            html += `
            <div class="list-group-item d-flex align-items-center p-3 border-0 border-bottom" style="cursor:pointer; transition: background 0.2s;" onclick="window.abrirChatPrivado('${c.pin}', '${c.nombre.replace(/'/g, "\\'")}')" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
                <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 45px; height: 45px; font-size: 1.2rem;">
                    ${inicial}
                </div>
                <div class="ms-3 flex-grow-1">
                    <p class="mb-0 fw-bold text-dark">${c.nombre}</p>
                    <p class="mb-0 text-muted small">PIN: ***${c.pin ? c.pin.slice(-3) : '---'}</p>
                </div>
                <div>${badge}</div>
            </div>`;
        });
        
        container.innerHTML = html || '<p class="text-center text-muted p-5">No hay compañeros registrados aún.</p>';
    },

    // 5. PINTAR LOS MENSAJES (SISTEMA ANTI-PARPADEO Y DOBLE CHECK)
    renderizarMensajes(mensajes, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !Array.isArray(mensajes)) return;

        const miPin = obtenerMiPin();
        let html = '';

        mensajes.forEach(m => {
            const esMio = (m.sender_pin === miPin);
            
            // Lógica del Doble Check
            let readIcon = '';
            if (esMio) {
                // Si es mío, reviso si el otro lo leyó
                readIcon = m.is_read 
                    ? '<i class="bi bi-check2-all text-info ms-1" style="font-size:1.1rem;"></i>' // Azul
                    : '<i class="bi bi-check2 text-secondary ms-1" style="font-size:1.1rem;"></i>'; // Gris
            }

            // Lógica de Archivos Adjuntos
            let adjuntoHtml = '';
            if (m.file_path) {
                const fullUrl = `https://kenth1977.pythonanywhere.com${m.file_path}`;
                if (m.file_type === 'image') {
                    adjuntoHtml = `<img src="${fullUrl}" class="img-fluid rounded-3 mb-2 shadow-sm" style="max-height: 200px; cursor: pointer;" onclick="window.open(this.src)">`;
                } else if (m.file_type === 'audio') {
                    adjuntoHtml = `<audio controls class="w-100 mb-2" style="height: 35px;"><source src="${fullUrl}"></audio>`;
                } else {
                    adjuntoHtml = `<a href="${fullUrl}" target="_blank" class="btn btn-sm btn-light border w-100 mb-2 text-start"><i class="bi bi-file-earmark-text"></i> Ver Documento</a>`;
                }
            }

            html += `
                <div class="d-flex flex-column ${esMio ? 'align-items-end' : 'align-items-start'} mb-3">
                    <div class="p-3 rounded-4 shadow-sm position-relative" style="max-width: 85%; min-width: 120px; ${esMio ? 'background-color: #0d6efd; color: white;' : 'background-color: white; border: 1px solid #dee2e6; color: #212529;'}">
                        ${adjuntoHtml}
                        <p class="mb-0 text-break" style="font-size: 0.95rem; line-height: 1.3;">${m.texto || ''}</p>
                        
                        <div class="text-end mt-1 d-flex align-items-center justify-content-end" style="margin-bottom: -5px;">
                            <small class="${esMio ? 'text-white-50' : 'text-muted'}" style="font-size: 0.65rem;">${m.fecha || ''}</small>
                            ${readIcon}
                        </div>
                    </div>
                </div>`;
        });

        const newContent = html || '<div class="text-center text-muted py-5"><i class="bi bi-chat-dots fs-1 d-block mb-2"></i>Inicia la conversación.</div>';

        // --- SISTEMA ANTI-PARPADEO ---
        if (container.dataset.lastContent !== newContent) {
            const estabaAlFinal = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
            
            container.innerHTML = newContent;
            container.dataset.lastContent = newContent; 
            
            if (estabaAlFinal) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }
};

// ============================================================================
// FUNCIONES DE NAVEGACIÓN DENTRO DEL MODAL (Llamadas desde chat.html)
// ============================================================================

window.abrirChatPrivado = function(pin, nombre) {
    window.ChatManager.chatActivoPin = pin;
    window.ChatManager.chatActivoNombre = nombre;
    
    // Cambiar Título y visibilidad
    const titleEl = document.getElementById('chat-title');
    if(titleEl) titleEl.innerText = nombre;
    
    document.getElementById('vista-contactos').classList.add('d-none');
    document.getElementById('vista-chat').classList.remove('d-none');
    document.getElementById('vista-chat').classList.add('d-flex');
    document.getElementById('btn-chat-volver').classList.remove('d-none');
    
    // Limpiar caché visual previa para forzar scroll al entrar a un chat nuevo
    const chatWin = document.getElementById('chat-window');
    if(chatWin) {
        chatWin.innerHTML = '';
        chatWin.dataset.lastContent = '';
    }
    
    // Refrescar inmediatamente
    if (window.refrescarChat) window.refrescarChat();
};

window.volverAContactos = function() {
    window.ChatManager.chatActivoPin = null;
    
    // Cambiar Título y visibilidad
    const titleEl = document.getElementById('chat-title');
    if(titleEl) titleEl.innerText = 'Mensajes';
    
    document.getElementById('vista-chat').classList.add('d-none');
    document.getElementById('vista-chat').classList.remove('d-flex');
    document.getElementById('vista-contactos').classList.remove('d-none');
    document.getElementById('btn-chat-volver').classList.add('d-none');
    
    if (window.refrescarChat) window.refrescarChat();
};