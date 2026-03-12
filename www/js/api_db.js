// ==============================================================================
// ARCHIVO: www/js/api_db.js
// ROL: Controlador de API y Sesiones (Frontend)
// ==============================================================================

console.log("🚀 Iniciando api_db.js...");

// 1. CONFIGURACIÓN BASE
const APP_SLUG = "altair"; 

// --- INTERRUPTOR DE ENTORNO ---
const ESTOY_EN_LOCAL = true; // true = Local, false = PythonAnywhere

const API_URL = ESTOY_EN_LOCAL 
    ? `http://127.0.0.1:5000/api/${APP_SLUG}` 
    : `https://kenth1977.pythonanywhere.com/api/${APP_SLUG}`;

console.log(`🌍 Entorno configurado apuntando a: ${API_URL}`);

const apiDb = {
    // ==========================================
    // GESTIÓN DE SESIONES (JWT)
    // ==========================================
    
    guardarSesion: function(token, usuario) {
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
    },

    obtenerToken: function() {
        return localStorage.getItem('jwt_token');
    },

    obtenerUsuario: function() {
        const usu = localStorage.getItem('usuario');
        return usu ? JSON.parse(usu) : null;
    },

    cerrarSesion: function() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('usuario');
        if (typeof cargarVista === 'function') {
            cargarVista('login', document.getElementById('btn-nav-inicio'), 'bi-house');
        } else {
            window.location.reload();
        }
    },

    estaAutenticado: function() {
        return this.obtenerToken() !== null;
    },

    // ==========================================
    // NÚCLEO DE PETICIONES (FETCH WRAPPER)
    // ==========================================

    fetchProtegido: async function(endpoint, opciones = {}) {
        const token = this.obtenerToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...(opciones.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { ...opciones, headers };

        try {
            const respuesta = await fetch(`${API_URL}${endpoint}`, config);
            
            if (respuesta.status === 401) {
                console.warn("Sesión expirada o token inválido.");
                this.cerrarSesion();
                return { status: 'error', error: 'Sesión expirada. Por favor, inicia sesión nuevamente.' };
            }

            return await respuesta.json();
        } catch (error) {
            console.error(`Error en la petición a ${endpoint}:`, error);
            throw error;
        }
    },

    // ==========================================
    // FUNCIONES DE AUTENTICACIÓN
    // ==========================================

    login: async function(email, password) {
        try {
            const data = await this.fetchProtegido('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (data.status === 'ok') {
                this.guardarSesion(data.token, data.usuario);
                return { exito: true, usuario: data.usuario };
            } else {
                return { exito: false, error: data.error };
            }
        } catch (error) {
            return { exito: false, error: "Error de conexión con el servidor local." };
        }
    },

    registro: async function(nombre, email, password) {
        try {
            const data = await this.fetchProtegido('/registro', {
                method: 'POST',
                body: JSON.stringify({ nombre, email, password })
            });

            if (data.status === 'ok') {
                this.guardarSesion(data.token, data.usuario);
                return { exito: true, usuario: data.usuario };
            } else {
                return { exito: false, error: data.error };
            }
        } catch (error) {
            return { exito: false, error: "Error de conexión con el servidor local." };
        }
    },

    // ==========================================
    // FUNCIONES DE PERFIL Y RUTAS (ALTAIR)
    // ==========================================

    cambiarPassword: async function(password_actual, nueva_password) {
        try {
            const data = await this.fetchProtegido('/perfil/password', {
                method: 'PUT',
                body: JSON.stringify({ password_actual, nueva_password })
            });
            return { exito: data.status === 'ok', error: data.error, mensaje: data.message };
        } catch (error) {
            return { exito: false, error: "Error de conexión con el servidor." };
        }
    },

    obtenerMisRutas: async function() {
        try {
            return await this.fetchProtegido('/mis_rutas', { method: 'GET' });
        } catch (error) {
            return { status: 'error', error: "Error de conexión." };
        }
    },

    crearRuta: async function(nombre_ruta, distancia_km) {
        try {
            return await this.fetchProtegido('/mis_rutas', {
                method: 'POST',
                body: JSON.stringify({ nombre_ruta, distancia_km })
            });
        } catch (error) {
            return { status: 'error', error: "Error de conexión." };
        }
    },

    eliminarRuta: async function(ruta_id) {
        try {
            return await this.fetchProtegido(`/mis_rutas/${ruta_id}`, { method: 'DELETE' });
        } catch (error) {
            return { status: 'error', error: "Error de conexión." };
        }
    },

    // ==========================================
    // MAGIA NATIVA: BIOMETRÍA (Huella / FaceID)
    // ==========================================
    
    biometria: {
        verificarDisponibilidad: async function() {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return false;
                const result = await window.Capacitor.Plugins.NativeBiometric.isAvailable();
                return result.isAvailable;
            } catch (e) {
                console.warn("Biometría no soportada en este entorno.", e);
                return false;
            }
        },

        guardarCredenciales: async function(email, password) {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return;
                await window.Capacitor.Plugins.NativeBiometric.setCredentials({
                    username: email,
                    password: password,
                    server: 'com.pepino.app' // Debe coincidir con tu capacitor.config.json
                });
                console.log("Credenciales aseguradas en el llavero nativo.");
            } catch (e) {
                console.error("Error al guardar biometría", e);
            }
        },

        eliminarCredenciales: async function() {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return;
                await window.Capacitor.Plugins.NativeBiometric.deleteCredentials({
                    server: 'com.pepino.app'
                });
                console.log("Credenciales biométricas eliminadas.");
            } catch (e) {
                console.error("Error al eliminar biometría", e);
            }
        },

        iniciarSesion: async function() {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) {
                    return { exito: false, error: "Biometría no soportada aquí." };
                }
                
                // Abre el lector nativo de huella del teléfono
                const credentials = await window.Capacitor.Plugins.NativeBiometric.getCredentials({
                    server: 'com.pepino.app'
                });

                if (credentials && credentials.username && credentials.password) {
                    // Login automático usando la contraseña rescatada de la huella
                    return await apiDb.login(credentials.username, credentials.password);
                }
                return { exito: false, error: "No se encontraron credenciales previas." };
            } catch (e) {
                console.error("Autenticación biométrica cancelada/fallida", e);
                return { exito: false, error: "Lector cancelado o error al leer." };
            }
        }
    }
};

