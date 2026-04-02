// ==============================================================================
// ARCHIVO: js/index.js
// ROL: Lógica Principal, Router SPA y Autenticación
// ==============================================================================

// 🔮 Secuestro Global de Alertas
if (typeof window.alertSecuestrado === 'undefined') {
    window.alertSecuestrado = true;
    window.alert = function(message) {
        var alertMsg = document.getElementById('appAlertMessage');
        if(alertMsg) alertMsg.textContent = message;
        var alertModalElement = document.getElementById('appAlertModal');
        if (alertModalElement && typeof bootstrap !== 'undefined') {
            var modalInstance = bootstrap.Modal.getOrCreateInstance(alertModalElement);
            modalInstance.show();
        } else {
            console.log("Alerta nativa:", message);
        }
    };
}

// 🌓 Lógica de Tema
var htmlElement = document.documentElement;
var themeIcon = document.getElementById('themeIcon');
var savedTheme = localStorage.getItem('APP_THEME') || 'dark';

window.setTheme = function(theme) {
    htmlElement.setAttribute('data-bs-theme', theme);
    if(theme === 'dark') {
        if(themeIcon) themeIcon.className = "bi bi-sun-fill fs-5 text-warning"; 
        document.querySelectorAll('.btn-close').forEach(function(b) { b.classList.add('btn-close-white'); });
    } else {
        if(themeIcon) themeIcon.className = "bi bi-moon-stars-fill fs-5 text-dark"; 
        document.querySelectorAll('.btn-close').forEach(function(b) { b.classList.remove('btn-close-white'); });
    }
};

window.setTheme(savedTheme);

var btnThemeToggle = document.getElementById('btnThemeToggle');
if (btnThemeToggle && !btnThemeToggle.dataset.listenerAssigned) {
    btnThemeToggle.dataset.listenerAssigned = "true";
    btnThemeToggle.addEventListener('click', function() {
        var currentTheme = htmlElement.getAttribute('data-bs-theme');
        var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        window.setTheme(newTheme);
        localStorage.setItem('APP_THEME', newTheme);
    });
}

// ==============================================================================
// URL DINÁMICA MULTI-ENTORNO
// ==============================================================================
window.getApiUrl = function() {
    var env = localStorage.getItem('APP_ENV') || 'dev';
    return env === 'prod' ? localStorage.getItem('APP_PROD_URL') : (localStorage.getItem('APP_DEV_URL') || 'http://127.0.0.1:8090');
};

