// ============================================================================
// ⚠️ FRAGMENTO 1: BASE DE DATOS (A FUTURO SERÁ: js/database.js)
// ⚠️ SIRVE PARA: Toda la interacción con el motor nativo SQLite, creación de
//                tablas, migraciones, persistencia de sesiones y consultas CRUD.
// ============================================================================
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
                
                await this.db.execute("PRAGMA journal_mode = WAL;");
                await this.db.execute("PRAGMA synchronous = NORMAL;");
                await this.db.execute("PRAGMA cache_size = -10000;");
                await this.db.execute("PRAGMA temp_store = MEMORY;");
                
                if(logElement) logElement.innerText = "Verificando estructura...";
                await this.crearTablas();

                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN nombre TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN telefono TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN fecha_nacimiento TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN id_nacional TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN foto_perfil TEXT DEFAULT '';"); } catch(e){}

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
                nombre TEXT DEFAULT '',
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                telefono TEXT DEFAULT '',
                fecha_nacimiento TEXT DEFAULT '',
                id_nacional TEXT DEFAULT '',
                foto_perfil TEXT DEFAULT '',
                pin TEXT,
                rol TEXT DEFAULT 'usuario',
                estado TEXT DEFAULT 'activo'
            );
            CREATE INDEX IF NOT EXISTS idx_usuarios_auth ON usuarios(email, password);

            CREATE TABLE IF NOT EXISTS app_config (
                clave TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL
            );
        `;
        await this.db.execute(query);
    },

    setSession: async function(userObj) {
        if (!this.isWeb && this.db) {
            await this.db.run(
                "INSERT OR REPLACE INTO app_config (clave, valor) VALUES (?, ?)",
                ['usuario_activo', JSON.stringify(userObj)]
            );
        } else {
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

    registrarUsuario: async function(email, password, nombre, telefono = '', fecha_nacimiento = '', id_nacional = '') {
        if (!this.isWeb && this.db) {
            try {
                const check = await this.db.query("SELECT id FROM usuarios WHERE email = ?", [email]);
                if (check.values && check.values.length > 0) return false;

                await this.db.run(
                    "INSERT INTO usuarios (nombre, email, password, telefono, fecha_nacimiento, id_nacional, rol, estado, foto_perfil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [nombre, email, password, telefono, fecha_nacimiento, id_nacional, 'usuario', 'activo', ''] 
                );
                return true;
            } catch(e) {
                console.error("[SQLite] Error al insertar usuario:", e);
                return false;
            }
        } else {
            const users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            if (users.find(u => u.email === email)) return false; 
            users.push({email, password, nombre, telefono, fecha_nacimiento, id_nacional, foto_perfil: '', rol: 'usuario', estado: 'activo'});
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
            const query = "SELECT * FROM usuarios WHERE email LIKE ? OR nombre LIKE ?";
            const res = await this.db.query(query, [`%${termino}%`, `%${termino}%`]);
            return res.values || [];
        } else {
            const users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            const terminoMin = termino.toLowerCase();
            return users.filter(u => u.email.toLowerCase().includes(terminoMin) || (u.nombre && u.nombre.toLowerCase().includes(terminoMin)));
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

    actualizarUsuario: async function(emailViejo, datos) {
        if (!this.isWeb && this.db) {
            try {
                await this.db.run(
                    "UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, password = ?, rol = ?, estado = ? WHERE email = ?",
                    [datos.nombre, datos.email, datos.telefono, datos.password, datos.rol, datos.estado, emailViejo]
                );
                return true;
            } catch(e) {
                console.error("[SQLite] Error al actualizar usuario:", e);
                return false;
            }
        } else {
            let users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            let index = users.findIndex(u => u.email === emailViejo);
            if (index !== -1) {
                users[index].nombre = datos.nombre;
                users[index].email = datos.email;
                users[index].telefono = datos.telefono;
                users[index].password = datos.password;
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
        await this.clearSession();
        window.mostrarNotificacion("Base de datos formateada.", "danger");
        setTimeout(() => window.location.reload(), 1000);
    }
};

// ============================================================================
// ⚠️ FRAGMENTO 2: AUTENTICACIÓN (A FUTURO SERÁ: js/auth.js)
// ⚠️ SIRVE PARA: Manejar el inicio y cierre de sesión, y la validación de 
//                credenciales hasheadas conectándose con el FRAGMENTO 1.
//                *Nota: El registro ya está separado en js/registro.js*
// ============================================================================
async function iniciarSesionApp() {
    const btnSubmit = document.getElementById('btn-login-submit');
    const emailInput = document.getElementById('login-email').value;
    const rawPass = document.getElementById('login-pass').value;
    const errorDiv = document.getElementById('login-error');

    if(btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>INGRESANDO...';
    }
    
    errorDiv.classList.add('d-none');

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawPass);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passInput = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const user = await sqliteService.login(emailInput, passInput);

        if (user && user.estado !== 'inactivo') {
            window.mostrarNotificacion("¡Acceso concedido!", "success");
            await sqliteService.setSession(user);
            
            requestAnimationFrame(() => {
                window.cargarVista('inicio', 'Inicio');
            });
        } else if (user && user.estado === 'inactivo') {
            errorDiv.textContent = "Tu cuenta está inactiva o ha sido bloqueada.";
            errorDiv.classList.remove('d-none');
            if(btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'INGRESAR AL SISTEMA';
            }
        } else {
            errorDiv.textContent = "Credenciales incorrectas o usuario inexistente en DB.";
            errorDiv.classList.remove('d-none');
            if(btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'INGRESAR AL SISTEMA';
            }
        }
    } catch(e) {
        errorDiv.textContent = "Error interno de base de datos.";
        errorDiv.classList.remove('d-none');
        if(btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'INGRESAR AL SISTEMA';
        }
    }
}

async function cerrarSesion() {
    await sqliteService.clearSession();
    window.mostrarNotificacion('Sesión cerrada correctamente', 'success');
    window.cargarVista('login', 'Login');
}

// ============================================================================
// ⚠️ FRAGMENTO 3: ENRUTAMIENTO Y VISTAS (A FUTURO SERÁ: js/router.js)
// ⚠️ SIRVE PARA: Cambiar entre pantallas (`<template>`), inyectar HTML en el DOM,
//                manejar la barra de navegación y poblar los datos de cada vista.
// ============================================================================
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

async function ejecutarLogicaVista(vistaId) {
    const usuarioActivo = await sqliteService.getSession();

    // Lógicas de UI de Admin
    const navAdminUsuarios = document.getElementById('nav-admin_usuarios');
    if (navAdminUsuarios) {
        if (usuarioActivo && (usuarioActivo.rol === 'superusuario' || usuarioActivo.rol === 'admin')) {
            navAdminUsuarios.classList.remove('d-none');
        } else {
            navAdminUsuarios.classList.add('d-none');
        }
    }

    if (vistaId === 'inicio' && usuarioActivo) {
        const displayNombre = usuarioActivo.nombre || usuarioActivo.email.split('@')[0];
        const el = document.getElementById('inicio-nombre');
        if (el) el.innerText = `Hola, ${displayNombre}`;

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
        const elTelefono = document.getElementById('perfil-telefono');
        
        const displayNombre = usuarioActivo.nombre || usuarioActivo.email.split('@')[0];
        if (elNombre) elNombre.innerText = displayNombre;
        if (elEmail) elEmail.innerText = usuarioActivo.email;
        if (elTelefono) elTelefono.innerText = usuarioActivo.telefono || 'No especificado';
        if (elRol) elRol.innerText = usuarioActivo.rol ? usuarioActivo.rol.toUpperCase() : 'USUARIO';
        
        if (elAvatar) {
            if (usuarioActivo.foto_perfil) {
                elAvatar.innerHTML = `<img src="${usuarioActivo.foto_perfil}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                elAvatar.innerHTML = displayNombre.charAt(0).toUpperCase();
            }
        }
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

    if (vistaId === 'editar_usuario') {
        const userEdit = window.usuarioEnEdicion;
        
        if (userEdit) {
            const elEmailDisplay = document.getElementById('edit-email-display');
            const inNombre = document.getElementById('edit-nombre');
            const inEmail = document.getElementById('edit-email');
            const inTelefono = document.getElementById('edit-telefono');
            const inPassword = document.getElementById('edit-password');
            const selRol = document.getElementById('edit-rol');
            const selEstado = document.getElementById('edit-estado');
            const boxPrivilegios = document.getElementById('box-privilegios');

            if (elEmailDisplay) elEmailDisplay.innerText = userEdit.email;
            if (inNombre) inNombre.value = userEdit.nombre || '';
            if (inEmail) inEmail.value = userEdit.email || '';
            if (inTelefono) inTelefono.value = userEdit.telefono || '';
            if (inPassword) inPassword.value = userEdit.password || '';
            
            if (usuarioActivo.rol === 'usuario' && boxPrivilegios) {
                boxPrivilegios.classList.add('d-none');
            } else if (selRol && selEstado) {
                selRol.value = userEdit.rol || 'usuario';
                selEstado.value = userEdit.estado || 'activo';
            }
        }
    }
}

