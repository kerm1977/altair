"# app" 
🧩 Módulos del Sistema

Base de Datos (db.js)

La clase DatabaseService abstrae las operaciones CRUD. Puedes cambiar el motor manualmente desde la vista Dashboard en la app.

Usuarios por defecto (Seeds): Al iniciar, el sistema crea automáticamente usuarios administradores (ej. kenth1977@gmail.com) si no existen.

Autenticación

Login Tradicional: Email y Contraseña.

Recordarme: Guarda credenciales cifradas en almacenamiento seguro.

Biometría: Si el dispositivo es compatible y existen credenciales guardadas, habilita el botón de huella/rostro.

Editor de Imágenes

Implementado en app.js (imageEditor), permite:

Carga de archivo local.

Pre-optimización (resize) para rendimiento.

Interfaz modal para Zoom y Pan (Desplazamiento).

Generación de imagen final en JPG de 400x400px.

📋 Requisitos

Node.js & NPM

Android Studio (para compilar la versión nativa)

Dispositivo Android con API 24+ (para biometría y SQLite)

⚠️ Solución de Problemas Comunes

Error "Cross origin requests": Al usar router localmente, debes usar un servidor web (http-server o Live Server), no abrir el archivo directamente.

Biometría no aparece: El acceso biométrico requiere configuración previa. Asegúrate de haber iniciado sesión exitosamente marcando la casilla "Recordarme". Esto guardará tus credenciales de forma segura y habilitará automáticamente el botón de huella/rostro en la pantalla de login para futuros accesos."# Tribupay" 
