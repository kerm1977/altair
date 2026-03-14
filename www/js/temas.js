// =========================================================
// TEMAS.JS - CONTROLADOR DE MODO OSCURO NATIVO (Blindado)
// =========================================================

const ThemeManager = {
    // Función de inicialización principal
    init: async function() {
        // 1. Cargar preferencia guardada o usar 'claro' por defecto
        const usuarioActivo = await window.sqliteService.getSession();
        // Si hay usuario activo, lee su preferencia, si no, usa el sistema
        const temaPreferido = usuarioActivo && usuarioActivo.tema ? usuarioActivo.tema : 'sistema';
        await this.aplicarTema(temaPreferido);

        // 2. Delegación de Eventos Pura (Event Delegation)
        // Atrapamos el evento a nivel de documento para no perderlo cuando la vista cambia
        document.addEventListener('change', async (e) => {
            // Escuchamos el cambio en el selector de tema del perfil
            if (e.target && e.target.id === 'selector-tema-usuario') {
                const nuevoTema = e.target.value;
                await this.guardarPreferenciaTema(nuevoTema);
            }
        });
        
        // 3. Sincronización visual cuando se inyecta la vista
        // Creamos un observador para detectar cuándo el selector de tema aparece en pantalla
        const observer = new MutationObserver(async (mutations) => {
            for (let mutation of mutations) {
                if (mutation.addedNodes.length) {
                    const selectorTema = document.getElementById('selector-tema-usuario');
                    if (selectorTema) {
                        const usuarioActual = await window.sqliteService.getSession();
                        if (usuarioActual && usuarioActual.tema) {
                            selectorTema.value = usuarioActual.tema;
                        } else {
                            selectorTema.value = 'sistema';
                        }
                    }
                }
            }
        });
        
        // Empezamos a observar el contenedor principal de la app
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            observer.observe(appRoot, { childList: true, subtree: true });
        } else {
             // Fallback por si app-root aún no existe
             document.addEventListener('DOMContentLoaded', () => {
                 const root = document.getElementById('app-root');
                 if(root) observer.observe(root, { childList: true, subtree: true });
             });
        }
    },

    // Guarda el nuevo tema elegido por el usuario en la BD y lo aplica
    guardarPreferenciaTema: async function(nuevoTema) {
        const usuarioActivo = await window.sqliteService.getSession();
        
        if (usuarioActivo) {
            // 1. Actualizamos el valor localmente en el objeto del usuario
            usuarioActivo.tema = nuevoTema;
            
            // 2. Guardamos en la memoria de sesión activa
            await window.sqliteService.setSession(usuarioActivo);
            
            // 3. Guardamos en la Base de Datos nativa SQLite
            await window.sqliteService.actualizarUsuario(usuarioActivo.email, usuarioActivo);
            
            // 4. Aplicamos los colores al instante
            await this.aplicarTema(nuevoTema);
            
            window.mostrarNotificacion("Tema visual actualizado", "success");
        } else {
            // Si por alguna razón cambia el tema sin haber iniciado sesión
            await this.aplicarTema(nuevoTema); 
        }
    },

    // Aplica las variables CSS correspondientes al tema (Claro, Oscuro o Sistema)
    aplicarTema: async function(tema) {
        let isDark = false;
        
        if (tema === 'oscuro') {
            isDark = true;
        } else if (tema === 'claro') {
            isDark = false;
        } else {
            // 'sistema' - Lee la preferencia del celular/computadora
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // 1. Aplicar al DOM (Bootstrap 5.3 detecta el atributo data-bs-theme)
        if (isDark) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            document.body.classList.add('dark-mode'); // Clase extra por si tienes estilos personalizados
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            document.body.classList.remove('dark-mode');
        }

        // 2. Modificar la UI Nativa de Android/iOS (Barra de estado)
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            try {
                const { StatusBar, Style } = capacitorExports;
                
                await StatusBar.setOverlaysWebView({ overlay: false });

                if (isDark) {
                    // Modo oscuro: Fondo oscuro, iconos y texto claros en la barra
                    await StatusBar.setBackgroundColor({ color: '#1e1e1e' });
                    // En Capacitor, Style.Dark pone el texto blanco (diseñado para fondos oscuros)
                    await StatusBar.setStyle({ style: Style.Dark }); 
                } else {
                    // Modo claro: Usamos tu color primary azul, texto blanco
                    await StatusBar.setBackgroundColor({ color: '#0d6efd' }); 
                    await StatusBar.setStyle({ style: Style.Dark }); 
                }
            } catch(e) {
                console.log("[ThemeManager] StatusBar no soportado o en fallback Web", e);
            }
        }
    }
};

// Exponer globalmente INMEDIATAMENTE
window.ThemeManager = ThemeManager;

// Auto-inicialización instantánea si el DOM ya estaba listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}