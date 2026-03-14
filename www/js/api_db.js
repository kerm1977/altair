// ==============================================================================
// ARCHIVO: www/js/api_db.js
// ROL: Controlador de API y Sesiones (Frontend)
// ==============================================================================

console.log("🚀 Iniciando api_db.js...");

// 1. CONFIGURACIÓN BASE
const APP_SLUG = "Altair"; 

// --- INTERRUPTOR DE ENTORNO ---
const ESTOY_EN_LOCAL = true; // true = Local, false = PythonAnywhere

const API_URL = ESTOY_EN_LOCAL 
    ? `http://127.0.0.1:5000/api/${APP_SLUG}` 
    : `https://kenth1977.pythonanywhere.com/api/${APP_SLUG}`;

console.log(`🌍 Entorno configurado apuntando a: ${API_URL}`);

const apiDb = {
    // ==========================================
    // GESTIÓN DE SESIONES (JWT / LOCAL)
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
        if (typeof window.cargarVista === 'function') {
            window.cargarVista('login', 'Login');
        } else {
            window.location.reload();
        }
    },

    estaAutenticado: function() {
        return this.obtenerToken() !== null || localStorage.getItem('usuario') !== null;
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
    // FUNCIONES DE AUTENTICACIÓN (API)
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
                    server: 'com.titan.app' // Identificador del llavero
                });
                console.log("Credenciales aseguradas en el llavero nativo (Keychain/Keystore).");
            } catch (e) {
                console.error("Error al guardar biometría", e);
            }
        },

        eliminarCredenciales: async function() {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return;
                await window.Capacitor.Plugins.NativeBiometric.deleteCredentials({
                    server: 'com.titan.app'
                });
                console.log("Credenciales biométricas eliminadas del sistema.");
            } catch (e) {
                console.error("Error al eliminar biometría", e);
            }
        },

        iniciarSesion: async function() {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) {
                    return { exito: false, error: "Biometría no soportada en este dispositivo." };
                }
                
                // Abre el lector nativo de huella del teléfono
                // Textos requeridos para que funcione en pantallas Under-Display de Android
                const credentials = await window.Capacitor.Plugins.NativeBiometric.getCredentials({
                    server: 'com.titan.app',
                    reason: 'Usa tu huella dactilar para acceder de forma segura',
                    title: 'Autenticación Biométrica',
                    subtitle: 'Confirma tu identidad para ingresar'
                });

                if (credentials && credentials.username && credentials.password) {
                    // CORRECCIÓN APK: Intenta iniciar sesión primero con la base de datos local SQLite
                    if (window.sqliteService) {
                        try {
                            const encoder = new TextEncoder();
                            const data = encoder.encode(credentials.password);
                            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                            const hashArray = Array.from(new Uint8Array(hashBuffer));
                            const passHashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                            
                            const user = await window.sqliteService.login(credentials.username, passHashed);
                            
                            if (user) {
                                if (user.estado === 'inactivo') return { exito: false, error: "Cuenta inactiva o bloqueada." };
                                await window.sqliteService.setSession(user);
                                return { exito: true, usuario: user };
                            }
                        } catch (err) {
                            console.error("Error validando localmente:", err);
                        }
                    }
                    
                    // Si SQLite falla o no está, intenta con la API externa (fallback)
                    return await apiDb.login(credentials.username, credentials.password);
                }
                return { exito: false, error: "No se encontraron credenciales previas guardadas." };
            } catch (e) {
                console.error("Autenticación biométrica cancelada/fallida", e);
                return { exito: false, error: "Lector cancelado o huella no reconocida." };
            }
        }
    }
};

// ==========================================
// CONTROLADOR DE UI GLOBAL PARA LOGIN
// ==========================================