// ============================================================================
// ⚠️ FRAGMENTO 4: CONTROLADORES DE USUARIO (A FUTURO SERÁ: js/userController.js)
// ⚠️ SIRVE PARA: Manejar las acciones específicas de edición de perfiles, 
//                guardado de cambios y renderizado de la tabla de administración.
// ============================================================================
async function abrirEditorUsuario(email) {
    const user = await sqliteService.getUsuarioByEmail(email);
    if (user) {
        window.usuarioEnEdicion = user;
        window.cargarVista('editar_usuario', 'Editar Información');
    } else {
        window.mostrarNotificacion("Error: Usuario no encontrado", "danger");
    }
}

async function editarMiPerfil() {
    const usuarioActivo = await sqliteService.getSession();
    if (usuarioActivo) {
        window.abrirEditorUsuario(usuarioActivo.email);
    }
}

async function cancelarEdicion() {
    const usuarioActivo = await sqliteService.getSession();
    if (usuarioActivo && (usuarioActivo.rol === 'superusuario' || usuarioActivo.rol === 'admin') && window.usuarioEnEdicion && window.usuarioEnEdicion.email !== usuarioActivo.email) {
        window.cargarVista('admin_usuarios', 'Usuarios');
    } else {
        window.cargarVista('perfil', 'Mi Perfil');
    }
}

