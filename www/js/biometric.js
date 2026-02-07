const biometricLogic = {
    // 1. Verificar disponibilidad real de Hardware
    checkBiometryAvailability: async () => {
        try {
            // Si estamos en Web (no nativo), retornamos false para ocultar el botón
            if (!window.Capacitor || !window.Capacitor.isNative) return false;
            
            const result = await window.Capacitor.Plugins.NativeBiometric.isAvailable();
            return result.isAvailable;
        } catch (e) {
            console.warn("Biometría no disponible:", e);
            return false;
        }
    },

    // 2. Ejecutar Login Biométrico ESTRICTO
    loginBiometry: async () => {
        try {
            // A. Verificar credenciales guardadas en el llavero biométrico
            const savedBio = localStorage.getItem('miApp_bio_creds');
            if (!savedBio) {
                return ui.toast("Activa la biometría en tu perfil primero");
            }

            // B. Verificar Hardware
            const isAvailable = await biometricLogic.checkBiometryAvailability(); // Usamos referencia interna
            if (!isAvailable) {
                return ui.toast("Biometría no disponible en este dispositivo");
            }

            // C. VERIFICACIÓN OBLIGATORIA (El núcleo de la seguridad)
            // Esto llama al sensor nativo (FaceID / TouchID)
            await window.Capacitor.Plugins.NativeBiometric.verifyIdentity({
                reason: "Acceso Seguro",
                title: "Autenticación Requerida",
                subtitle: "Verifica tu identidad",
                description: "Toca el sensor para entrar",
                maxAttempts: 5
            })
            .then(() => {
                // D. SOLO si la promesa se resuelve (éxito), procedemos
                ui.toast("Identidad Verificada 🔓");
                
                const { email, pass } = JSON.parse(savedBio);
                
                // Login silencioso contra la base de datos
                db.find(email, pass).then(user => {
                    if (user) {
                        app.startSession(user);
                    } else {
                        ui.toast("Tus credenciales cambiaron. Inicia sesión manual.");
                    }
                });
            });

        } catch (error) {
            console.error("Fallo Biometría:", error);
            // Si el usuario cancela o falla la huella, NO entra
            if (error.message && error.message.includes("Canceled")) {
                 return; // Cancelado por usuario, no hacemos nada
            }
            ui.toast("Acceso Denegado 🔒");
        }
    },

    // 3. UI: Mostrar botón solo si hay credenciales Y hardware
    updateBiometricUI: async () => {
        const btn = document.getElementById('btn-biometric');
        if (!btn) return;

        // ¿Tenemos credenciales guardadas para biometría?
        const hasBioCreds = localStorage.getItem('miApp_bio_creds');
        const isEnabled = localStorage.getItem('miApp_bio_enabled') === 'true';
        
        // Verificar hardware real
        const hardwareOk = await biometricLogic.checkBiometryAvailability();

        if (hasBioCreds && isEnabled && hardwareOk) {
            btn.classList.remove('hidden');
            btn.classList.add('flex');
        } else {
            btn.classList.add('hidden');
            btn.classList.remove('flex');
        }
    }
};