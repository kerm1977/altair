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
                console.log(`[SQLite] NATIVO ACTIVADO. Operando en Android/iOS.`);
            } else {
                console.log("⚠️ [MODO WEB] SQLite nativo NO existe en navegadores de PC. Simulando entorno...");
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
                rol TEXT DEFAULT 'usuario',
                estado TEXT DEFAULT 'activo'
            );
            CREATE INDEX IF NOT EXISTS idx_usuarios_auth ON usuarios(email, password);

            -- TABLA PARA GUARDAR LA SESIÓN ACTIVA Y PREFERENCIAS SIN USAR EL NAVEGADOR
            CREATE TABLE IF NOT EXISTS app_config (
                clave TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL
            );
        `;
        await this.db.execute(query);
    },

    // --- NUEVO: FUNCIONES DE SESIÓN INTEGRADAS EN SQLITE ---
    setSession: async function(userObj) {
        if (!this.isWeb && this.db) {
            await this.db.run(
                "INSERT OR REPLACE INTO app_config (clave, valor) VALUES (?, ?)",
                ['usuario_activo', JSON.stringify(userObj)]
            );
        } else {
            // Fallback exclusivo para cuando pruebes en el PC
            localStorage.setItem('usuario_activo', JSON.stringify(userObj));
        }
    },

    getSession: async function() {
        if (!this.isWeb && this.db) {
            const res = await this.db.query("SELECT valor FROM app_config WHERE clave = ?", ['usuario_activo']);
            if (res.values && res.values.length > 0) {
                return JSON.parse(res.values[0].valor);
            }
            return null;
        } else {
            return JSON.parse(localStorage.getItem('usuario_activo') || 'null');
        }
    },

    clearSession: async function() {
        if (!this.isWeb && this.db) {
            await this.db.run("DELETE FROM app_config WHERE clave = ?", ['usuario_activo']);
        } else {
            localStorage.removeItem('usuario_activo');
        }
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
        let users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
        if (users.length === 0) {
            if (superusersFromJSON && superusersFromJSON.length > 0) {
                const adaptado = superusersFromJSON.map(u => ({...u, rol: 'superusuario', estado: 'activo'}));
                localStorage.setItem("mock_db_usuarios", JSON.stringify(adaptado));
            } else {
                localStorage.setItem("mock_db_usuarios", JSON.stringify([{email: "admin@app.com", password: "admin", pin: "00000000", rol: "superusuario", estado: "activo"}]));
            }
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

    registrarUsuario: async function(email, password, nombre) {
        if (!this.isWeb && this.db) {
            try {
                const check = await this.db.query("SELECT id FROM usuarios WHERE email = ?", [email]);
                if (check.values && check.values.length > 0) return false;

                await this.db.run(
                    "INSERT INTO usuarios (email, password, rol, estado) VALUES (?, ?, ?, ?)",
                    [email, password, 'usuario', 'activo'] 
                );
                return true;
            } catch(e) {
                console.error("[SQLite] Error al insertar usuario:", e);
                return false;
            }
        } else {
            const users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            if (users.find(u => u.email === email)) return false; 
            users.push({email, password, rol: 'usuario', estado: 'activo', nombre});
            localStorage.setItem("mock_db_usuarios", JSON.stringify(users));
            return true;
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

    buscarUsuarios: async function(termino) {
        if (!this.isWeb && this.db) {
            const query = "SELECT * FROM usuarios WHERE email LIKE ?";
            const res = await this.db.query(query, [`%${termino}%`]);
            return res.values || [];
        } else {
            const users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            const terminoMin = termino.toLowerCase();
            return users.filter(u => u.email.toLowerCase().includes(terminoMin));
        }
    },

    getUsuarioByEmail: async function(email) {
        if (!this.isWeb && this.db) {
            const res = await this.db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
            return (res.values && res.values.length > 0) ? res.values[0] : null;
        } else {
            const users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            return users.find(u => u.email === email) || null;
        }
    },

    actualizarUsuario: async function(email, datos) {
        if (!this.isWeb && this.db) {
            try {
                await this.db.run(
                    "UPDATE usuarios SET rol = ?, estado = ? WHERE email = ?",
                    [datos.rol, datos.estado, email]
                );
                return true;
            } catch(e) {
                console.error("[SQLite] Error al actualizar usuario:", e);
                return false;
            }
        } else {
            let users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            let index = users.findIndex(u => u.email === email);
            if (index !== -1) {
                users[index].rol = datos.rol;
                users[index].estado = datos.estado;
                localStorage.setItem("mock_db_usuarios", JSON.stringify(users));
                return true;
            }
            return false;
        }
    },

    testConnection: async function() {
        const inicio = performance.now();
        const users = await this.getUsuarios();
        const fin = performance.now();
        window.mostrarNotificacion(`Conexión OK. DB: ${users.length} usuarios. Tiempo: ${(fin - inicio).toFixed(2)} ms`, "success");
    },

    limpiarBD: async function() {
        localStorage.removeItem("mock_db_usuarios");
        await this.clearSession(); // Limpiamos tabla SQLITE
        window.mostrarNotificacion("Base de datos formateada.", "danger");
        setTimeout(() => window.location.reload(), 1000);
    }
};

// =========================================================
// 2. SISTEMA DE AUTENTICACIÓN Y REGISTRO
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

        if (user && user.estado !== 'inactivo') {
            window.mostrarNotificacion("¡Acceso concedido!", "success");
            
            // GUARDAMOS SESIÓN EN LA BASE DE DATOS (NO EN NAVEGADOR)
            await sqliteService.setSession(user);
            
            requestAnimationFrame(() => {
                window.cargarVista('inicio', 'Inicio');
            });
        } else if (user && user.estado === 'inactivo') {
            errorDiv.textContent = "Tu cuenta está inactiva o ha sido bloqueada.";
            errorDiv.classList.remove('d-none');
            if(btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'INGRESAR';
            }
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

async function registrarUsuarioApp() {
    const btnSubmit = document.getElementById('btn-reg-submit');
    const emailInput = document.getElementById('reg-email').value;
    const passInput = document.getElementById('reg-pass').value;
    const nombreInput = document.getElementById('reg-nombre').value;
    const errorDiv = document.getElementById('reg-error');

    if(btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>REGISTRANDO...';
    }
    
    if(errorDiv) errorDiv.classList.add('d-none');

    try {
        const exito = await sqliteService.registrarUsuario(emailInput, passInput, nombreInput);

        if (exito) {
            window.mostrarNotificacion("¡Cuenta creada! Ya puedes iniciar sesión.", "success");
            requestAnimationFrame(() => {
                window.cargarVista('login', 'Login');
            });
        } else {
            if(errorDiv) {
                errorDiv.textContent = "El correo electrónico ya está registrado.";
                errorDiv.classList.remove('d-none');
            }
            if(btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'REGISTRARME';
            }
        }
    } catch(e) {
        if(errorDiv) {
            errorDiv.textContent = "Error interno al intentar registrar.";
            errorDiv.classList.remove('d-none');
        }
        console.error(e);
        if(btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'REGISTRARME';
        }
    }
}

async function cerrarSesion() {
    await sqliteService.clearSession(); // ELIMINA REGISTRO DE SQLITE
    window.mostrarNotificacion('Sesión cerrada correctamente', 'success');
    window.cargarVista('login', 'Login');
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
                } else if (vistaId === 'editar_usuario') {
                    const adminBtn = document.getElementById('nav-admin_usuarios');
                    if (adminBtn) {
                        adminBtn.classList.add('active', 'text-primary');
                        adminBtn.classList.remove('text-secondary');
                    }
                }
            }

            ejecutarLogicaVista(vistaId);
        });
    }
}

async function abrirEditorUsuario(email) {
    const user = await sqliteService.getUsuarioByEmail(email);
    if (user) {
        // Almacenamos temporalmente en RAM, no en LocalStorage
        window.usuarioEnEdicion = user;
        window.cargarVista('editar_usuario', 'Editar Usuario');
    } else {
        window.mostrarNotificacion("Error: Usuario no encontrado", "danger");
    }
}

async function guardarEdicionUsuario() {
    const user = window.usuarioEnEdicion;
    if (!user) return;

    const rolSel = document.getElementById('edit-rol').value;
    const estadoSel = document.getElementById('edit-estado').value;
    const btn = document.getElementById('btn-save-edit');
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>GUARDANDO...';
    }

    const exito = await sqliteService.actualizarUsuario(user.email, { rol: rolSel, estado: estadoSel });
    
    if (exito) {
        window.mostrarNotificacion("Privilegios actualizados correctamente", "success");
        
        const usuarioActivo = await sqliteService.getSession();
        if (usuarioActivo && usuarioActivo.email === user.email) {
            usuarioActivo.rol = rolSel;
            usuarioActivo.estado = estadoSel;
            await sqliteService.setSession(usuarioActivo); // Actualiza sesión en DB
        }

        setTimeout(() => {
            window.cargarVista('admin_usuarios', 'Usuarios');
        }, 300);
    } else {
        window.mostrarNotificacion("Error al actualizar privilegios", "danger");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> GUARDAR CAMBIOS';
        }
    }
}

function renderizarUsuarios(usuarios, tbody) {
    if (!tbody) return;

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
                    <button class="btn btn-sm btn-light text-primary shadow-sm" onclick="window.abrirEditorUsuario('${u.email}')"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `;
    });
    
    requestAnimationFrame(() => {
        tbody.innerHTML = htmlBuffer;
    });
}

