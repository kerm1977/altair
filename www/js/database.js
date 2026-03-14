// ============================================================================
// ⚠️ FRAGMENTO 1: BASE DE DATOS (A FUTURO SERÁ: js/database.js)
// ⚠️ SIRVE PARA: Toda la interacción con el motor nativo SQLite, creación de
//                tablas, migraciones, persistencia de sesiones y consultas CRUD.
//                *AHORA OBEDECE ÓRDENES DEL SCRIPT "MODO DIOS" (FIXED)*
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
            let useEncryption = false;
            let dbPassword = "";
            let dbAction = 'combine'; 

            try {
                if(logElement) logElement.innerText = "Verificando órdenes del MODO DIOS...";
                
                // 🛠️ FIX: Eliminamos el '?t=' porque el WebView de Android/iOS 
                // lo interpreta como parte del nombre del archivo y da error 404.
                // Usamos headers puros para evitar la caché.
                const response = await fetch('init_data.json', { 
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } 
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.dbName) this.dbName = data.dbName.replace('.db', ''); 
                    if (data.superusers) superusers = data.superusers;
                    if (data.useEncryption) useEncryption = data.useEncryption;
                    if (data.dbPassword) dbPassword = data.dbPassword;
                    if (data.dbAction) dbAction = data.dbAction;
                } else {
                    console.warn("[SQLite] init_data.json respondió con error:", response.status);
                }
            } catch (e) {
                console.log("[SQLite] init_data.json no encontrado o inaccesible:", e);
            }

            if (!this.isWeb && window.capacitorExports) {
                if(logElement) logElement.innerText = "Optimizando Motor SQLite...";
                const { CapacitorSQLite, SQLiteConnection } = capacitorExports;
                const sqlite = new SQLiteConnection(CapacitorSQLite);
                
                const USE_ENCRYPTION = useEncryption; 
                const ENCRYPTION_MODE = USE_ENCRYPTION ? (dbPassword ? "secret" : "encryption") : "no-encryption";

                if (USE_ENCRYPTION && dbPassword) {
                    console.log("[SQLite] Registrando clave maestra SQLCipher...");
                    try {
                        await sqlite.setEncryptionSecret(dbPassword);
                    } catch(err) {
                        console.log("[SQLite] Error al asignar secreto:", err);
                    }
                }

                // NACE LA BASE DE DATOS FÍSICA
                this.db = await sqlite.createConnection(this.dbName, USE_ENCRYPTION, ENCRYPTION_MODE, 1, false);
                await this.db.open();
                
                await this.db.execute("PRAGMA journal_mode = WAL;");
                await this.db.execute("PRAGMA synchronous = NORMAL;");
                await this.db.execute("PRAGMA cache_size = -10000;");
                await this.db.execute("PRAGMA temp_store = MEMORY;");
                
                if(logElement) logElement.innerText = "Verificando estructura...";
                await this.crearTablas();

                // Migraciones seguras (Incluyendo la nueva columna de Tema)
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN nombre TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN telefono TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN fecha_nacimiento TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN id_nacional TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN foto_perfil TEXT DEFAULT '';"); } catch(e){}
                try { await this.db.execute("ALTER TABLE usuarios ADD COLUMN tema TEXT DEFAULT 'sistema';"); } catch(e){}

                // PROCESAR ORDEN DE CONFIGURAR_PROYECTO.JS
                await this.procesarOrdenesDelDios(superusers, dbAction);

                console.log(`[SQLite] NATIVO ACTIVADO. Operando en Android/iOS.`);
            } else {
                console.log("⚠️ [MODO WEB] Simulando entorno en el navegador...");
                await this.procesarOrdenesDelDios(superusers, dbAction);
            }
            
            return true;
        } catch (e) {
            console.error("[SQLite] Error Crítico al inicializar:", e);
            if(logElement) logElement.innerText = "Error de Encriptación: Es posible que la clave sea incorrecta o la DB ya exista con otra clave.";
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
                estado TEXT DEFAULT 'activo',
                tema TEXT DEFAULT 'sistema'
            );
            CREATE INDEX IF NOT EXISTS idx_usuarios_auth ON usuarios(email, password);

            CREATE TABLE IF NOT EXISTS app_config (
                clave TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL
            );
        `;
        if(this.db) await this.db.execute(query);
    },

    // ------------------------------------------------------------------------
    // MÉTODOS GENÉRICOS DE CONFIGURACIÓN
    // ------------------------------------------------------------------------
    setConfig: async function(clave, valor) {
        if (!this.isWeb && this.db) {
            await this.db.run("INSERT OR REPLACE INTO app_config (clave, valor) VALUES (?, ?)", [clave, valor]);
        } else {
            localStorage.setItem(clave, valor);
        }
    },

    getConfig: async function(clave) {
        if (!this.isWeb && this.db) {
            const res = await this.db.query("SELECT valor FROM app_config WHERE clave = ?", [clave]);
            return (res.values && res.values.length > 0) ? res.values[0].valor : null;
        } else {
            return localStorage.getItem(clave);
        }
    },

    // ------------------------------------------------------------------------
    // MODO DIOS: PROCESADOR DE INTENCIONES (MERGE vs OVERWRITE)
    // ------------------------------------------------------------------------
    procesarOrdenesDelDios: async function(superusers, action) {
        if (!superusers || superusers.length === 0) {
            console.log("[SQLite] No hay órdenes de superusuarios en init_data.json.");
            return;
        }

        // 1. 🛠️ FIX: Creamos una firma única (Hash) basada exactamente en lo que dictó el script.
        // Si modificas un usuario en el script, la firma cambia y la app obedece al instante.
        const firmaActual = action + "_" + JSON.stringify(superusers);
        const ultimaFirma = await this.getConfig('firma_dios');

        if (ultimaFirma === firmaActual) {
            console.log("[SQLite] La orden exacta ya fue procesada anteriormente. Sistema estable.");
            return; 
        }

        console.log(`[SQLite] 🔥 Ejecutando NUEVA ORDEN del Asistente: [${action.toUpperCase()}]`);

        if (!this.isWeb && this.db) {
            // ---> ENTORNO MÓVIL (NATIVO)
            if (action === 'overwrite') {
                console.log("[SQLite] ⚠️ FORMATEANDO TABLA DE USUARIOS POR ORDEN DIRECTA...");
                await this.db.execute("DELETE FROM usuarios;");
                await this.clearSession(); 
            }

            // Realizamos Merge/Insert de los superusuarios
            for (const user of superusers) {
                try {
                    const check = await this.db.query("SELECT id FROM usuarios WHERE email = ?", [user.email]);
                    
                    if (check.values && check.values.length > 0) {
                        // Merge
                        await this.db.run(
                            "UPDATE usuarios SET nombre=?, password=?, pin=?, rol=?, estado=?, tema=? WHERE email=?",
                            [user.nombre, user.password, user.pin, user.rol, user.estado, user.tema || 'sistema', user.email]
                        );
                        console.log(`[SQLite] Superusuario actualizado (Merge): ${user.email}`);
                    } else {
                        // Insert
                        await this.db.run(
                            "INSERT INTO usuarios (nombre, email, password, pin, rol, estado, foto_perfil, telefono, tema) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            [user.nombre, user.email, user.password, user.pin, user.rol, user.estado, user.foto_perfil || '', user.telefono || '', user.tema || 'sistema']
                        );
                        console.log(`[SQLite] Superusuario inyectado (Nuevo): ${user.email}`);
                    }
                } catch(e) {
                    console.error(`[SQLite] Error inyectando a ${user.email}:`, e);
                }
            }
        } else {
            // ---> ENTORNO WEB (MOCK)
            if (action === 'overwrite') {
                localStorage.removeItem("mock_db_usuarios");
                localStorage.removeItem("usuario_activo");
            }
            
            let usersMock = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            
            for (const user of superusers) {
                let index = usersMock.findIndex(u => u.email === user.email);
                if (index !== -1) {
                    usersMock[index] = {...usersMock[index], ...user};
                } else {
                    usersMock.push(user);
                }
            }
            localStorage.setItem("mock_db_usuarios", JSON.stringify(usersMock));
        }

        // 2. Guardamos la "Firma" de la orden para sellar el trabajo
        await this.setConfig('firma_dios', firmaActual);
        console.log("[SQLite] ✔️ Órdenes procesadas y memorizadas con éxito.");
    },

    // --- FUNCIÓN ORIGINAL MANTENIDA POR SI SE REQUIERE HASHEO CLIENT-SIDE ---
    hashAdminPass: async function(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    setSession: async function(userObj) {
        await this.setConfig('usuario_activo', JSON.stringify(userObj));
    },

    getSession: async function() {
        const usu = await this.getConfig('usuario_activo');
        return usu ? JSON.parse(usu) : null;
    },

    clearSession: async function() {
        if (!this.isWeb && this.db) {
            await this.db.run("DELETE FROM app_config WHERE clave = ?", ['usuario_activo']);
        } else {
            localStorage.removeItem('usuario_activo');
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
                    "INSERT INTO usuarios (nombre, email, password, telefono, fecha_nacimiento, id_nacional, rol, estado, foto_perfil, tema) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [nombre, email, password, telefono, fecha_nacimiento, id_nacional, 'usuario', 'activo', '', 'sistema'] 
                );
                return true;
            } catch(e) {
                console.error("[SQLite] Error al insertar usuario:", e);
                return false;
            }
        } else {
            const users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
            if (users.find(u => u.email === email)) return false; 
            users.push({email, password, nombre, telefono, fecha_nacimiento, id_nacional, foto_perfil: '', rol: 'usuario', estado: 'activo', tema: 'sistema'});
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
                // SE AÑADEN LOS CAMPOS A LA QUERY PARA NATIVO (Incluyendo el Tema)
                await this.db.run(
                    "UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, password = ?, rol = ?, estado = ?, id_nacional = ?, fecha_nacimiento = ?, tema = ? WHERE email = ?",
                    [datos.nombre, datos.email, datos.telefono, datos.password, datos.rol, datos.estado, datos.id_nacional, datos.fecha_nacimiento, datos.tema || 'sistema', emailViejo]
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
                users[index].id_nacional = datos.id_nacional;
                users[index].fecha_nacimiento = datos.fecha_nacimiento;
                // SE AÑADE EL TEMA AL MOCK PARA DESARROLLO WEB
                users[index].tema = datos.tema || 'sistema';
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

window.sqliteService = sqliteService;