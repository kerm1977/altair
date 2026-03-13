// ============================================================================
// ⚠️ FRAGMENTO 7: GESTOR DE RESPALDOS Y RESETEO (js/adminDb.js)
// ⚠️ SIRVE PARA: Validar al superusuario, crear respaldos automáticos, 
//                cargar bases de datos (.json y .db) y ejecutar el reseteo en 3 pasos.
// ============================================================================
const AdminDBManager = {
    pasoActual: 0,

    init: function() {
        const observer = new MutationObserver(async (mutations) => {
            const adminZone = document.getElementById('admin-db-controls');
            if (adminZone && adminZone.classList.contains('d-none')) {
                const user = await window.sqliteService.getSession();
                if (user && user.rol === 'superusuario') {
                    adminZone.classList.remove('d-none');
                }
            }
        });
        
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            observer.observe(appRoot, { childList: true, subtree: true });
        }
    },

    // ---------------------------------------------------------
    // 1. RESPALDO Y CARGA SIMPLE (JSON Visible)
    // ---------------------------------------------------------
    respaldarBD: async function() {
        try {
            window.mostrarNotificacion("Compilando JSON...", "info");
            const usuarios = await window.sqliteService.getUsuarios();
            
            const data = JSON.stringify(usuarios, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `Usuarios_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            window.mostrarNotificacion("JSON creado y descargado", "success");
        } catch(e) {
            window.mostrarNotificacion("Error al respaldar el JSON", "danger");
            console.error(e);
        }
    },

    cargarBD: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const usuariosJson = JSON.parse(e.target.result);
                if (!Array.isArray(usuariosJson)) throw new Error("Formato inválido");
                
                let count = 0;
                if (!window.sqliteService.isWeb && window.sqliteService.db) {
                    for (let u of usuariosJson) {
                        const check = await window.sqliteService.db.query("SELECT id FROM usuarios WHERE email = ?", [u.email]);
                        if (check.values && check.values.length === 0) {
                            await window.sqliteService.db.run(
                                "INSERT INTO usuarios (nombre, email, password, telefono, fecha_nacimiento, id_nacional, rol, estado, foto_perfil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                [u.nombre, u.email, u.password, u.telefono, u.fecha_nacimiento, u.id_nacional, u.rol, u.estado, u.foto_perfil] 
                            );
                            count++;
                        }
                    }
                } else {
                    localStorage.setItem("mock_db_usuarios", JSON.stringify(usuariosJson));
                    count = usuariosJson.length;
                }
                
                window.mostrarNotificacion(`Importación JSON: ${count} restaurados.`, "success");
            } catch(err) {
                window.mostrarNotificacion("Error: JSON dañado o no compatible", "danger");
                console.error(err);
            }
            event.target.value = ''; 
        };
        reader.readAsText(file);
    },

    // ---------------------------------------------------------
    // 2. RESPALDO Y CARGA PROFUNDA (.DB OFUSCADO Y PROTEGIDO)
    // ---------------------------------------------------------
    respaldarBDCompleta: async function() {
        try {
            window.mostrarNotificacion("Generando cifrado profundo...", "info");
            const usuarios = await window.sqliteService.getUsuarios();
            
            const fullDbData = {
                metadata: {
                    format: "motor_app_db_v1",
                    timestamp: new Date().toISOString(),
                    engine: "sqlite_native_and_web"
                },
                tables: {
                    usuarios: usuarios
                }
            };

            const jsonString = JSON.stringify(fullDbData);
            
            // CIFRADO BINARIO LIGERO (Soporta imágenes inmensas sin colapsar)
            const textEncoder = new TextEncoder();
            const bytes = textEncoder.encode(jsonString);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = bytes[i] ^ 0x55; // Ofuscación XOR
            }
            
            // Descargamos el binario crudo
            const blob = new Blob([bytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `Motor_Completo_${date}.db`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            window.mostrarNotificacion("Respaldo .DB descargado.", "success");
        } catch(e) {
            window.mostrarNotificacion("Error crítico al crear el .db", "danger");
            console.error("[AdminDB] Fallo al compilar base de datos: ", e);
        }
    },

    cargarBDCompleta: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        // ALERTA: Para desencriptar binarios usamos readAsArrayBuffer
        reader.onload = async (e) => {
            try {
                window.mostrarNotificacion("Desencriptando archivo .db...", "info");
                
                // Revertimos la ofuscación XOR
                const buffer = new Uint8Array(e.target.result);
                for (let i = 0; i < buffer.length; i++) {
                    buffer[i] = buffer[i] ^ 0x55;
                }
                
                const textDecoder = new TextDecoder();
                const jsonString = textDecoder.decode(buffer);
                const parsedDb = JSON.parse(jsonString);
                
                // Validamos firma de seguridad
                if (parsedDb?.metadata?.format !== "motor_app_db_v1") {
                    throw new Error("Estructura .db desconocida o corrupta");
                }
                
                const usuariosDb = parsedDb.tables.usuarios;
                window.mostrarNotificacion("Formateando e instalando datos...", "warning");
                
                if (!window.sqliteService.isWeb && window.sqliteService.db) {
                    await window.sqliteService.db.execute("DELETE FROM usuarios");
                } else {
                    localStorage.removeItem("mock_db_usuarios");
                }
                
                let count = 0;
                if (!window.sqliteService.isWeb && window.sqliteService.db) {
                    for (let u of usuariosDb) {
                        await window.sqliteService.db.run(
                            "INSERT INTO usuarios (id, nombre, email, password, telefono, fecha_nacimiento, id_nacional, rol, estado, foto_perfil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            [u.id, u.nombre, u.email, u.password, u.telefono, u.fecha_nacimiento, u.id_nacional, u.rol, u.estado, u.foto_perfil] 
                        );
                        count++;
                    }
                } else {
                    localStorage.setItem("mock_db_usuarios", JSON.stringify(usuariosDb));
                    count = usuariosDb.length;
                }
                
                window.mostrarNotificacion(`Reescritura al 100%. Reiniciando entorno...`, "success");
                
                setTimeout(() => {
                    window.sqliteService.clearSession();
                    window.location.reload();
                }, 2000);
                
            } catch(err) {
                window.mostrarNotificacion("Error: Archivo .db dañado o inválido", "danger");
                console.error("[AdminDB] Fallo al desencriptar DB: ", err);
            }
            event.target.value = ''; 
        };
        // Iniciamos la lectura como Binario (No como texto)
        reader.readAsArrayBuffer(file);
    },

    // ---------------------------------------------------------
    // 3. RESETEO PROFUNDO EN 3 PASOS (Protección Anti-Errores)
    // ---------------------------------------------------------
    iniciarReseteo: function() {
        this.pasoActual = 1;
        this.renderizarModal();
        const modal = new window.bootstrap.Modal(document.getElementById('modalResetDB'));
        modal.show();
    },

    avanzarReseteo: async function() {
        this.pasoActual++;
        
        if (this.pasoActual === 4) {
            const modalEl = document.getElementById('modalResetDB');
            const modal = window.bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            // Antes de borrar creamos el backup seguro con el nuevo método
            await this.respaldarBDCompleta();
            
            setTimeout(async () => {
                if (!window.sqliteService.isWeb && window.sqliteService.db) {
                    await window.sqliteService.db.execute("DELETE FROM usuarios");
                }
                window.sqliteService.limpiarBD(); 
            }, 1500);

        } else {
            this.renderizarModal();
        }
    },

    renderizarModal: function() {
        const body = document.getElementById('reset-db-body');
        const footer = document.getElementById('reset-db-footer');
        
        if (this.pasoActual === 1) {
            body.innerHTML = `
                <div class="display-1 text-warning mb-3"><i class="bi bi-exclamation-triangle"></i></div>
                <h4 class="fw-bold">Paso 1/3</h4>
                <p class="mb-0 fs-6">¿Estás seguro de querer borrar <b>toda la base de datos</b> del dispositivo?</p>`;
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-warning rounded-pill px-4 fw-bold" onclick="window.AdminDBManager.avanzarReseteo()">Sí, continuar</button>
            `;
        } else if (this.pasoActual === 2) {
            body.innerHTML = `
                <div class="display-1 text-danger mb-3"><i class="bi bi-shield-x"></i></div>
                <h4 class="fw-bold text-danger">Paso 2/3</h4>
                <p class="mb-0 fs-6 text-danger fw-bold">¡ATENCIÓN! Se perderán TODOS los usuarios y registros de forma irreversible. ¿Realmente deseas continuar?</p>`;
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Mejor no</button>
                <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold" onclick="window.AdminDBManager.avanzarReseteo()">BORRAR DATOS</button>
            `;
        } else if (this.pasoActual === 3) {
            body.innerHTML = `
                <div class="display-1 text-dark mb-3"><i class="bi bi-radioactive"></i></div>
                <h4 class="fw-bold text-dark">Paso 3/3: Ejecución</h4>
                <p class="mb-0 fs-6">Última advertencia. Se creará un respaldo automático y luego se <b>formateará el sistema</b> por completo.</p>`;
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-dark rounded-pill px-4 fw-bold shadow" onclick="window.AdminDBManager.avanzarReseteo()"><i class="bi bi-trash-fill me-2"></i> ESTOY SEGURO</button>
            `;
        }
    }
};

// --- EXPORTAR AL ENTORNO GLOBAL E INICIAR ---
window.AdminDBManager = AdminDBManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminDBManager.init());
} else {
    AdminDBManager.init();
}