// CORRECCIÓN OJO: Ahora acepta parámetros para funcionar en cualquier formulario
window.togglePassword = function(inputId = 'login-password', iconId = 'icono-ojo-login') {
    const passwordInput = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (passwordInput && icon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
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
    const btnText = document.getElementById('login-text') || document.getElementById('btn-login-submit');
    const btnSpinner = document.getElementById('login-spinner');
    const btnLogin = document.getElementById('btn-login') || document.getElementById('btn-login-submit');

    if (!email || !password) {
        if (errorDiv) {
            errorDiv.textContent = "Por favor ingresa tu correo y contraseña.";
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    if (errorDiv) errorDiv.classList.add('d-none');
    if (btnLogin) btnLogin.disabled = true;
    if (btnSpinner) btnSpinner.classList.remove('d-none');
    if (btnText && btnText.tagName === 'SPAN') btnText.innerText = "INGRESANDO...";

    let resultado = { exito: false, error: "Servicio no disponible" };

    // CORRECCIÓN APK: Inicio de sesión offline vía SQLite primero
    if (window.sqliteService) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const passHashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            const user = await window.sqliteService.login(email, passHashed);
            
            if (user) {
                if (user.estado === 'inactivo') {
                    resultado = { exito: false, error: "Tu cuenta está inactiva o bloqueada." };
                } else {
                    await window.sqliteService.setSession(user);
                    resultado = { exito: true, usuario: user };
                }
            } else {
                resultado = { exito: false, error: "Credenciales incorrectas o usuario inexistente." };
            }
        } catch (err) {
            console.error("Error en BD Local:", err);
            resultado = { exito: false, error: "Error interno al consultar la base de datos." };
        }
    } else {
        // Fallback: Si no hay SQLite, intenta con el servidor (Solo web/online)
        resultado = await apiDb.login(email, password);
    }

    if (btnLogin) btnLogin.disabled = false;
    if (btnSpinner) btnSpinner.classList.add('d-none');
    if (btnText && btnText.tagName === 'SPAN') btnText.innerText = "INGRESAR AL SISTEMA";

    if (resultado.exito) {
        if (recordarCheckbox && recordarCheckbox.checked) {
            localStorage.setItem('credenciales_guardadas', JSON.stringify({ email, password }));
            // Guardamos la contraseña en el llavero biométrico del celular
            await apiDb.biometria.guardarCredenciales(email, password);
        } else {
            localStorage.removeItem('credenciales_guardadas');
            await apiDb.biometria.eliminarCredenciales();
        }

        if (window.mostrarNotificacion) window.mostrarNotificacion(`¡Bienvenido, ${resultado.usuario.nombre || 'Usuario'}!`, "success");

        if (typeof window.cargarVista === 'function') {
            window.cargarVista('inicio', 'Inicio');
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

window.procesarLoginBiometrico = async function() {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) errorDiv.classList.add('d-none');
    
    // Abre el lector de huellas
    const resultado = await apiDb.biometria.iniciarSesion();
    
    if (resultado.exito) {
        if (window.mostrarNotificacion) window.mostrarNotificacion(`¡Identidad verificada, bienvenido!`, "success");
        
        if (typeof window.cargarVista === 'function') {
            window.cargarVista('inicio', 'Inicio');
        } else {
            window.location.reload();
        }
    } else {
        if (errorDiv) {
            errorDiv.textContent = resultado.error || "Lector cancelado o error biométrico.";
            errorDiv.classList.remove('d-none');
        }
    }
};

// ==========================================
// CONFIGURACIÓN DE VISIBILIDAD DE BIOMETRÍA
// ==========================================

// CSS dinámico para ocultar el botón si la preferencia lo marca
document.head.insertAdjacentHTML('beforeend', '<style>body.ocultar-biometria #btn-bio-login { display: none !important; }</style>');

// Aplica la preferencia al cargar
if (localStorage.getItem('mostrar_biometria') === 'false') {
    document.body.classList.add('ocultar-biometria');
}

window.toggleBiometriaUI = function() {
    const estadoActual = localStorage.getItem('mostrar_biometria') !== 'false';
    const nuevoEstado = !estadoActual;
    localStorage.setItem('mostrar_biometria', nuevoEstado);
    
    if (nuevoEstado) {
        document.body.classList.remove('ocultar-biometria');
        if (window.mostrarNotificacion) window.mostrarNotificacion("Botón de biometría visible", "success");
    } else {
        document.body.classList.add('ocultar-biometria');
        if (window.mostrarNotificacion) window.mostrarNotificacion("Botón de biometría oculto", "info");
    }
    
    window.actualizarTextoBotonBiometria();
};

window.actualizarTextoBotonBiometria = function() {
    const btn = document.getElementById('btn-toggle-biometria-ajustes');
    if (btn) {
        const estado = localStorage.getItem('mostrar_biometria') !== 'false';
        if (estado) {
            btn.innerHTML = `
                <div class="card-body d-flex align-items-center p-3">
                    <div class="bg-success text-white rounded-circle p-3 me-3 d-flex align-items-center justify-content-center shadow-sm">
                         <i class="bi bi-fingerprint fs-4"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-1 text-dark">Biometría en Login</h6>
                        <small class="text-success fw-bold">Visible (Toque para ocultar)</small>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="text-success ms-auto" viewBox="0 0 16 16">
                        <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10H5zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
                    </svg>
                </div>
            `;
        } else {
            btn.innerHTML = `
                <div class="card-body d-flex align-items-center p-3">
                    <div class="bg-secondary text-white rounded-circle p-3 me-3 d-flex align-items-center justify-content-center shadow-sm">
                         <i class="bi bi-fingerprint fs-4"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-1 text-dark">Biometría en Login</h6>
                        <small class="text-muted fw-bold">Oculta (Toque para mostrar)</small>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="text-secondary ms-auto" viewBox="0 0 16 16">
                        <path d="M11 3a5 5 0 0 0 0 10h-6a5 5 0 0 0 0-10h6zm-6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
                    </svg>
                </div>
            `;
        }
    }
};

window.apiDb = apiDb;