// ==========================================
// CONTROLADOR DE UI GLOBAL PARA LOGIN
// ==========================================

window.togglePassword = function() {
    const passwordInput = document.getElementById('login-password');
    const icon = document.getElementById('icono-ojo');
    if (passwordInput && icon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('bi-eye-slash', 'bi-eye');
        }
    }
};

window.cargarCredencialesGuardadas = function() {
    const credenciales = localStorage.getItem('credenciales_guardadas');
    if (credenciales) {
        try {
            const data = JSON.parse(credenciales);
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const recordarCheckbox = document.getElementById('login-recordar');
            
            if (emailInput && passwordInput && recordarCheckbox) {
                emailInput.value = data.email || '';
                passwordInput.value = data.password || '';
                recordarCheckbox.checked = true;
            }
        } catch (e) {}
    }
};

window.procesarLoginUI = async function(event) {
    if(event) event.preventDefault();
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const recordarCheckbox = document.getElementById('login-recordar'); 
    const errorDiv = document.getElementById('login-error');
    const btnText = document.getElementById('login-text');
    const btnSpinner = document.getElementById('login-spinner');
    const btnLogin = document.getElementById('btn-login');

    if (!email || !password) {
        if (errorDiv) {
            errorDiv.textContent = "Por favor ingresa correo y contraseña.";
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    if (errorDiv) errorDiv.classList.add('d-none');
    if (btnText) btnText.classList.add('d-none');
    if (btnSpinner) btnSpinner.classList.remove('d-none');
    if (btnLogin) btnLogin.disabled = true;

    const resultado = await apiDb.login(email, password);

    if (btnText) btnText.classList.remove('d-none');
    if (btnSpinner) btnSpinner.classList.add('d-none');
    if (btnLogin) btnLogin.disabled = false;

    if (resultado.exito) {
        if (recordarCheckbox && recordarCheckbox.checked) {
            localStorage.setItem('credenciales_guardadas', JSON.stringify({ email, password }));
        } else {
            localStorage.removeItem('credenciales_guardadas');
        }

        const btnInicioMenu = document.getElementById('btn-nav-inicio');
        if (typeof cargarVista === 'function') {
            cargarVista('inicio', btnInicioMenu, 'bi-house');
        } else {
            window.location.reload();
        }
    } else {
        if (errorDiv) {
            errorDiv.textContent = resultado.error || "Error al iniciar sesión.";
            errorDiv.classList.remove('d-none');
        }
    }
};

// Nueva función Global para procesar Login Biométrico desde la UI
window.procesarLoginBiometrico = async function() {
    const btnBio = document.getElementById('btn-bio-login');
    const errorDiv = document.getElementById('login-error');
    
    if (errorDiv) errorDiv.classList.add('d-none');
    
    // Abre el lector de huellas
    const resultado = await apiDb.biometria.iniciarSesion();
    
    if (resultado.exito) {
        // Redirigir si la huella es correcta y el login fue exitoso
        const btnInicioMenu = document.getElementById('btn-nav-inicio');
        if (typeof cargarVista === 'function') {
            cargarVista('inicio', btnInicioMenu, 'bi-house');
        } else {
            window.location.reload();
        }
    } else {
        if (errorDiv) {
            errorDiv.textContent = resultado.error || "Error biométrico.";
            errorDiv.classList.remove('d-none');
        }
    }
};