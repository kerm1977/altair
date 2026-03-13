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

    // --- NUEVA FUNCIÓN PARA HASHEAR AL SUPERUSUARIO ---
    hashAdminPass: async function(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
                // APLICAMOS HASHEO ANTES DE GUARDAR
                const hashedPass = await this.hashAdminPass(user.password);
                await this.db.run(
                    "INSERT INTO usuarios (nombre, email, password, pin, rol, estado, foto_perfil) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    ['Administrador', user.email, hashedPass, user.pin, 'superusuario', 'activo', '']
                );
            }
        }
    },

    simularBDWeb: async function(superusersFromJSON) {
        let users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
        if (users.length === 0) {
            if (superusersFromJSON && superusersFromJSON.length > 0) {
                const adaptado = [];
                for(let u of superusersFromJSON) {
                    const hashedPass = await this.hashAdminPass(u.password); // Hashear simulación web
                    adaptado.push({...u, password: hashedPass, rol: 'superusuario', estado: 'activo', nombre: 'Administrador', foto_perfil: ''});
                }
                localStorage.setItem("mock_db_usuarios", JSON.stringify(adaptado));
            } else {
                const hashedDefault = await this.hashAdminPass("admin"); // Hashear simulación default
                localStorage.setItem("mock_db_usuarios", JSON.stringify([{email: "admin@app.com", password: hashedDefault, pin: "00000000", rol: "superusuario", estado: "activo", nombre: "Administrador", foto_perfil: ''}]));
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

window.sqliteService = sqliteService;