// ==============================================================================
// 🔄 ROUTER SPA: GESTOR DE VISTAS Y FRAGMENTOS
// ==============================================================================
window.cambiarVista = async function(vista) {
    var vLogin = document.getElementById('vista-login');
    var vRegistro = document.getElementById('vista-registro');
    var vDinamica = document.getElementById('vista-dinamica');
    var appRoot = document.getElementById('app-root');

    var user = JSON.parse(localStorage.getItem('PB_USER_DATA') || '{}');

    // 1. Configurar barra inferior de acuerdo a la sesión
    var btnAuth = document.getElementById('navBtnAuth');
    if (btnAuth) {
        if (user.id) {
            btnAuth.innerHTML = '<i class="bi bi-box-arrow-right fs-4 mb-1"></i><span style="font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px;">SALIR</span>';
            btnAuth.onclick = window.cerrarSesion;
            btnAuth.classList.remove('text-primary');
            btnAuth.classList.add('text-danger');
        } else {
            btnAuth.innerHTML = '<i class="bi bi-person-fill fs-4 mb-1"></i><span style="font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px;">LOGIN</span>';
            btnAuth.onclick = function() { window.cambiarVista('login'); };
            btnAuth.classList.remove('text-danger');
            btnAuth.classList.add('text-primary');
        }
    }

    var btnAjustes = document.getElementById('navBtnAjustes');
    if (btnAjustes) {
        if (user.id && (user.rol === 'Superusuario' || user.rol === 'Administrador' || (user.email && user.email.toLowerCase() === 'kenth1977@gmail.com'))) {
            btnAjustes.classList.remove('d-none');
            btnAjustes.classList.add('d-flex'); 
        } else {
            btnAjustes.classList.remove('d-flex');
            btnAjustes.classList.add('d-none');
        }
    }
    
    // Seguro de limpieza para los botones viejos
    var btnOldDash = document.getElementById('navBtnDashboard');
    var btnOldCpanel = document.getElementById('navBtnCpanel');
    if(btnOldDash) btnOldDash.classList.add('d-none');
    if(btnOldCpanel) btnOldCpanel.classList.add('d-none');

    // 2. Vistas Estáticas
    if (vista === 'login' || vista === 'registro') {
        if(vDinamica) { vDinamica.innerHTML = ''; vDinamica.classList.add('d-none'); }
        if(vLogin) { if(vista !== 'login') vLogin.classList.add('d-none'); else vLogin.classList.remove('d-none'); }
        if(vRegistro) { if(vista !== 'registro') vRegistro.classList.add('d-none'); else vRegistro.classList.remove('d-none'); }
        if(appRoot) { appRoot.style.alignItems = 'center'; appRoot.style.justifyContent = 'center'; }
        return;
    }

    // 3. Vistas Dinámicas
    if(!user.id && vista !== 'recuperacion' && vista !== 'resetPass') {
        window.cambiarVista('login');
        return;
    }

    if(appRoot) { appRoot.style.alignItems = 'stretch'; appRoot.style.justifyContent = 'flex-start'; }
    if(vLogin) vLogin.classList.add('d-none');
    if(vRegistro) vRegistro.classList.add('d-none');
    if(vDinamica) {
        vDinamica.classList.remove('d-none');
        vDinamica.innerHTML = '<div class="d-flex flex-column justify-content-center align-items-center mt-5 pt-5 text-themed"><div class="spinner-border text-info" style="width: 3rem; height: 3rem;" role="status"></div><h5 class="mt-3 fw-bold opacity-75">Conectando módulo...</h5></div>';
    }

    // 4. Inyectar Fragmento
    try {
        var res = await fetch(vista + '.html');
        if(!res.ok) throw new Error("Archivo de módulo no encontrado.");
        var htmlRaw = await res.text();
        
        var parser = new DOMParser();
        var doc = parser.parseFromString(htmlRaw, 'text/html');
        var fragmentContent = doc.body ? doc.body.innerHTML : htmlRaw;

        if(vDinamica) vDinamica.innerHTML = fragmentContent;
        
        if(vDinamica) {
            Array.from(vDinamica.querySelectorAll("script")).forEach(function(oldScript) {
                var newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach(function(attr) { newScript.setAttribute(attr.name, attr.value); });
                if(oldScript.innerHTML) {
                    var scriptContent = oldScript.innerHTML.replace(/document\.addEventListener\(['"`]DOMContentLoaded['"`]\s*,\s*(\(\)\s*=>\s*\{|function\s*\(\)\s*\{)/g, "setTimeout($1");
                    newScript.appendChild(document.createTextNode(scriptContent));
                }
                if(oldScript.parentNode) oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        }

        // =========================================================
        // 🚀 5. LÓGICA ESPECÍFICA POR VISTAS
        // =========================================================
        if (vista === 'home') {
            setTimeout(function() {
                var userData = JSON.parse(localStorage.getItem('PB_USER_DATA') || '{}');
                if(userData.id) {
                    var welcomeEl = document.getElementById('welcomeTitle');
                    var topNavName = document.getElementById('topNavName');
                    
                    var nombreCompleto = userData.name || userData.username || 'Usuario';
                    var primerNombre = nombreCompleto.split(' ')[0]; 
                    
                    if(welcomeEl) welcomeEl.innerText = '¡Bienvenido al Home, ' + primerNombre + '!';
                    
                    if(topNavName) {
                        topNavName.innerText = 'Hola, ' + primerNombre;
                        topNavName.className = 'text-warning small fw-bold text-end'; 
                        topNavName.style.cssText = 'background: transparent !important; box-shadow: none !important; border: none !important; backdrop-filter: none !important; padding: 0 !important; margin-top: 6px !important;';
                        if(topNavName.parentElement) topNavName.parentElement.style.right = '90px';
                    }
                }
            }, 150);
        }

    } catch (error) {
        if(vDinamica) vDinamica.innerHTML = '<div class="text-center mt-5 p-4 mx-3 glass-panel border-danger"><i class="bi bi-exclamation-octagon-fill text-danger" style="font-size: 4rem;"></i><h4 class="mt-3 fw-bold text-themed">Error de Módulo</h4><p class="text-muted-themed">' + error.message + '</p></div>';
    }
};

window.cerrarSesion = function() {
    localStorage.removeItem('PB_USER_TOKEN');
    localStorage.removeItem('PB_USER_DATA');
    localStorage.removeItem('PB_ADMIN_TOKEN');
    window.cambiarVista('login');
};

// ==============================================================================
// AUTO-ARRANQUE DE LA SPA
// ==============================================================================
if (typeof window.appAutostart === 'undefined') {
    window.appAutostart = true;
    document.addEventListener('DOMContentLoaded', () => {
        
        // 🔮 DETECTAR ENLACES PROFUNDOS (Recuperación desde WhatsApp)
        const urlParams = new URLSearchParams(window.location.search);
        const vistaParam = urlParams.get('vista');
        const emailParam = urlParams.get('e');
        const tmpParam = urlParams.get('t');

        if (vistaParam === 'resetPass' && emailParam && tmpParam) {
            window.resetEmailApp = emailParam;
            window.resetTmpApp = tmpParam; // Este es nuestro PIN Temporal que viene en el enlace de WA
            window.cambiarVista('resetPass');
            return;
        }

        // Flujo normal de arranque
        var savedEmail = localStorage.getItem('APP_SAVED_EMAIL');
        if(savedEmail) {
            var emailInput = document.getElementById('loginEmail');
            var remMe = document.getElementById('rememberMe');
            if(emailInput) emailInput.value = savedEmail;
            if(remMe) remMe.checked = true;
        }

        var user = JSON.parse(localStorage.getItem('PB_USER_DATA') || '{}');
        if(user.id) window.cambiarVista('home');
        else window.cambiarVista('login');
    });
}

// ==============================================================================
// LÓGICA AUTH (LOGIN / REGISTRO)
// ==============================================================================
window.loginUsuario = async function() {
    var email = document.getElementById('loginEmail').value.trim();
    var pass = document.getElementById('loginPass').value;
    var rememberMe = document.getElementById('rememberMe').checked;

    if(!email || !pass) return alert("Por favor ingresa tu correo y contraseña.");

    var btn = document.querySelector('#vista-login button.btn-primary');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Autenticando...';
    btn.disabled = true;

    var urlBase = window.getApiUrl();

    try {
        let res = await fetch(urlBase + '/api/collections/users/auth-with-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: email, password: pass })
        });
        let data = await res.json().catch(() => ({}));

        if(!res.ok) {
            res = await fetch(urlBase + '/api/collections/_superusers/auth-with-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: email, password: pass })
            });
            data = await res.json().catch(() => ({}));
            
            if(!res.ok) {
                res = await fetch(urlBase + '/api/admins/auth-with-password', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identity: email, password: pass })
                });
                data = await res.json().catch(() => ({}));
                if(!res.ok) throw new Error("Las credenciales ingresadas son incorrectas o el usuario no existe.");
            }
            if (!data.record && data.admin) data.record = data.admin; 
            if (data.record) data.record.rol = 'Superusuario';
        }

        localStorage.setItem('PB_USER_TOKEN', data.token);
        localStorage.setItem('PB_USER_DATA', JSON.stringify(data.record));
        if (data.record.rol === 'Superusuario') localStorage.setItem('PB_ADMIN_TOKEN', data.token);

        if(rememberMe) localStorage.setItem('APP_SAVED_EMAIL', email);
        else localStorage.removeItem('APP_SAVED_EMAIL');

        btn.classList.replace('btn-primary', 'btn-success');
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> ¡Bienvenido!';
        
        setTimeout(() => {
            btn.classList.replace('btn-success', 'btn-primary');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            document.getElementById('loginPass').value = '';
            window.cambiarVista('home');
        }, 1500);

    } catch(error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.registrarUsuario = async function() {
    var iNombres = document.getElementById('regNombres');
    var iApellido1 = document.getElementById('regApellido1');
    var iApellido2 = document.getElementById('regApellido2');
    
    if (typeof trimEspacios === "function") {
        trimEspacios(iNombres); trimEspacios(iApellido1); trimEspacios(iApellido2);
    }
    
    var nombreCompleto = (iNombres.value + " " + iApellido1.value + " " + iApellido2.value).replace(/\s+/g, ' ').trim();
    var email = document.getElementById('regEmail').value.trim();
    var telefono = document.getElementById('regTelefono').value;
    var pass = document.getElementById('regPass').value;
    var passConf = document.getElementById('regPassConf').value;

    if(!iNombres.value || !iApellido1.value || !email) return alert("Nombres, Primer Apellido y Correo son obligatorios.");
    if(email.toLowerCase() === 'kenth1977@gmail.com') return alert("🛑 REGISTRO DENEGADO:\n\nEste correo electrónico está reservado.");
    if(telefono.length !== 8) return alert("El teléfono debe contener exactamente 8 dígitos numéricos.");
    if(pass.length < 8 || pass.length > 15) return alert("La contraseña debe tener entre 8 y 15 caracteres.");
    if(pass !== passConf) return alert("Las contraseñas no coinciden.");

    var btn = document.getElementById('btnGuardarRegistro');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Creando Perfil...';
    btn.disabled = true;

    var formData = new FormData();
    formData.append('email', email);
    formData.append('password', pass);
    formData.append('passwordConfirm', passConf);
    formData.append('name', nombreCompleto);
    formData.append('telefono', telefono);
    formData.append('rol', 'Usuario'); 
    formData.append('username', "user_" + Date.now()); 
    if (window.archivoAvatarTemp) formData.append('avatar', window.archivoAvatarTemp);

    try {
        const res = await fetch(window.getApiUrl() + '/api/collections/users/records', { method: 'POST', body: formData });
        if(!res.ok) {
            const errorData = await res.json();
            let errMsg = "Ocurrió un error en el servidor.";
            if (errorData.data && errorData.data.email) errMsg = "El correo electrónico ya se encuentra registrado.";
            else if (errorData.data && errorData.data.telefono) errMsg = "Este número de teléfono ya está asociado a otra cuenta.";
            throw new Error(errMsg);
        }

        btn.classList.replace('btn-primary', 'btn-success');
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> ¡Cuenta Creada Exitosamente!';
        
        setTimeout(() => {
            btn.classList.replace('btn-success', 'btn-primary');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            document.getElementById('formRegistro').reset();
            var formAvatarPreview = document.getElementById('formAvatarPreview');
            if (formAvatarPreview) formAvatarPreview.src = "https://ui-avatars.com/api/?name=Nuevo+Usuario&background=random";
            window.archivoAvatarTemp = null;
            window.cambiarVista('login');
        }, 3000);
    } catch (error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

// ==============================================================================
// 🟢 RECUPERACIÓN VÍA WHATSAPP (EVOLUTION API NATIVO)
// ==============================================================================

window.procesarRecuperacion = async function() {
    var emailInput = document.getElementById('recuperarEmailInput');
    if(!emailInput) return;
    
    var emailTarget = emailInput.value.trim();
    if(!emailTarget) return alert("Por favor ingresa un correo para buscar tu cuenta.");
    
    var btn = document.getElementById('btnVerificarRecuperacion');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Buscando...';
    btn.disabled = true;

    var urlBase = window.getApiUrl();
    
    try {
        // 1. Iniciar sesión como Master para poder manipular las cuentas a la fuerza
        let authRes = await fetch(urlBase + '/api/collections/_superusers/auth-with-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: 'kenth1977@gmail.com', password: 'CR129x7848n' })
        });
        let adminData = await authRes.json().catch(() => ({}));

        if(!authRes.ok) {
            authRes = await fetch(urlBase + '/api/admins/auth-with-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: 'kenth1977@gmail.com', password: 'CR129x7848n' })
            });
            adminData = await authRes.json().catch(() => ({}));
            if(!authRes.ok) throw new Error("Acceso maestro denegado. No se puede iniciar recuperación.");
        }

        var adminToken = adminData.token;
        var isV22 = !!adminData.admin;

        // 2. Buscar al usuario dueño de ese correo
        let checkRes = await fetch(urlBase + '/api/collections/users/records?filter=(email=\'' + emailTarget + '\')', { headers: { 'Authorization': adminToken } });
        let checkData = await checkRes.json().catch(() => ({}));
        let foundUser = (checkData.items && checkData.items.length > 0) ? checkData.items[0] : null;
        var collection = 'users';

        if(!foundUser) {
            if(!isV22) {
                checkRes = await fetch(urlBase + '/api/collections/_superusers/records?filter=(email=\'' + emailTarget + '\')', { headers: { 'Authorization': adminToken } });
                checkData = await checkRes.json().catch(() => ({}));
                foundUser = (checkData.items && checkData.items.length > 0) ? checkData.items[0] : null;
                collection = '_superusers';
            } else {
                checkRes = await fetch(urlBase + '/api/admins', { headers: { 'Authorization': adminToken } });
                checkData = await checkRes.json().catch(() => ({}));
                foundUser = (checkData.items || []).find(a => a.email === emailTarget);
                collection = 'admins';
            }
        }

        if(!foundUser) throw new Error("El correo ingresado NO EXISTE en la base de datos.");
        if(!foundUser.telefono || foundUser.telefono.length !== 8) throw new Error("Tu cuenta no tiene un teléfono válido de 8 dígitos de Costa Rica.");

        // 3. GENERAR PIN TEMPORAL Y APLICARLO EN LA BASE DE DATOS
        var pinTemporal = "Tribu-" + Math.floor(100000 + Math.random() * 900000);
        
        var patchUrl = urlBase + '/api/collections/' + collection + '/records/' + foundUser.id;
        if (collection === 'admins') patchUrl = urlBase + '/api/admins/' + foundUser.id;

        const resPatch = await fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Authorization': adminToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pinTemporal, passwordConfirm: pinTemporal })
        });

        if(!resPatch.ok) throw new Error("Error interno preparando la cuenta.");

        // 4. PREPARAR EL MENSAJE DE WHATSAPP (Costa Rica +506)
        var urlActual = window.location.origin + window.location.pathname;
        var enlaceMagico = urlActual + "?vista=resetPass&e=" + encodeURIComponent(foundUser.email) + "&t=" + pinTemporal;
        
        var telefonoCR = "506" + foundUser.telefono;
        var primerNombre = (foundUser.name || foundUser.username || "Usuario").split(' ')[0];
        
        var mensajeWA = `*La Tribu App*\n\n¡Hola ${primerNombre}!\nHas solicitado restablecer tu contraseña.\n\nToca el siguiente enlace para crear una nueva de forma segura:\n\n${enlaceMagico}`;

        // 5. 🚀 DISPARAR HACIA EVOLUTION API
        // ***************************************************************
        // IMPORTANTE: Actualiza estos 3 valores con los de tu servidor
        // ***************************************************************
        const EVOLUTION_URL = "http://127.0.0.1:8080"; // O la IP de tu VPS (Ej: http://198.51.100.25:8080)
        const INSTANCE_NAME = "BotTribu";              // El nombre que le diste a tu conexión en Evolution
        const API_KEY = "TribuGlobalKey123";           // Tu Global API Key configurada en el .env

        try {
            const evoRes = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": API_KEY
                },
                body: JSON.stringify({
                    number: telefonoCR,
                    text: mensajeWA
                })
            });

            if (!evoRes.ok) {
                console.error("Evolution API falló. Código:", evoRes.status);
                throw new Error("Evolution API rechazó el mensaje. Verifica que la instancia exista y esté conectada (QR Escaneado).");
            }
        } catch (evoErr) {
            // Si Evolution API está apagado o da error de red, lo capturamos aquí
            console.error("Error contactando a Evolution API:", evoErr);
            throw new Error("No se pudo conectar al servidor de WhatsApp (Evolution API no responde). " + evoErr.message);
        }

        // 6. Transición visual al Check Verde
        var divPaso1 = document.getElementById('recuperacionPaso1');
        var divPaso2 = document.getElementById('recuperacionPaso2');
        if(divPaso1) divPaso1.classList.add('d-none');
        if(divPaso2) divPaso2.classList.remove('d-none');

    } catch (error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.ejecutarResetPassword = async function() {
    var passNuevo = document.getElementById('resetNewPass').value;
    var passConf = document.getElementById('resetConfPass').value;

    if (passNuevo.length < 8 || passNuevo.length > 15) return alert("La contraseña debe tener entre 8 y 15 caracteres.");
    if (passNuevo !== passConf) return alert("Las contraseñas no coinciden.");
    
    if (!window.resetEmailApp || !window.resetTmpApp) return alert("Error Crítico: El enlace de WhatsApp es inválido. Solicita uno nuevo.");

    var btn = document.getElementById('btnEjecutarResetFinal');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Actualizando...';
    btn.disabled = true;

    var urlBase = window.getApiUrl();

    try {
        // 1. Iniciamos sesión oculta usando el correo y el PIN Temporal del enlace WhatsApp
        let authRes = await fetch(urlBase + '/api/collections/users/auth-with-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: window.resetEmailApp, password: window.resetTmpApp })
        });
        let authData = await authRes.json().catch(() => ({}));

        if(!authRes.ok) {
            authRes = await fetch(urlBase + '/api/collections/_superusers/auth-with-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: window.resetEmailApp, password: window.resetTmpApp })
            });
            authData = await authRes.json().catch(() => ({}));

            if(!authRes.ok) {
                authRes = await fetch(urlBase + '/api/admins/auth-with-password', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identity: window.resetEmailApp, password: window.resetTmpApp })
                });
                authData = await authRes.json().catch(() => ({}));
            }
        }

        if(!authRes.ok) throw new Error("El enlace expiró o ya fue utilizado. Por favor, solicita uno nuevo en la app.");

        var userToken = authData.token;
        var userId = authData.record ? authData.record.id : authData.admin.id;
        var collection = authData.admin ? 'admins' : (authData.record.collectionName || 'users');

        // 2. Empujamos la NUEVA contraseña ingresada por el usuario
        var patchUrl = urlBase + '/api/collections/' + collection + '/records/' + userId;
        if (collection === 'admins') patchUrl = urlBase + '/api/admins/' + userId;

        const resPatch = await fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Authorization': userToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                oldPassword: window.resetTmpApp, 
                password: passNuevo, 
                passwordConfirm: passConf 
            })
        });

        if(!resPatch.ok) throw new Error("PocketBase rechazó la nueva contraseña.");

        btn.classList.replace('btn-warning', 'btn-success');
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> ¡Éxito!';

        setTimeout(() => {
            alert("✅ CONTRASEÑA RESTABLECIDA\n\nTu contraseña ha sido actualizada. Ya puedes iniciar sesión.");
            
            // Limpiamos los datos del enlace por seguridad
            window.resetEmailApp = null;
            window.resetTmpApp = null;
            window.history.replaceState({}, document.title, window.location.pathname);
            
            window.cambiarVista('login');
        }, 1500);

    } catch(error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};