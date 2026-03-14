// ==============================================================================
// TEPY: www/js/api_db.js
// TEMBIAPO: API ha Sesión Rerekua (Frontend)
// ==============================================================================

console.log("🚀 Ñepyrũ api_db.js...");

// 1. ÑEMBOHEKO YPY
const APP_SLUG = "Titan"; 

// --- TENDA MOAMBUEHA ---
const ESTOY_EN_LOCAL = true; // true = Local, false = PythonAnywhere

const API_URL = ESTOY_EN_LOCAL 
    ? `http://127.0.0.1:5000/api/${APP_SLUG}` 
    : `https://kenth1977.pythonanywhere.com/api/${APP_SLUG}`;

console.log(`🌍 Tenda oñemboheko ohechauka hag̃ua: ${API_URL}`);

const apiDb = {
    // ==========================================
    // SESIÓN ÑANGAREKO (JWT)
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
                console.warn("Ñembyaty opa térã token ndoikói.");
                this.cerrarSesion();
                return { status: 'error', error: 'Ñembyaty opa. Eike jey, ndeporãramo.' };
            }

            return await respuesta.json();
        } catch (error) {
            console.error(`Apañuãi ojejerurévo ${endpoint}:`, error);
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
            return { exito: false, error: "Apañuãi ñembojoajúpe servidor ndive." };
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
            return { exito: false, error: "Apañuãi ñembojoajúpe servidor ndive." };
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
            return { exito: false, error: "Apañuãi ñembojoajúpe servidor ndive." };
        }
    },

    obtenerMisRutas: async function() {
        try {
            return await this.fetchProtegido('/mis_rutas', { method: 'GET' });
        } catch (error) {
            return { status: 'error', error: "Apañuãi ñembojoajúpe." };
        }
    },

    crearRuta: async function(nombre_ruta, distancia_km) {
        try {
            return await this.fetchProtegido('/mis_rutas', {
                method: 'POST',
                body: JSON.stringify({ nombre_ruta, distancia_km })
            });
        } catch (error) {
            return { status: 'error', error: "Apañuãi ñembojoajúpe." };
        }
    },

    eliminarRuta: async function(ruta_id) {
        try {
            return await this.fetchProtegido(`/mis_rutas/${ruta_id}`, { method: 'DELETE' });
        } catch (error) {
            return { status: 'error', error: "Apañuãi ñembojoajúpe." };
        }
    },

    // ==========================================
    // MAGIA NATIVA: BIOMETRÍA (Kuã rapykuere / Tova)
    // ==========================================
    
    biometria: {
        verificarDisponibilidad: async function() {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return false;
                const result = await window.Capacitor.Plugins.NativeBiometric.isAvailable();
                return result.isAvailable;
            } catch (e) {
                console.warn("Ko tendápe ndojapói biometría.", e);
                return false;
            }
        },

        guardarCredenciales: async function(email, password) {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return;
                await window.Capacitor.Plugins.NativeBiometric.setCredentials({
                    username: email,
                    password: password,
                    server: 'com.titan.app' // Ñembojoaju capacitor.config.json ndive
                });
                console.log("Ñe'ẽñemi oñongatu porãma native keychain-pe.");
            } catch (e) {
                console.error("Apañuãi biometría ñongatúpe", e);
            }
        },

        eliminarCredenciales: async function() {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return;
                await window.Capacitor.Plugins.NativeBiometric.deleteCredentials({
                    server: 'com.titan.app'
                });
                console.log("Marandu biometría oñembogue.");
            } catch (e) {
                console.error("Apañuãi biometría ñemboguépe", e);
            }
        },

        iniciarSesion: async function() {
            try {
                if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) {
                    return { exito: false, error: "Ko'ápe ndojapói biometría." };
                }
                
                // Oipe'a moñe'ẽhára kuã rapykuere rehegua (Under-display fix)
                // Ñe'ẽ ha myesakãha ha'e hína mba'e guasu Android-pe g̃uarã
                const credentials = await window.Capacitor.Plugins.NativeBiometric.getCredentials({
                    server: 'com.titan.app',
                    reason: 'Eipuru ne kuã rapykuere eike hag̃ua ko\'ápe',
                    title: 'Biometría Ñepyrũ',
                    subtitle: 'Ehechauka mávapa nde'
                });

                if (credentials && credentials.username && credentials.password) {
                    // Eike ijeheguiete ñe'ẽñemi oñenohẽva kuã rapykuerégui rupive
                    return await apiDb.login(credentials.username, credentials.password);
                }
                return { exito: false, error: "Ndjejuhúi marandu ymave guare." };
            } catch (e) {
                console.error("Apañuãi biometría rupive", e);
                return { exito: false, error: "Moñe'ẽhára oñemboty térã kuã rapykuere ndojeikuaái." };
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
            errorDiv.textContent = "Ehai ne ñe'ẽveve ha ne ñe'ẽñemi.";
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    if (errorDiv) errorDiv.classList.add('d-none');
    if (btnText) btnText.classList.add('d-none');
    if (btnSpinner) btnSpinner.classList.remove('d-none');
    if (btnLogin) {
        btnLogin.disabled = true;
        // Text changes to 'Eike hína...' during loading
        btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Eike hína...';
    }

    // Llama al backend (vía fetch)
    const resultado = await apiDb.login(email, password);

    if (btnText) btnText.classList.remove('d-none');
    if (btnSpinner) btnSpinner.classList.add('d-none');
    if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.innerHTML = 'EIKE SISTEMA-PE'; // Restored text in Guarani
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
            errorDiv.textContent = resultado.error || "Apañuãi eike hag̃ua.";
            errorDiv.classList.remove('d-none');
        }
    }
};

// Nueva función Global para procesar Login Biométrico desde la UI
window.procesarLoginBiometrico = async function() {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) errorDiv.classList.add('d-none');
    
    // Abre el lector de huellas nativo
    const resultado = await apiDb.biometria.iniciarSesion();
    
    if (resultado.exito) {
        // Redirigir si la huella es correcta
        if (window.mostrarNotificacion) window.mostrarNotificacion("¡Nde ha'e hína! Eike porã.", "success");
        
        const btnInicioMenu = document.getElementById('btn-nav-inicio');
        if (typeof cargarVista === 'function') {
            cargarVista('inicio', btnInicioMenu, 'bi-house');
        } else {
            window.location.reload();
        }
    } else {
        if (errorDiv) {
            errorDiv.textContent = resultado.error || "Apañuãi biometría-pe.";
            errorDiv.classList.remove('d-none');
        }
    }
};

window.apiDb = apiDb;