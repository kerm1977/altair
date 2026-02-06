const biometricLogic = {
    // 1. Verificar si el hardware soporta biometría
    checkBiometryAvailability: async () => {
        try {
            // Si no es nativo (Web), retornamos falso
            if (!window.Capacitor || !window.Capacitor.isNative) return false;
            
            const result = await window.Capacitor.Plugins.NativeBiometric.isAvailable();
            return result.isAvailable;
        } catch (e) {
            console.warn("Biometría no disponible:", e);
            return false;
        }
    },

    // 2. Ejecutar Login Biométrico
    loginBiometry: async () => {
        try {
            // Verificar si hay credenciales guardadas
            const saved = localStorage.getItem('miApp_remember');
            if (!saved) {
                return ui.toast("Error: No hay credenciales guardadas.");
            }

            // Verificar hardware
            const isAvailable = await biometricLogic.checkBiometryAvailability();
            if (!isAvailable) {
                return ui.toast("Tu dispositivo no soporta biometría");
            }

            // Solicitar Huella/Rostro
            await window.Capacitor.Plugins.NativeBiometric.verifyIdentity({
                reason: "Acceso a MiApp",
                title: "Autenticación",
                subtitle: "Usa tu huella o rostro",
                description: "Verifica tu identidad para continuar"
            });

            // Si pasa la verificación, obtenemos credenciales del storage
            const { email, password } = JSON.parse(saved);

            // Usamos la DB para el login real
            const user = await db.find(email, password);
            
            if (user) {
                app.startSession(user);
                ui.toast("Acceso concedido");
            } else {
                ui.toast("Las credenciales guardadas han expirado");
            }

        } catch (error) {
            console.error("Error Biometría:", error);
            // Ignorar error si el usuario canceló
            if (error && error.message && !error.message.includes("Canceled")) {
                ui.toast("No se pudo verificar la identidad");
            }
        }
    },

    // 3. Controlar visibilidad del botón en el Login
    updateBiometricUI: async () => {
        const btn = document.getElementById('btn-biometric');
        if (!btn) return;

        // Requisitos: 
        // 1. App Nativa
        // 2. Credenciales guardadas ('miApp_remember')
        // 3. Usuario activó la opción explícitamente ('miApp_bio_enabled')
        
        const isNative = window.Capacitor && window.Capacitor.isNative;
        const hasCredentials = localStorage.getItem('miApp_remember');
        const isEnabledByUser = localStorage.getItem('miApp_bio_enabled') === 'true';
        
        if (isNative && hasCredentials && isEnabledByUser) {
            const available = await biometricLogic.checkBiometryAvailability();
            if (available) {
                btn.classList.remove('hidden');
                btn.classList.add('flex');
                return;
            }
        }
        
        // Si no cumple, ocultar
        btn.classList.add('hidden');
        btn.classList.remove('flex');
    },

    // 4. NUEVO: Activar/Desactivar desde Perfil
    togglePreference: async (enable, currentUser) => {
        if (enable) {
            // Verificar hardware antes de activar
            const available = await biometricLogic.checkBiometryAvailability();
            if (!available) {
                throw new Error("Dispositivo no compatible");
            }

            // Guardar preferencia
            localStorage.setItem('miApp_bio_enabled', 'true');
            
            // CRÍTICO: Para que funcione el login biométrico, debemos guardar las credenciales
            // Si el usuario no tenía "Recordarme", lo forzamos aquí para que funcione la biometría
            if (currentUser && currentUser.email && currentUser.password) {
                localStorage.setItem('miApp_remember', JSON.stringify({
                    email: currentUser.email,
                    password: currentUser.password
                }));
            }
        } else {
            // Desactivar
            localStorage.removeItem('miApp_bio_enabled');
            // Opcional: ¿Queremos borrar las credenciales guardadas también? 
            // Por ahora solo desvinculamos la biometría.
        }
    }
};