async function guardarEdicionUsuario() {
    const user = window.usuarioEnEdicion;
    if (!user) return;

    const emailViejo = user.email;
    const txtNombre = document.getElementById('edit-nombre').value;
    const txtEmail = document.getElementById('edit-email').value;
    const txtTelefono = document.getElementById('edit-telefono').value;
    const txtPassword = document.getElementById('edit-password').value;

    const selRol = document.getElementById('edit-rol');
    const selEstado = document.getElementById('edit-estado');
    
    const rolActualizado = selRol ? selRol.value : user.rol;
    const estadoActualizado = selEstado ? selEstado.value : user.estado;

    const btn = document.getElementById('btn-save-edit');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>GUARDANDO...';
    }

    // Si la contraseña cambió, la encriptamos antes de guardar
    let passwordA_Guardar = txtPassword;
    if(txtPassword !== user.password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(txtPassword);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        passwordA_Guardar = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const nuevosDatos = {
        nombre: txtNombre,
        email: txtEmail,
        telefono: txtTelefono,
        password: passwordA_Guardar,
        rol: rolActualizado,
        estado: estadoActualizado
    };

    const exito = await sqliteService.actualizarUsuario(emailViejo, nuevosDatos);
    
    if (exito) {
        window.mostrarNotificacion("Información actualizada correctamente", "success");
        
        const usuarioActivo = await sqliteService.getSession();
        if (usuarioActivo && usuarioActivo.email === emailViejo) {
            nuevosDatos.foto_perfil = usuarioActivo.foto_perfil;
            await sqliteService.setSession(nuevosDatos); 
        }

        setTimeout(async () => {
            window.cancelarEdicion();
        }, 300);
    } else {
        window.mostrarNotificacion("Error: Verifica que el correo no esté usado por otro", "danger");
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
        const displayNombre = u.nombre || u.email.split('@')[0];
        const iniciales = displayNombre.substring(0,2).toUpperCase();
        const estadoClase = u.estado === 'activo' ? 'success' : 'secondary';
        const estadoTexto = u.estado ? u.estado.charAt(0).toUpperCase() + u.estado.slice(1) : 'Activo';
        
        let avatarContent = `<div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2 shadow-sm" style="width:36px; height:36px; font-size:12px; font-weight:bold;">${iniciales}</div>`;
        if (u.foto_perfil) {
            avatarContent = `<div class="me-2 shadow-sm rounded-circle overflow-hidden border border-1 border-primary" style="width:36px; height:36px; flex-shrink:0;">
                                <img src="${u.foto_perfil}" style="width:100%; height:100%; object-fit:cover;">
                             </div>`;
        }

        htmlBuffer += `
            <tr>
                <td class="ps-3">
                    <div class="d-flex align-items-center">
                        ${avatarContent}
                        <div>
                            <div class="fw-bold text-dark" style="font-size: 0.9rem;">${displayNombre}</div>
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

// ============================================================================
// ⚠️ FRAGMENTO 5: EDITOR DE IMÁGENES (A FUTURO SERÁ: js/imageEditor.js)
// ⚠️ SIRVE PARA: Proveer la UI y lógica para subir, arrastrar, recortar
//                en círculo y convertir a Base64 la foto de perfil.
// ============================================================================
const ImageEditorManager = {
    img: new Image(),
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    canvas: null,
    ctx: null,

    abrirSelectorImagen: function() {
        let input = document.getElementById('input-foto-perfil');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'input-foto-perfil';
            input.accept = 'image/png, image/jpeg, image/jpg';
            input.style.display = 'none';
            document.body.appendChild(input);
            input.addEventListener('change', (e) => this.procesarArchivo(e));
        }
        input.click();
    },

    procesarArchivo: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            this.img.onload = () => {
                this.abrirModalCropper();
            };
            this.img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = ''; 
    },

    abrirModalCropper: function() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        if (!document.getElementById('modal-cropper')) {
            const modalHTML = `
                <div id="modal-cropper" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; flex-direction:column; align-items:center; justify-content:center;">
                    <h5 class="text-white mb-3 fw-bold">Ajusta tu foto</h5>
                    <div style="position:relative; width:300px; height:300px; background:#111; border-radius:15px; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.8);">
                        <canvas id="cropper-canvas" width="300" height="300" style="cursor:move; touch-action:none;"></canvas>
                    </div>
                    <div class="mt-4 w-100 px-4" style="max-width:350px;">
                        <label class="text-white small mb-2 d-block text-center"><i class="bi bi-zoom-in me-2"></i>Tamaño</label>
                        <input type="range" class="form-range" id="cropper-zoom" min="10" max="300" value="100">
                    </div>
                    <div class="d-flex mt-4 gap-3 w-100 px-4" style="max-width:350px;">
                        <button class="btn btn-outline-light flex-fill rounded-pill py-2" onclick="window.ImageEditorManager.cerrarModal()">Cancelar</button>
                        <button class="btn btn-primary flex-fill rounded-pill fw-bold py-2" onclick="window.ImageEditorManager.guardarImagen()">Guardar Foto</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        document.getElementById('modal-cropper').style.display = 'flex';
        this.canvas = document.getElementById('cropper-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.configurarEventos();
        this.dibujar();
    },

    configurarEventos: function() {
        const zoomSlider = document.getElementById('cropper-zoom');
        if(zoomSlider) {
            zoomSlider.value = 100;
            zoomSlider.oninput = (e) => {
                this.scale = e.target.value / 100;
                this.dibujar();
            };
        }

        this.canvas.onmousedown = (e) => this.iniciarArrastre(e.clientX, e.clientY);
        this.canvas.onmousemove = (e) => this.arrastrar(e.clientX, e.clientY);
        window.onmouseup = () => this.detenerArrastre();
        
        this.canvas.ontouchstart = (e) => { e.preventDefault(); this.iniciarArrastre(e.touches[0].clientX, e.touches[0].clientY); };
        this.canvas.ontouchmove = (e) => { e.preventDefault(); this.arrastrar(e.touches[0].clientX, e.touches[0].clientY); };
        window.ontouchend = () => this.detenerArrastre();
    },

    iniciarArrastre: function(clientX, clientY) {
        this.isDragging = true;
        this.startX = clientX - this.offsetX;
        this.startY = clientY - this.offsetY;
    },

    arrastrar: function(clientX, clientY) {
        if (!this.isDragging) return;
        this.offsetX = clientX - this.startX;
        this.offsetY = clientY - this.startY;
        this.dibujar();
    },

    detenerArrastre: function() {
        this.isDragging = false;
    },

    dibujar: function() {
        if(!this.ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.clearRect(0, 0, w, h);
        
        const cx = w / 2;
        const cy = h / 2;
        
        this.ctx.save();
        this.ctx.translate(cx + this.offsetX, cy + this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        const iw = this.img.width;
        const ih = this.img.height;
        
        const baseScale = Math.max(w / iw, h / ih);
        this.ctx.scale(baseScale, baseScale);
        
        this.ctx.drawImage(this.img, -iw/2, -ih/2, iw, ih);
        this.ctx.restore();
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.beginPath();
        this.ctx.rect(0, 0, w, h);
        this.ctx.arc(cx, cy, 140, 0, Math.PI*2, true); 
        this.ctx.fill();

        this.ctx.strokeStyle = '#0d6efd';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 140, 0, Math.PI*2);
        this.ctx.stroke();
    },

    cerrarModal: function() {
        const modalEl = document.getElementById('modal-cropper');
        if(modalEl) modalEl.style.display = 'none';
    },

    guardarImagen: async function() {
        const btn = document.querySelector('#modal-cropper .btn-primary');
        if(btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>...';
        }

        const outCanvas = document.createElement('canvas');
        const size = 400; 
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext('2d');
        
        outCtx.beginPath();
        outCtx.arc(size/2, size/2, size/2, 0, Math.PI*2);
        outCtx.clip();
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w/2;
        const cy = h/2;
        const radius = 140; 
        
        outCtx.drawImage(
            this.canvas, 
            cx - radius, cy - radius, radius*2, radius*2,
            0, 0, size, size
        );
        
        const base64Img = outCanvas.toDataURL('image/jpeg', 0.80); 
        
        const usuarioActivo = await sqliteService.getSession();
        if (usuarioActivo) {
            if (!sqliteService.isWeb && sqliteService.db) {
                await sqliteService.db.run(
                    "UPDATE usuarios SET foto_perfil = ? WHERE email = ?",
                    [base64Img, usuarioActivo.email]
                );
            } else {
                let users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
                let index = users.findIndex(u => u.email === usuarioActivo.email);
                if (index !== -1) {
                    users[index].foto_perfil = base64Img;
                    localStorage.setItem("mock_db_usuarios", JSON.stringify(users));
                }
            }
            
            usuarioActivo.foto_perfil = base64Img;
            await sqliteService.setSession(usuarioActivo);
            
            window.mostrarNotificacion("Foto de perfil actualizada", "success");
            this.cerrarModal();
            if(btn) {
                btn.disabled = false;
                btn.innerHTML = 'Guardar Foto';
            }
            
            const root = document.getElementById('app-root');
            window.cargarVista(root.dataset.vistaActual, document.getElementById('view-title').innerText);
        }
    }
};

// ============================================================================
// ⚠️ FRAGMENTO 6: UTILIDADES Y ARRANQUE GLOBAL (A FUTURO SERÁ: js/utils.js y app.js)
// ⚠️ SIRVE PARA: Mostrar notificaciones nativas/web y arrancar toda la app 
//                esperando que el motor de base de datos termine de iniciar.
// ============================================================================
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

async function bootApp() {
    if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {                
        document.documentElement.style.setProperty('--android-nav-spacing', '28px');
    }

    if (window.ThemeManager) {
        await window.ThemeManager.init();
    }

    const dbReady = await sqliteService.init();
    const usuarioActivo = await sqliteService.getSession();
    
    requestAnimationFrame(() => {
        if (usuarioActivo && dbReady) {
            window.cargarVista('inicio', 'Inicio');
        } else {
            window.cargarVista('login', 'Login');
        }
    });
}

// INICIO DE LA APLICACIÓN
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(bootApp, 10);
});

// EXPOSICIÓN AL OBJETO WINDOW (Necesario para los OnClick de HTML)
window.sqliteService = sqliteService;
window.iniciarSesionApp = iniciarSesionApp;
window.cerrarSesion = cerrarSesion;
window.cargarVista = cargarVista;
window.mostrarNotificacion = mostrarNotificacion;
window.renderizarUsuarios = renderizarUsuarios;
window.abrirEditorUsuario = abrirEditorUsuario;
window.guardarEdicionUsuario = guardarEdicionUsuario;
window.editarMiPerfil = editarMiPerfil;
window.cancelarEdicion = cancelarEdicion;
window.ImageEditorManager = ImageEditorManager;