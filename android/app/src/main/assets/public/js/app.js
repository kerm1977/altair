/**
 * index.js - Punto de entrada principal
 * Se encarga del arranque, configuración global y redirección inicial.
 */
const appInit = {
    // Estado global de usuario (accesible por todas las vistas)
    user: null,

    // Método de arranque
    start: async () => {
        console.log("📱 Iniciando TribuPlay...");

        // 1. Inicializar Base de Datos (Shared Service)
        if (typeof db !== 'undefined' && db.init) {
            try {
                await db.init();
                console.log("✅ DB Inicializada");
            } catch (e) {
                console.error("❌ Error DB:", e);
            }
        }

        // 2. Configurar Listeners Globales (Ej: Botón atrás de Android)
        appInit.setupGlobalListeners();

        // 3. Verificar Sesión y Redirigir
        appInit.checkSession();
    },

    checkSession: () => {
        const savedUser = localStorage.getItem('miApp_current');
        
        if (savedUser) {
            try {
                appInit.user = JSON.parse(savedUser);
                // Si hay usuario, vamos al home
                router.navigate('home'); 
            } catch (e) {
                // Si el JSON falla, mandamos al login
                localStorage.removeItem('miApp_current');
                router.navigate('login');
            }
        } else {
            // Si no hay usuario, vamos al login
            router.navigate('login');
        }
    },

    setupGlobalListeners: () => {
        // Manejo del botón físico "Atrás" en Android con Capacitor
        if (window.Capacitor) {
            window.Capacitor.App.addListener('backButton', ({ canGoBack }) => {
                if (!canGoBack) {
                    window.Capacitor.App.exitApp();
                } else {
                    window.history.back();
                }
            });
        }
    },

    // Helpers Globales para Login/Logout
    loginSuccess: (user) => {
        appInit.user = user;
        localStorage.setItem('miApp_current', JSON.stringify(user));
        router.navigate('home');
    },

    logout: () => {
        appInit.user = null;
        localStorage.removeItem('miApp_current');
        router.navigate('login');
    }
};

// Exponer appInit globalmente como 'app' para compatibilidad
window.app = appInit;

// Arrancar cuando el DOM esté listo
window.onload = () => {
    appInit.start();
};