// ==============================================================================
// ARCHIVO: www/js/api_db.js
// ROL: Controlador de API y Sesiones (Frontend)
// ==============================================================================

console.log("🚀 Iniciando api_db.js...");

// 1. CONFIGURACIÓN BASE
const APP_SLUG = "Osprey"; 

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
            return { exito: false, error: "Error de conexión con el servidor local." };
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
                    server: 'com.titan.app' // Debe coincidir con tu appId en capacitor.config.json
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
                // IMPORTANTE: Para sensores en pantalla (Under-display), reason y title son obligatorios
                const credentials = await window.Capacitor.Plugins.NativeBiometric.getCredentials({
                    server: 'com.titan.app',
                    reason: 'Usa tu huella dactilar para acceder de forma segura',
                    title: 'Autenticación Biométrica',
                    subtitle: 'Confirma tu identidad para ingresar'
                });

                if (credentials && credentials.username && credentials.password) {
                    // Login automático usando la contraseña rescatada de la huella
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
// CONTROLADOR DE UI GLOBAL PARA LOGIN Y PREFERENCIAS
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
            errorDiv.textContent = "Por favor ingresa tu correo y contraseña.";
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    if (errorDiv) errorDiv.classList.add('d-none');
    if (btnText) btnText.classList.add('d-none');
    if (btnSpinner) btnSpinner.classList.remove('d-none');
    if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>INGRESANDO...';
    }

    // Llama al backend (vía fetch)
    const resultado = await apiDb.login(email, password);

    if (btnText) btnText.classList.remove('d-none');
    if (btnSpinner) btnSpinner.classList.add('d-none');
    if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.innerHTML = 'INGRESAR AL SISTEMA';
    }

    if (resultado.exito) {
        if (recordarCheckbox && recordarCheckbox.checked) {
            localStorage.setItem('credenciales_guardadas', JSON.stringify({ email, password }));
            // Guardamos la contraseña cifrada en el llavero biométrico
            await apiDb.biometria.guardarCredenciales(email, password);
        } else {
            localStorage.removeItem('credenciales_guardadas');
            // Eliminamos la huella si el usuario desmarca
            await apiDb.biometria.eliminarCredenciales();
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

// Función Global para procesar Login Biométrico desde la UI
window.procesarLoginBiometrico = async function() {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) errorDiv.classList.add('d-none');
    
    // Abre el lector de huellas nativo
    const resultado = await apiDb.biometria.iniciarSesion();
    
    if (resultado.exito) {
        // Redirigir si la huella es correcta
        if (window.mostrarNotificacion) window.mostrarNotificacion("¡Identidad verificada!", "success");
        
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

// ==========================================
// CONFIGURACIÓN DE VISIBILIDAD DE BIOMETRÍA
// ==========================================

// 1. Inyectamos un CSS dinámico para ocultar el botón si la preferencia lo marca
document.head.insertAdjacentHTML('beforeend', '<style>body.ocultar-biometria #btn-bio-login { display: none !important; }</style>');

// 2. Aplicamos la preferencia guardada de inmediato al iniciar
if (localStorage.getItem('mostrar_biometria') === 'false') {
    document.body.classList.add('ocultar-biometria');
}

// 3. Función para cambiar el estado (Se llamará desde Ajustes Avanzados)
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
    
    // Actualizamos visualmente el botón en Ajustes si estamos en esa vista
    window.actualizarTextoBotonBiometria();
};

// 4. Función para actualizar la interfaz del botón en la página de Ajustes
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
                    <i class="bi bi-toggle-on text-success ms-auto fs-3"></i>
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
                    <i class="bi bi-toggle-off text-secondary ms-auto fs-3"></i>
                </div>
            `;
        }
    }
};

window.apiDb = apiDb;