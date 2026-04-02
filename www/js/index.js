// ==============================================================================
// ARCHIVO: js/index.js
// ROL: Lógica Principal, Router SPA y Autenticación
// ==============================================================================

// 🔮 Secuestro Global de Alertas (Solo lo registramos 1 vez para la SPA)
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

// 🌓 Lógica de Tema (Usamos 'var' para evitar "redeclaration of const" en la SPA)
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

// Aplicar tema guardado al arrancar
window.setTheme(savedTheme);

// Conectar el botón de tema global
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
            btnAjustes.classList.add('d-flex'); // Aseguramos que se comporte como flex container
        } else {
            btnAjustes.classList.remove('d-flex');
            btnAjustes.classList.add('d-none');
        }
    }
    
    // Seguro de limpieza para los botones viejos (Por si todavía están en el HTML)
    var btnOldDash = document.getElementById('navBtnDashboard');
    var btnOldCpanel = document.getElementById('navBtnCpanel');
    if(btnOldDash) btnOldDash.classList.add('d-none');
    if(btnOldCpanel) btnOldCpanel.classList.add('d-none');

    // 2. Vistas Estáticas (Login/Registro)
    if (vista === 'login' || vista === 'registro') {
        if(vDinamica) {
            vDinamica.innerHTML = ''; 
            vDinamica.classList.add('d-none');
        }
        if(vLogin) {
            if(vista !== 'login') vLogin.classList.add('d-none');
            else vLogin.classList.remove('d-none');
        }
        if(vRegistro) {
            if(vista !== 'registro') vRegistro.classList.add('d-none');
            else vRegistro.classList.remove('d-none');
        }
        if(appRoot) {
            appRoot.style.alignItems = 'center';
            appRoot.style.justifyContent = 'center';
        }
        return;
    }

    // 3. Vistas Dinámicas: Verificación de sesión
    if(!user.id) {
        window.cambiarVista('login');
        return;
    }

    if(appRoot) {
        appRoot.style.alignItems = 'stretch';
        appRoot.style.justifyContent = 'flex-start';
    }

    if(vLogin) vLogin.classList.add('d-none');
    if(vRegistro) vRegistro.classList.add('d-none');
    if(vDinamica) {
        vDinamica.classList.remove('d-none');
        vDinamica.innerHTML = '<div class="d-flex flex-column justify-content-center align-items-center mt-5 pt-5 text-themed"><div class="spinner-border text-info" style="width: 3rem; height: 3rem;" role="status"></div><h5 class="mt-3 fw-bold opacity-75">Conectando módulo...</h5></div>';
    }

    // 4. Inyectar Fragmento (AJAX Fetch)
    try {
        var res = await fetch(vista + '.html');
        if(!res.ok) throw new Error("Archivo de módulo no encontrado.");
        var htmlRaw = await res.text();
        
        var parser = new DOMParser();
        var doc = parser.parseFromString(htmlRaw, 'text/html');
        var fragmentContent = doc.body ? doc.body.innerHTML : htmlRaw;

        if(vDinamica) vDinamica.innerHTML = fragmentContent;
        
        // Extraer y ejecutar scripts del fragmento limpiamente
        if(vDinamica) {
            Array.from(vDinamica.querySelectorAll("script")).forEach(function(oldScript) {
                var newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach(function(attr) { newScript.setAttribute(attr.name, attr.value); });
                if(oldScript.innerHTML) {
                    var scriptContent = oldScript.innerHTML;
                    scriptContent = scriptContent.replace(/document\.addEventListener\(['"`]DOMContentLoaded['"`]\s*,\s*(\(\)\s*=>\s*\{|function\s*\(\)\s*\{)/g, "setTimeout($1");
                    newScript.appendChild(document.createTextNode(scriptContent));
                }
                if(oldScript.parentNode) oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        }

        // =========================================================
        // 🚀 5. LÓGICA ESPECÍFICA POR VISTAS (MODO SPA PURO)
        // =========================================================
        if (vista === 'home') {
            setTimeout(function() {
                var userData = JSON.parse(localStorage.getItem('PB_USER_DATA') || '{}');
                if(userData.id) {
                    var welcomeEl = document.getElementById('welcomeTitle');
                    var topNavName = document.getElementById('topNavName');
                    
                    var nombreCompleto = userData.name || userData.username || 'Usuario';
                    var primerNombre = nombreCompleto.split(' ')[0]; // Extrae solo el primer nombre
                    
                    if(welcomeEl) {
                        welcomeEl.innerText = '¡Bienvenido al Home, ' + primerNombre + '!';
                    }
                    if(topNavName) {
                        topNavName.innerText = 'Hola, ' + primerNombre;
                        
                        // Forzar purga de diseño para que sea texto puro en bruto
                        topNavName.className = 'text-warning small fw-bold text-end'; 
                        topNavName.style.background = 'transparent';
                        topNavName.style.boxShadow = 'none';
                        topNavName.style.border = 'none';
                        topNavName.style.padding = '0';
                        topNavName.style.marginTop = '6px'; // Ligero ajuste vertical para alinear con el icono
                        
                        // 🔥 FIX DE ESPACIADO: Empujamos el contenedor principal más a la izquierda
                        if(topNavName.parentElement) {
                            topNavName.parentElement.style.right = '90px'; // Lo aleja totalmente del botón
                        }
                    }
                }
            }, 150); // Tiempo exacto para asegurar que el DOM cargó
        }

    } catch (error) {
        if(vDinamica) {
            vDinamica.innerHTML = '<div class="text-center mt-5 p-4 mx-3 glass-panel border-danger"><i class="bi bi-exclamation-octagon-fill text-danger" style="font-size: 4rem;"></i><h4 class="mt-3 fw-bold text-themed">Error de Módulo</h4><p class="text-muted-themed">' + error.message + '</p></div>';
        }
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
        var savedEmail = localStorage.getItem('APP_SAVED_EMAIL');
        if(savedEmail) {
            var emailInput = document.getElementById('loginEmail');
            var remMe = document.getElementById('rememberMe');
            if(emailInput) emailInput.value = savedEmail;
            if(remMe) remMe.checked = true;
        }

        var user = JSON.parse(localStorage.getItem('PB_USER_DATA') || '{}');
        if(user.id) {
            window.cambiarVista('home');
        } else {
            window.cambiarVista('login');
        }
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
            if (errorData.data) {
                if (errorData.data.email) errMsg = "El correo electrónico ya se encuentra registrado.";
                else if (errorData.data.telefono) errMsg = "Este número de teléfono ya está asociado a otra cuenta.";
            }
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
// HACK DE RECUPERACIÓN DE EMERGENCIA
// ==============================================================================
window.tempRecoveryData = null;

window.resetearModalRecuperacion = function() {
    document.getElementById('step1-recuperacion').classList.remove('d-none');
    document.getElementById('step2-recuperacion').classList.add('d-none');
    document.getElementById('recuperarEmailHack').value = '';
    document.getElementById('recupNewPass').value = '';
    document.getElementById('recupConfPass').value = '';
    document.getElementById('btnVerificarHack').innerHTML = 'Verificar Existencia';
    document.getElementById('btnVerificarHack').disabled = false;
    document.getElementById('btnEjecutarReset').classList.replace('btn-success', 'btn-warning');
    document.getElementById('btnEjecutarReset').innerHTML = 'Cambiar Contraseña';
    document.getElementById('btnEjecutarReset').disabled = false;
};

window.verificarCorreoHack = async function() {
    var emailTarget = document.getElementById('recuperarEmailHack').value.trim();
    if(!emailTarget) return alert("Por favor ingresa un correo para buscar.");
    var btn = document.getElementById('btnVerificarHack');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Buscando en BD...';
    btn.disabled = true;

    var urlBase = window.getApiUrl();
    try {
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
            if(!authRes.ok) throw new Error("Fallo la Autenticación Maestra interna.");
        }
        
        var adminToken = adminData.token;
        var isV22 = !!adminData.admin;

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

        window.tempRecoveryData = { id: foundUser.id, collection: collection, token: adminToken };
        document.getElementById('step1-recuperacion').classList.add('d-none');
        document.getElementById('step2-recuperacion').classList.remove('d-none');
    } catch (error) {
        alert(error.message);
        btn.innerHTML = 'Verificar Existencia';
        btn.disabled = false;
    }
};

window.ejecutarResetHack = async function() {
    var passNuevo = document.getElementById('recupNewPass').value;
    var passConf = document.getElementById('recupConfPass').value;

    if (passNuevo.length < 8 || passNuevo.length > 15) return alert("La contraseña debe tener entre 8 y 15 caracteres.");
    if (passNuevo !== passConf) return alert("Las contraseñas no coinciden. Verifícalas.");

    var btn = document.getElementById('btnEjecutarReset');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Empujando Datos...';
    btn.disabled = true;

    try {
        var patchUrl = window.getApiUrl() + '/api/collections/' + window.tempRecoveryData.collection + '/records/' + window.tempRecoveryData.id;
        if (window.tempRecoveryData.collection === 'admins') patchUrl = window.getApiUrl() + '/api/admins/' + window.tempRecoveryData.id;

        const res = await fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Authorization': window.tempRecoveryData.token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passNuevo, passwordConfirm: passConf })
        });

        if(!res.ok) throw new Error("PocketBase rechazó el cambio.");

        btn.classList.replace('btn-warning', 'btn-success');
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> ¡Contraseña Cambiada!';

        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('recuperarPassModal')).hide();
            alert("✅ RECUPERACIÓN EXITOSA\n\nSe ha forzado el cambio de contraseña correctamente.\n\nYa puedes iniciar sesión con tu nueva clave.");
            window.resetearModalRecuperacion();
        }, 2000);
    } catch(error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};