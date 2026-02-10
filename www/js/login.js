/**
 * Controlador para login.html
 */
(function() {

    const loginController = {
        init: async () => {
            console.log("🔐 Login cargado");
            loginController.checkRemembered();
            
            // Mostrar botón biométrico si corresponde (usando el servicio global biometricLogic)
            if (window.biometricLogic) {
                // Verificar hardware y credenciales
                const hasBio = await biometricLogic.checkBiometryAvailability();
                const hasCreds = localStorage.getItem('miApp_bio_creds');
                
                const btn = document.getElementById('btn-biometric');
                if (btn && hasBio && hasCreds) {
                    btn.classList.remove('hidden');
                }
            }
        },

        doLogin: async () => {
            const emailEl = document.getElementById('log-email');
            const passEl = document.getElementById('log-pass');
            
            if(!emailEl || !passEl) return;

            const email = emailEl.value.trim().toLowerCase();
            const pass = passEl.value;
            const remember = document.getElementById('log-remember')?.checked;

            try {
                // Usamos el servicio global DB
                const user = await db.find(email, pass);
                
                if (user) {
                    // Lógica de "Recordarme"
                    if (remember) {
                        localStorage.setItem('miApp_remember', JSON.stringify({ email, pass }));
                        // Guardar para biometría también
                        localStorage.setItem('miApp_bio_creds', JSON.stringify({ email, pass }));
                    } else {
                        localStorage.removeItem('miApp_remember');
                    }

                    // Usamos el helper global de index.js para iniciar sesión
                    window.app.loginSuccess(user);
                } else {
                    if(window.ui) window.ui.toast("Credenciales incorrectas");
                }
            } catch(e) {
                console.error(e);
                if(window.ui) window.ui.toast("Error en login");
            }
        },

        checkRemembered: () => {
            const saved = localStorage.getItem('miApp_remember');
            if (saved) {
                try {
                    const { email, pass } = JSON.parse(saved);
                    setTimeout(() => {
                        const emailInput = document.getElementById('log-email');
                        const passInput = document.getElementById('log-pass');
                        const rememberInput = document.getElementById('log-remember');
                        
                        if (emailInput) emailInput.value = email;
                        if (passInput) passInput.value = pass;
                        if (rememberInput) rememberInput.checked = true;
                    }, 100);
                } catch (e) {}
            }
        },

        // Llamada desde el botón HTML
        handleBiometric: () => {
            if(window.biometricLogic) {
                window.biometricLogic.loginBiometry();
            }
        }
    };

    window.ViewControllers.login = loginController;

})();