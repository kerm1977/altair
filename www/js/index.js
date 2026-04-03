// ==============================================================================
// ARCHIVO: js/index.js
// ROL: Lógica Principal, Router SPA, Autenticación, Perfil y Criptografía Cold Storage
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
    var btnPerfil = document.getElementById('navBtnPerfil'); 
    
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

    if (btnPerfil) {
        if (user.id) {
            btnPerfil.classList.remove('d-none');
            btnPerfil.classList.add('d-flex');
        } else {
            btnPerfil.classList.remove('d-flex');
            btnPerfil.classList.add('d-none');
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
        // 🚀 5. LÓGICA ESPECÍFICA POR VISTAS (SPA ROUTER LOGIC)
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

        if (vista === 'perfil') {
            // 🔥 PARCHE DE RESCATE VISUAL: Forza a mostrar la foto correcta al navegar
            setTimeout(function() {
                var userData = JSON.parse(localStorage.getItem('PB_USER_DATA') || '{}');
                var preview = document.getElementById('miPerfilAvatar');
                if (preview && userData.avatar && userData.id) {
                    var urlBase = typeof window.getApiUrl === 'function' ? window.getApiUrl() : 'http://127.0.0.1:8090';
                    // Utilizamos collectionId por defecto para evitar bugs de PocketBase v0.23
                    var colName = userData.collectionId || userData.collectionName || (userData.rol === 'Superusuario' ? '_superusers' : 'users');
                    preview.src = urlBase + '/api/files/' + colName + '/' + userData.id + '/' + userData.avatar + '?t=' + Date.now();
                }
            }, 250); // El retraso garantiza sobreescribir cualquier fallo del script interno de perfil.html
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
// LÓGICA AUTH (LOGIN / REGISTRO CON JSON KEY)
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
    var pin = document.getElementById('regPin').value.trim().toUpperCase();
    var pass = document.getElementById('regPass').value;
    var passConf = document.getElementById('regPassConf').value;

    if(!iNombres.value || !iApellido1.value || !email || !telefono || !pin) return alert("Completa todos los campos obligatorios, incluyendo Teléfono y PIN.");
    if(email.toLowerCase() === 'kenth1977@gmail.com') return alert("🛑 REGISTRO DENEGADO:\n\nEste correo electrónico está reservado.");
    if(telefono.length !== 8) return alert("El teléfono debe contener exactamente 8 dígitos numéricos.");
    if(pin.length !== 6) return alert("El PIN de seguridad debe tener exactamente 6 caracteres.");
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
    formData.append('pin_recuperacion', pin); 
    formData.append('rol', 'Usuario'); 
    
    if (window.archivoAvatarTemp) {
        formData.append('avatar', window.archivoAvatarTemp, "avatar_" + Date.now() + ".jpg");
    }

    try {
        const res = await fetch(window.getApiUrl() + '/api/collections/users/records', { method: 'POST', body: formData });
        if(!res.ok) {
            const errorData = await res.json().catch(()=>({}));
            let errMsg = "Ocurrió un error en el servidor.";
            if (errorData.data) {
                if (errorData.data.email) errMsg = "El correo electrónico ya se encuentra registrado.";
                else if (errorData.data.telefono) errMsg = "Este número de teléfono ya está asociado a otra cuenta.";
                else if (errorData.data.password) errMsg = "La contraseña es débil o no cumple los requisitos.";
                else errMsg = "Datos inválidos: " + JSON.stringify(errorData.data);
            }
            throw new Error(errMsg);
        }

        const hashSeguro = btoa(unescape(encodeURIComponent(pass)));
        const keyData = {
            app: "La Tribu",
            fecha: new Date().toISOString(),
            email: email,
            telefono: telefono,
            pin: pin,
            hash_seguridad: hashSeguro
        };
        
        const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: "application/json" });
        const urlObj = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObj;
        a.download = `Llave_Recuperacion_${telefono}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(urlObj);

        btn.classList.replace('btn-primary', 'btn-success');
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> ¡Cuenta Creada Exitosamente!';
        
        setTimeout(() => {
            alert("¡Cuenta VIP creada exitosamente!\n\n⚠️ IMPORTANTE: Se ha descargado automáticamente tu LLAVE DE RECUPERACIÓN JSON.\nGuárdala muy bien, es la única forma de recuperar tu cuenta si olvidas tu contraseña.");
            btn.classList.replace('btn-success', 'btn-primary');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            document.getElementById('formRegistro').reset();
            var formAvatarPreview = document.getElementById('formAvatarPreview');
            if (formAvatarPreview) formAvatarPreview.src = "https://ui-avatars.com/api/?name=Nuevo+Usuario&background=random";
            window.archivoAvatarTemp = null;
            window.cambiarVista('login');
        }, 1500);

    } catch (error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

// ==============================================================================
// 🟢 RECUPERACIÓN POR LLAVE JSON (COLD STORAGE OFFLINE)
// ==============================================================================

window.procesarRecuperacion = function() {
    if (!window.tempRecoveryData) return alert("Carga un archivo de llave JSON válido primero.");
    window.resetKeyData = window.tempRecoveryData; 
    alert("✅ Llave de seguridad JSON verificada correctamente.\n\nProcediendo a restaurar contraseña.");
    window.cambiarVista('resetPass');
};

window.ejecutarResetPassword = async function() {
    var passNuevo = document.getElementById('resetNewPass').value;
    var passConf = document.getElementById('resetConfPass').value;

    if(!window.resetKeyData) return alert("Error Crítico: Llave JSON perdida en memoria. Vuelve a subir el archivo.");
    if(passNuevo.length < 8 || passNuevo.length > 15) return alert("La contraseña debe tener entre 8 y 15 caracteres.");
    if(passNuevo !== passConf) return alert("Las contraseñas no coinciden.");

    var btn = document.getElementById('btnEjecutarResetFinal');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Autenticando...';
    btn.disabled = true;

    try {
        const urlBase = window.getApiUrl();
        const email = window.resetKeyData.email;
        const oldPass = decodeURIComponent(escape(atob(window.resetKeyData.hash_seguridad))); 
        
        const authRes = await fetch(urlBase + '/api/collections/users/auth-with-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: email, password: oldPass })
        });
        
        if (!authRes.ok) throw new Error("La llave JSON cargada está obsoleta o la contraseña ya fue cambiada previamente por otro medio.");
        
        const authData = await authRes.json();
        
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Actualizando...';
        
        const patchData = { oldPassword: oldPass, password: passNuevo, passwordConfirm: passConf };
        const patchRes = await fetch(urlBase + '/api/collections/users/records/' + authData.record.id, {
            method: 'PATCH',
            headers: { 'Authorization': authData.token, 'Content-Type': 'application/json' },
            body: JSON.stringify(patchData)
        });

        if (!patchRes.ok) throw new Error("No se pudo actualizar la base de datos.");

        const newKeyData = {
            app: "La Tribu",
            fecha: new Date().toISOString(),
            email: email,
            telefono: window.resetKeyData.telefono,
            pin: window.resetKeyData.pin,
            hash_seguridad: btoa(unescape(encodeURIComponent(passNuevo)))
        };
        
        const blob = new Blob([JSON.stringify(newKeyData, null, 2)], { type: "application/json" });
        const urlObj = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObj;
        a.download = `NUEVA_Llave_Recuperacion_${window.resetKeyData.telefono}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(urlObj);

        btn.classList.replace('btn-warning', 'btn-success');
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> ¡Éxito!';

        setTimeout(() => {
            alert("¡Éxito! Contraseña cambiada permanentemente.\n\n⚠️ Se ha descargado tu NUEVA Llave de Recuperación. La llave vieja ya no sirve, debes borrarla por seguridad.");
            window.resetKeyData = null;
            window.tempRecoveryData = null;
            window.cambiarVista('login');
        }, 1500);

    } catch(error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

// ==============================================================================
// 🦸‍♂️ LÓGICA DE PERFIL (DATOS, IMÁGENES, CONTRASEÑA Y LLAVE)
// Centralizado aquí para evitar pérdida de contexto al navegar por la SPA
// ==============================================================================
window.guardarDatosPerfilLocal = async function() {
    var iNombres = document.getElementById('editNombres');
    var iApellido1 = document.getElementById('editApellido1');
    var iApellido2 = document.getElementById('editApellido2');
    var iTelefono = document.getElementById('editTelefono');
    
    if (typeof trimEspacios === "function") {
        trimEspacios(iNombres); trimEspacios(iApellido1); trimEspacios(iApellido2);
    }
    
    var nombreCompleto = `${iNombres.value} ${iApellido1.value} ${iApellido2.value}`.replace(/\s+/g, ' ').trim();
    var telefono = iTelefono.value;

    if(!iNombres.value || !iApellido1.value) return alert("Los Nombres y el Primer Apellido son obligatorios.");
    if(telefono && telefono.length !== 8) return alert("El teléfono celular debe contener exactamente 8 dígitos.");

    var btn = document.getElementById('btnGuardarPerfilLocal');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Guardando...';
    btn.disabled = true;

    try {
        const user = JSON.parse(localStorage.getItem('PB_USER_DATA'));
        const token = localStorage.getItem('PB_USER_TOKEN');
        const urlBase = window.getApiUrl();
        
        const formData = new FormData();
        formData.append('name', nombreCompleto);
        formData.append('telefono', telefono);
        
        if (window.archivoAvatarTemp) {
            formData.append('avatar', window.archivoAvatarTemp, "avatar_" + Date.now() + ".jpg");
        }

        // 🔥 FIX PROFUNDO: Forzamos collectionId para evitar errores 404 al buscar la imagen
        const colTarget = user.collectionId || user.collectionName || (user.rol === 'Superusuario' ? '_superusers' : 'users');
        let endpoint = `${urlBase}/api/collections/${colTarget}/records/${user.id}`;
        if (colTarget === 'admins') endpoint = `${urlBase}/api/admins/${user.id}`;

        const res = await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Authorization': token }, 
            body: formData
        });

        if(!res.ok) throw new Error("No se pudieron guardar los cambios en la base de datos.");

        const updatedData = await res.json();
        
        // 🔥 REPARACIÓN ESTRUCTURAL DE MEMORIA
        updatedData.rol = user.rol; 
        updatedData.collectionId = updatedData.collectionId || user.collectionId || colTarget;
        updatedData.collectionName = updatedData.collectionName || user.collectionName || colTarget;
        
        localStorage.setItem('PB_USER_DATA', JSON.stringify(updatedData));
        window.archivoAvatarTemp = null;

        btn.classList.replace('btn-primary', 'btn-success');
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> ¡Guardado Exitosamente!';

        const preview = document.getElementById('miPerfilAvatar');
        if (updatedData.avatar && preview) {
            const newColName = updatedData.collectionId;
            preview.src = `${urlBase}/api/files/${newColName}/${updatedData.id}/${updatedData.avatar}?t=${Date.now()}`;
        }
        
        document.getElementById('miPerfilNombre').innerText = nombreCompleto;

        setTimeout(() => {
            btn.classList.replace('btn-success', 'btn-primary');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.cambiarPasswordLocal = async function() {
    var pActual = document.getElementById('editPassActual').value;
    var pNuevo = document.getElementById('editPassNueva').value;
    var pConf = document.getElementById('editPassConf').value;

    if (!pActual || !pNuevo || !pConf) return alert("Por favor, completa los 3 campos de contraseña.");
    if (pNuevo.length < 8 || pNuevo.length > 15) return alert("La nueva contraseña debe tener entre 8 y 15 caracteres.");
    if (pNuevo !== pConf) return alert("Las contraseñas nuevas no coinciden. Usa el botón del 'ojo' para verificarlas.");

    var btn = document.getElementById('btnCambiarPassLocal');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Autorizando...';
    btn.disabled = true;

    try {
        const user = JSON.parse(localStorage.getItem('PB_USER_DATA'));
        const token = localStorage.getItem('PB_USER_TOKEN');
        const urlBase = window.getApiUrl();
        
        const colTarget = user.collectionId || user.collectionName || (user.rol === 'Superusuario' ? '_superusers' : 'users');
        const patchData = { oldPassword: pActual, password: pNuevo, passwordConfirm: pConf };
        
        let endpoint = `${urlBase}/api/collections/${colTarget}/records/${user.id}`;
        if (colTarget === 'admins') endpoint = `${urlBase}/api/admins/${user.id}`;

        const res = await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify(patchData)
        });

        if(!res.ok) throw new Error("La Contraseña Actual es incorrecta. Si la olvidaste, cierra sesión y usa la Llave JSON para recuperarla.");

        btn.classList.replace('btn-danger', 'btn-success');
        btn.innerHTML = '<i class="bi bi-shield-check me-2"></i> ¡Contraseña Actualizada!';

        setTimeout(() => {
            alert("✅ ¡ÉXITO! Tu contraseña ha sido actualizada.\n\n⚠️ ATENCIÓN: Tu llave JSON antigua ya no sirve con esta nueva contraseña. Ve a la pestaña 'Llave' para descargar una nueva.");
            btn.classList.replace('btn-success', 'btn-danger');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            
            document.getElementById('editPassActual').value = '';
            document.getElementById('editPassNueva').value = '';
            document.getElementById('editPassConf').value = '';
            
            const triggerEl = document.querySelector('#llave-tab');
            if(triggerEl && typeof bootstrap !== 'undefined') {
                const tab = new bootstrap.Tab(triggerEl);
                tab.show();
            }
        }, 1500);

    } catch (error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.generarCopiaLlaveJSON = async function() {
    var pass = document.getElementById('miPerfilPassKey').value;
    if(!pass) return alert("Por favor, ingresa tu contraseña actual para poder encriptar la llave de seguridad.");

    var btn = document.getElementById('btnDescargarMiLlave');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Encriptando Llave...';
    btn.disabled = true;

    try {
        const userStr = localStorage.getItem('PB_USER_DATA');
        if(!userStr) throw new Error("No hay sesión activa.");
        const user = JSON.parse(userStr);
        
        const urlBase = window.getApiUrl();
        
        let authRes = await fetch(urlBase + '/api/collections/users/auth-with-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: user.email, password: pass })
        });

        if (!authRes.ok) {
            authRes = await fetch(urlBase + '/api/collections/_superusers/auth-with-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: user.email, password: pass })
            });
            if(!authRes.ok) {
                authRes = await fetch(urlBase + '/api/admins/auth-with-password', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identity: user.email, password: pass })
                });
                if(!authRes.ok) throw new Error("La contraseña ingresada es incorrecta. No se puede encriptar la llave.");
            }
        }

        const hashSeguro = btoa(unescape(encodeURIComponent(pass)));
        const keyData = {
            app: "La Tribu",
            fecha: new Date().toISOString(),
            email: user.email,
            telefono: user.telefono || "SUPERUSUARIO",
            pin: user.pin_recuperacion || "MASTER",
            hash_seguridad: hashSeguro
        };
        
        const jsonString = JSON.stringify(keyData);
        const payloadEncriptado = btoa(unescape(encodeURIComponent(jsonString))).split('').reverse().join('');
        
        const secureVault = {
            _advertencia: "COPIA DE SEGURIDAD ENCRIPTADA MODO COLD STORAGE. NO MODIFICAR NINGUN CARACTER.",
            tribu_secure_vault: payloadEncriptado
        };
        
        const blob = new Blob([JSON.stringify(secureVault, null, 2)], { type: "application/json" });
        const urlObj = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObj;
        a.download = `Copia_Seguridad_Tribu_${user.telefono || 'Master'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(urlObj);

        btn.classList.replace('btn-warning', 'btn-success');
        btn.classList.replace('text-dark', 'text-white');
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> ¡Llave Descargada!';
        
        setTimeout(() => {
            alert("✅ LLAVE JSON DESCARGADA CON ÉXITO.\n\nPor favor, guárdala en un lugar seguro (Como tu Google Drive, Correo o USB) y NO le cambies el contenido interno.");
            btn.classList.replace('btn-success', 'btn-warning');
            btn.classList.replace('text-white', 'text-dark');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            document.getElementById('miPerfilPassKey').value = '';
        }, 1500);

    } catch (error) {
        alert(error.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};