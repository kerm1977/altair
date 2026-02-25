/**
 * Controlador Lógico para la vista de Perfil (perfil.html)
 */

try {
    // 1. Función para cerrar sesión globalmente
    window.cerrarSesion = function() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('usuarioActual');
            if (typeof window.setLoginState === 'function') {
                window.setLoginState(false);
            }
            window.location.hash = 'login';
        }
    };

    // 2. Función principal para cargar la información. 
    // Usamos 'window' para que el HTML pueda ejecutarla instantáneamente
    window.cargarDatosPerfil = function() {
        try {
            // Verificamos si la vista está activa actualmente en el DOM
            if (!document.getElementById('userName')) return;

            // Buscamos primero si hay un usuario logueado en la sesión actual
            let datosGuardados = localStorage.getItem('usuarioActual'); 
            
            // Si no hay usuario logueado (sesión), intentamos cargar el último registrado
            if (!datosGuardados) {
                 datosGuardados = localStorage.getItem('usuarioRegistrado');
            }
            
            if (datosGuardados) {
                const usuario = JSON.parse(datosGuardados);
                
                // Inyectamos los datos de Texto
                document.getElementById('userName').textContent = usuario.nombre || usuario.username || 'Miembro de la Tribu';
                document.getElementById('userEmail').textContent = usuario.email || 'Sin correo';
                
                if (document.getElementById('userPuntos')) {
                    document.getElementById('userPuntos').textContent = usuario.puntos || '0';
                }
                
                // Formateamos el teléfono para que se vea como "8888-8888" si tiene 8 dígitos
                let telFmt = usuario.telefono || '--';
                if(telFmt && telFmt.length === 8) telFmt = telFmt.slice(0,4) + '-' + telFmt.slice(4);
                if(document.getElementById('userPhone')) document.getElementById('userPhone').textContent = telFmt;
                
                if(document.getElementById('userPin')) document.getElementById('userPin').textContent = usuario.pin || '------';
                if(document.getElementById('userEmgName')) document.getElementById('userEmgName').textContent = usuario.emgNombre || 'No registrado';
                
                // Formateo del teléfono de emergencia
                let emgTelFmt = usuario.emgTelefono || '--';
                if(emgTelFmt && emgTelFmt.length === 8) emgTelFmt = emgTelFmt.slice(0,4) + '-' + emgTelFmt.slice(4);
                if(document.getElementById('userEmgPhone')) document.getElementById('userEmgPhone').textContent = emgTelFmt;

                // Calculamos la edad al vuelo si guardaste su año de nacimiento (dobAnio)
                if(document.getElementById('userAge')) {
                    if (usuario.dobAnio) {
                        const edad = new Date().getFullYear() - parseInt(usuario.dobAnio);
                        document.getElementById('userAge').textContent = edad + ' años';
                    } else {
                        document.getElementById('userAge').textContent = '-- años';
                    }
                }

                // 3. Lógica inteligente para el Avatar
                const avatarImg = document.getElementById('userAvatar');
                if (avatarImg) {
                    if (usuario.avatar && usuario.avatar.startsWith('data:image')) {
                        // Si el usuario se tomó una foto o subió una, la mostramos
                        avatarImg.src = usuario.avatar;
                    } else {
                        // Si no tiene foto, usamos una API gratuita para generar una imagen con sus iniciales
                        const nombreUrl = encodeURIComponent(usuario.nombre || usuario.username || 'Usuario');
                        avatarImg.src = `https://ui-avatars.com/api/?name=${nombreUrl}&background=0d6efd&color=fff&size=150&font-size=0.4`;
                    }
                }

            } else {
                // Si por alguna razón entra al perfil pero no hay datos locales
                document.getElementById('userName').textContent = 'Usuario Invitado';
                document.getElementById('userEmail').textContent = 'Inicia sesión para ver tus datos';
            }
        } catch (error) {
            console.error("Error al cargar los datos del perfil:", error);
        }
    };

    // ========================================================================
    // OBSERVADOR SPA: Respaldo de Seguridad
    // En caso de que el evento 'onload' de la imagen invisible falle, 
    // este listener fuerza la carga de datos al detectar que navegamos a '#perfil'
    // ========================================================================
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#perfil') {
            setTimeout(window.cargarDatosPerfil, 150);
        }
    });

} catch (err) {
    console.error("Error crítico inicializando perfil.js:", err);
}