async function ejecutarLogicaVista(vistaId) {
    // CARGA DE SESIÓN DESDE SQLITE
    const usuarioActivo = await sqliteService.getSession();

    const navAdminUsuarios = document.getElementById('nav-admin_usuarios');
    if (navAdminUsuarios) {
        if (usuarioActivo && (usuarioActivo.rol === 'superusuario' || usuarioActivo.rol === 'admin')) {
            navAdminUsuarios.classList.remove('d-none');
        } else {
            navAdminUsuarios.classList.add('d-none');
        }
    }

    if (vistaId === 'inicio' && usuarioActivo) {
        const nombre = usuarioActivo.email.split('@')[0];
        const el = document.getElementById('inicio-nombre');
        if (el) el.innerText = `Hola, ${nombre.charAt(0).toUpperCase() + nombre.slice(1)}`;

        const tarjetaAdminUsuarios = document.querySelector('button[onclick*="admin_usuarios"]');
        if (tarjetaAdminUsuarios) {
            if (usuarioActivo.rol === 'superusuario' || usuarioActivo.rol === 'admin') {
                tarjetaAdminUsuarios.classList.remove('d-none');
            } else {
                tarjetaAdminUsuarios.classList.add('d-none');
            }
        }
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
        const searchInput = document.getElementById('buscador-usuarios'); 

        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2"></div>Consultando...</td></tr>';
            
            try {
                const usuarios = await sqliteService.getUsuarios();
                window.renderizarUsuarios(usuarios, tbody);

                if (searchInput) {
                    searchInput.addEventListener('input', async (e) => {
                        const termino = e.target.value.trim();
                        if (window.SearchManager) {
                            window.SearchManager.buscar(termino, tbody);
                        } else {
                            const res = await sqliteService.buscarUsuarios(termino);
                            window.renderizarUsuarios(res, tbody);
                        }
                    });
                }
            } catch(e) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error al consultar DB local</td></tr>';
            }
        }
    }

    // EXTRAER DATOS DESDE LA RAM, NO DESDE NAVEGADOR
    if (vistaId === 'editar_usuario') {
        const userEdit = window.usuarioEnEdicion;
        if (userEdit) {
            const elEmail = document.getElementById('edit-email-display');
            const selRol = document.getElementById('edit-rol');
            const selEstado = document.getElementById('edit-estado');
            
            if (elEmail) elEmail.innerText = userEdit.email;
            if (selRol) selRol.value = userEdit.rol || 'usuario';
            if (selEstado) selEstado.value = userEdit.estado || 'activo';
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
        appToast = new window.bootstrap.Toast(toastEl, { delay: 2500 });
    }
    
    if(appToast) {
        appToast.show();
    } else {
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

    if (window.ThemeManager) {
        await window.ThemeManager.init();
    }

    const dbReady = await sqliteService.init();
    
    // CARGAR SESIÓN DIRECTO DESDE SQLITE
    const usuarioActivo = await sqliteService.getSession();
    
    requestAnimationFrame(() => {
        if (usuarioActivo && dbReady) {
            window.cargarVista('inicio', 'Inicio');
        } else {
            window.cargarVista('login', 'Login');
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
window.registrarUsuarioApp = registrarUsuarioApp;
window.cerrarSesion = cerrarSesion;
window.cargarVista = cargarVista;
window.mostrarNotificacion = mostrarNotificacion;
window.renderizarUsuarios = renderizarUsuarios;
window.abrirEditorUsuario = abrirEditorUsuario;
window.guardarEdicionUsuario = guardarEdicionUsuario;