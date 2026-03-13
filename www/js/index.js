// =========================================================
// 1. MOTOR AVANZADO SQLITE (Conectado a toda la app)
// =========================================================
const sqliteService = {
    db: null,
    dbName: "motor_db",
    isWeb: !window.Capacitor || !window.Capacitor.isNativePlatform(),
    
    init: async function() {
        const logElement = document.getElementById('loading-text');
        if(logElement) logElement.innerText = "Iniciando Motor de Base de Datos...";
        
        try {
            let superusers = [];
            try {
                if(logElement) logElement.innerText = "Verificando superusuarios...";
                const response = await fetch('init_data.json?t=' + new Date().getTime(), { cache: "no-store" });
                if (response.ok) {
                    const data = await response.json();
                    if (data.dbName) this.dbName = data.dbName.replace('.db', ''); 
                    if (data.superusers) superusers = data.superusers;
                }
            } catch (e) {
                console.log("[SQLite] init_data.json no encontrado o inaccesible.");
            }

            if (!this.isWeb && window.capacitorExports) {
                if(logElement) logElement.innerText = "Optimizando Motor SQLite...";
                const { CapacitorSQLite, SQLiteConnection } = capacitorExports;
                const sqlite = new SQLiteConnection(CapacitorSQLite);
                
                const USE_ENCRYPTION = false; 
                const ENCRYPTION_MODE = USE_ENCRYPTION ? "encryption" : "no-encryption";

                this.db = await sqlite.createConnection(this.dbName, USE_ENCRYPTION, ENCRYPTION_MODE, 1, false);
                await this.db.open();
                
                // Optimizaciones de rendimiento (Pragmas)
                await this.db.execute("PRAGMA journal_mode = WAL;");
                await this.db.execute("PRAGMA synchronous = NORMAL;");
                await this.db.execute("PRAGMA cache_size = -10000;");
                await this.db.execute("PRAGMA temp_store = MEMORY;");
                
                if(logElement) logElement.innerText = "Verificando estructura...";
                await this.crearTablas();
                await this.cargarSuperusuariosIniciales(superusers);
            } else {
                await this.simularBDWeb(superusers);
            }
            
            return true;
        } catch (e) {
            console.error("[SQLite] Error Crítico al inicializar:", e);
            if(logElement) logElement.innerText = "Error: " + e.message;
            return false;
        }
    },

    crearTablas: async function() {
        const query = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                pin TEXT,
                rol TEXT DEFAULT 'admin',
                estado TEXT DEFAULT 'activo'
            );
            CREATE INDEX IF NOT EXISTS idx_usuarios_auth ON usuarios(email, password);
        `;
        await this.db.execute(query);
    },

    cargarSuperusuariosIniciales: async function(superusersFromJSON) {
        const res = await this.db.query("SELECT COUNT(*) AS total FROM usuarios");
        if (res.values[0].total === 0 && superusersFromJSON && superusersFromJSON.length > 0) {
            for (const user of superusersFromJSON) {
                await this.db.run(
                    "INSERT INTO usuarios (email, password, pin, rol) VALUES (?, ?, ?, ?)",
                    [user.email, user.password, user.pin, 'superusuario']
                );
            }
        }
    },

    simularBDWeb: async function(superusersFromJSON) {
        if (superusersFromJSON && superusersFromJSON.length > 0) {
            const adaptado = superusersFromJSON.map(u => ({...u, rol: 'superusuario', estado: 'activo'}));
            localStorage.setItem("mock_db_usuarios", JSON.stringify(adaptado));
        } 
        else if (!localStorage.getItem("mock_db_usuarios")) {
            localStorage.setItem("mock_db_usuarios", JSON.stringify([{email: "admin@app.com", password: "admin", pin: "00000000", rol: "superusuario", estado: "activo"}]));
        }
    },

    login: async function(email, password) {
        if (!this.isWeb && this.db) {
            const res = await this.db.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password]);
            return (res.values && res.values.length > 0) ? res.values[0] : null;
        } else {
            const users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            return users.find(u => u.email === email && u.password === password) || null;
        }
    },

    getUsuarios: async function() {
        if (!this.isWeb && this.db) {
            const res = await this.db.query("SELECT * FROM usuarios");
            return res.values || [];
        } else {
            return JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
        }
    },

    testConnection: async function() {
        const inicio = performance.now();
        const users = await this.getUsuarios();
        const fin = performance.now();
        mostrarNotificacion(`Conexión OK. DB: ${users.length} usuarios. Tiempo: ${(fin - inicio).toFixed(2)} ms`, "success");
    },

    limpiarBD: function() {
        localStorage.removeItem("mock_db_usuarios");
        localStorage.removeItem("usuario_activo");
        mostrarNotificacion("Base de datos local formateada.", "danger");
        setTimeout(() => window.location.reload(), 1000);
    }
};

// =========================================================
// 2. SISTEMA DE AUTENTICACIÓN
// =========================================================
async function iniciarSesionApp() {
    const btnSubmit = document.getElementById('btn-login-submit');
    const emailInput = document.getElementById('login-email').value;
    const passInput = document.getElementById('login-pass').value;
    const errorDiv = document.getElementById('login-error');

    if(btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>INGRESANDO...';
    }
    
    errorDiv.classList.add('d-none');

    try {
        const user = await sqliteService.login(emailInput, passInput);

        if (user) {
            mostrarNotificacion("¡Acceso concedido!", "success");
            localStorage.setItem('usuario_activo', JSON.stringify(user));
            
            requestAnimationFrame(() => {
                cargarVista('inicio', 'Inicio');
            });
        } else {
            errorDiv.textContent = "Credenciales incorrectas o usuario inexistente en DB.";
            errorDiv.classList.remove('d-none');
            if(btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'INGRESAR';
            }
        }
    } catch(e) {
        errorDiv.textContent = "Error interno de base de datos.";
        errorDiv.classList.remove('d-none');
        if(btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'INGRESAR';
        }
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuario_activo');
    mostrarNotificacion('Sesión cerrada correctamente', 'success');
    cargarVista('login', 'Login');
}

// =========================================================
// 3. ENRUTAMIENTO Y POBLACIÓN DE VISTAS DESDE SQLITE
// =========================================================
function cargarVista(vistaId, titulo) {
    const root = document.getElementById('app-root');
    const header = document.getElementById('app-header');
    const bottomNav = document.getElementById('app-bottom-nav');
    const titleEl = document.getElementById('view-title');

    if(!root || root.dataset.vistaActual === vistaId) return;
    root.dataset.vistaActual = vistaId;
    
    root.style.display = 'none';
    root.classList.remove('fade-in');
    
    const template = document.getElementById('tpl-' + vistaId);
    
    if (template) {
        requestAnimationFrame(() => {
            root.innerHTML = '';
            root.appendChild(template.content.cloneNode(true));
            
            root.style.display = 'block';
            root.classList.add('fade-in');
            
            if (titleEl && titulo) titleEl.innerText = titulo;

            const esAuth = vistaId === 'login' || vistaId === 'registro';
            
            if (esAuth) {
                header.classList.add('d-none');
                bottomNav.classList.add('d-none');
                bottomNav.classList.remove('d-flex');
            } else {
                header.classList.remove('d-none');
                bottomNav.classList.remove('d-none');
                bottomNav.classList.add('d-flex');
                
                document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
                    btn.classList.remove('active', 'text-primary');
                    btn.classList.add('text-secondary');
                });
                
                const activeBtn = document.getElementById('nav-' + vistaId); 
                if(activeBtn) {
                    activeBtn.classList.add('active', 'text-primary');
                    activeBtn.classList.remove('text-secondary');
                }
            }

            ejecutarLogicaVista(vistaId);
        });
    }
}

async function ejecutarLogicaVista(vistaId) {
    const usuarioActivo = JSON.parse(localStorage.getItem('usuario_activo') || 'null');

    if (vistaId === 'inicio' && usuarioActivo) {
        const nombre = usuarioActivo.email.split('@')[0];
        const el = document.getElementById('inicio-nombre');
        if (el) el.innerText = `Hola, ${nombre.charAt(0).toUpperCase() + nombre.slice(1)}`;
    }
    
    if (vistaId === 'perfil' && usuarioActivo) {
        const elEmail = document.getElementById('perfil-email');
        const elRol = document.getElementById('perfil-rol');
        const elNombre = document.getElementById('perfil-nombre');
        const elAvatar = document.getElementById('perfil-avatar');
        
        const nombre = usuarioActivo.email.split('@')[0];
        if (elNombre) elNombre.innerText = nombre.charAt(0).toUpperCase() + nombre.slice(1);
        if (elEmail) elEmail.innerText = usuarioActivo.email;
        if (elRol) elRol.innerText = usuarioActivo.rol ? usuarioActivo.rol.toUpperCase() : 'USUARIO';
        if (elAvatar) elAvatar.innerText = nombre.charAt(0).toUpperCase();
    }

    if (vistaId === 'admin_usuarios') {
        const tbody = document.getElementById('lista-usuarios-admin');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2"></div>Consultando...</td></tr>';
            
            try {
                const usuarios = await sqliteService.getUsuarios();
                tbody.innerHTML = '';
                
                if(usuarios.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No hay usuarios registrados</td></tr>';
                    return;
                }

                let htmlBuffer = '';
                
                usuarios.forEach(u => {
                    const nombre = u.email.split('@')[0];
                    const iniciales = nombre.substring(0,2).toUpperCase();
                    const estadoClase = u.estado === 'activo' ? 'success' : 'secondary';
                    const estadoTexto = u.estado ? u.estado.charAt(0).toUpperCase() + u.estado.slice(1) : 'Activo';
                    
                    htmlBuffer += `
                        <tr>
                            <td class="ps-3">
                                <div class="d-flex align-items-center">
                                    <div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2 shadow-sm" style="width:36px; height:36px; font-size:12px; font-weight:bold;">${iniciales}</div>
                                    <div>
                                        <div class="fw-bold text-dark" style="font-size: 0.9rem;">${nombre.charAt(0).toUpperCase() + nombre.slice(1)}</div>
                                        <div class="text-muted" style="font-size: 0.75rem;">${u.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-center"><span class="badge bg-${estadoClase} bg-opacity-10 text-${estadoClase} border border-${estadoClase} border-opacity-25 rounded-pill">${estadoTexto}</span></td>
                            <td class="text-end pe-3">
                                <button class="btn btn-sm btn-light text-primary shadow-sm"><i class="bi bi-pencil"></i></button>
                            </td>
                        </tr>
                    `;
                });
                
                requestAnimationFrame(() => {
                    tbody.innerHTML = htmlBuffer;
                });
                
            } catch(e) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error al consultar DB local</td></tr>';
            }
        }
    }
}

let appToast;
function mostrarNotificacion(mensaje, tipo = 'primary') {
    const toastEl = document.getElementById('appToast');
    const toastHeader = document.getElementById('toast-header');
    const toastBody = document.getElementById('toast-message');
    
    if(toastHeader) toastHeader.className = `toast-header text-white bg-${tipo}`;
    if(toastBody) toastBody.innerText = mensaje;
    
    if (!appToast && window.bootstrap) {
        appToast = new bootstrap.Toast(toastEl, { delay: 2500 });
    }
    
    if(appToast) {
        appToast.show();
    } else {
        // Fallback robusto en caso de que bootstrap.js falle
        toastEl.style.display = 'block';
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
            toastEl.style.display = 'none';
        }, 2500);
    }
}

// =========================================================
// 4. INICIALIZACIÓN GLOBAL OPTIMIZADA
// =========================================================
async function bootApp() {
    if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {                
        document.documentElement.style.setProperty('--android-nav-spacing', '28px');
    }

    // INICIAR TEMA PRIMERO PARA EVITAR DESTELLOS BLANCOS
    if (window.ThemeManager) {
        await window.ThemeManager.init();
    } else {
        console.error("[App] ATENCIÓN: temas.js no se cargó correctamente antes que index.js");
    }

    const dbReady = await sqliteService.init();
    const usuarioActivo = JSON.parse(localStorage.getItem('usuario_activo'));
    
    requestAnimationFrame(() => {
        if (usuarioActivo && dbReady) {
            cargarVista('inicio', 'Inicio');
        } else {
            cargarVista('login', 'Login');
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(bootApp, 10);
});

// ============================================================================
// SOLUCIÓN DE SCOPE (Alcance global para HTML)
// ============================================================================
window.sqliteService = sqliteService;
window.iniciarSesionApp = iniciarSesionApp;
window.cerrarSesion = cerrarSesion;
window.cargarVista = cargarVista;
window.mostrarNotificacion = mostrarNotificacion;