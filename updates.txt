🚀 MANUAL RÁPIDO: CREAR UNA NUEVA APP (MÉTODO ISLAS) SECURE EDITION

Sigue estos 10 pasos exactos cada vez que quieras crear una aplicación totalmente nueva basada en tu plantilla actual.

FASE 1: PREPARAR EL TERRENO (ARCHIVOS)

Duplicar la Plantilla:
Copia la carpeta de tu proyecto base y pégala en tu escritorio. Cámbiale el nombre al nuevo proyecto (Ej: App_Restaurante).

Borrar la Base de Datos Vieja:
Entra a tu nueva carpeta (App_Restaurante). Busca la carpeta llamada pb_data y ELIMÍNALA. Esto asegura que la nueva app nazca sin los usuarios ni datos de la app anterior.

Asignar un Nuevo Puerto (Para evitar choques):
Abre el archivo runserver.js con tu editor de código.
Busca la línea de PocketBase y cámbiale el puerto agregando --http=127.0.0.1:8091 (o 8092, 8093...).
Ejemplo: const pbProcess = spawn(pbCommand, ['serve', '--http=127.0.0.1:8091'], { shell: true });

FASE 2: BAUTIZAR LA APP (MODO DIOS)

Ejecutar el Configurador:
Abre la consola (Terminal) dentro de tu nueva carpeta y ejecuta:
node configurar_proyecto.js
Responde las preguntas del asistente con los datos de tu nueva app (Nuevo Nombre, Nuevo ID como com.restaurante.app, etc.).

FASE 3: CONECTAR EL SERVIDOR Y LA APP

Levantar el Servidor:
En esa misma terminal, enciende tu nuevo servidor ejecutando:
npm run start-global
(Déjala abierta minimizada)

Crear el Túnel (Tailscale):
Abre una NUEVA consola y abre el túnel hacia tu nuevo puerto:
tailscale funnel 8091
(Copia el enlace https://... que te devuelve Tailscale).

Actualizar el Código de la App:
Ve a www/js/api_db.js y actualiza las dos variables principales con tus nuevos datos:
APP_SLUG: Pon el nombre de tu nueva app (Ej: "Restaurante").
POCKETBASE_URL: Pon tu nuevo enlace de Tailscale o tu nuevo 127.0.0.1:8091.

FASE 4: PREPARAR LA BASE DE DATOS Y CANDADOS DE SEGURIDAD (POCKETBASE)

Configurar Usuarios y Candados (API Rules):
Abre tu navegador y entra a http://127.0.0.1:8091/_/.
En el menú izquierdo ve a Collections y haz clic en 'users'.

Pestaña Fields: Añade los campos 'name' y 'rol' (tipo Text).

Pestaña API Rules (¡MUY IMPORTANTE!):

Create Rule: Déjalo vacío "" SOLO si quieres que cualquiera pueda registrarse libremente en tu app.

List/Search Rule: Escribe id = @request.auth.id (Esto evita que un usuario pueda descargar la lista de TODOS los usuarios).

View Rule: Escribe id = @request.auth.id

Update/Delete Rule: Escribe id = @request.auth.id

Crear las Tablas de Negocio (Colecciones Nuevas):
Haz clic en + New collection. Ponle nombre (Ej: pagos).
Añade los campos necesarios (monto, concepto, cliente_id apuntando a users).

Pestaña API Rules:

Si todos los logueados pueden verlo: Usa @request.auth.id != ""

Si es información privada (ej. Mis Pagos): Usa cliente_id = @request.auth.id para List/Search, View, Update y Delete.

Create Rule: Usa @request.auth.id != "" para que solo logueados puedan crear registros.

Preparar la Colección OTA (Actualizaciones Automáticas):
Crea la colección ota_updates (campos: version tipo Text, archivo_zip tipo File).

API Rules: Pon @request.auth.id != "" en List/Search y View para que solo tus usuarios vean si hay actualizaciones.

FASE 5: COMPILAR EL APK

Inyectar el Código al Celular:
Consola en la carpeta principal: npx cap sync

Sellar y Construir:
cd android
construir.bat
¡Pasa el APK a tu celular y listo!




🐧 GUÍA DEFINITIVA: MIGRAR POCKETBASE DE WINDOWS A LINUX (VPS)

Guardate este documento para el día que quieras subir tu app a un servidor
real en la nube (Hetzner, DigitalOcean, Linode, AWS, etc.) para tener
tu backend prendido 24/7 sin depender de tu PC ni de Tailscale.

CONCEPTOS PREVIOS:
En Windows, tu base de datos y archivos se guardan en la carpeta "pb_data".
PocketBase en Linux funciona EXACTAMENTE igual. Solo cambia el archivo
ejecutable ("pocketbase" en lugar de "pocketbase.exe").

PASO 1: ALQUILAR EL SERVIDOR (VPS)

Ve a un proveedor (Recomendado: Hetzner o DigitalOcean).

Crea un "Droplet" o "Server".

Elige como Sistema Operativo: Ubuntu 24.04 LTS (o 22.04 LTS).

Elige el tamaño más barato (Suele costar $4 - $6 al mes).

Te darán una Dirección IP pública (Ej: 198.51.100.25) y una contraseña (o llave SSH).

PASO 2: CONECTARTE AL SERVIDOR

Abre tu consola de Windows (PowerShell o CMD).

Escribe: ssh root@198.51.100.25 (Usa la IP de tu servidor).

Ingresa la contraseña cuando te la pida (en Linux no se ven los asteriscos cuando escribes, es normal).

PASO 3: DESCARGAR POCKETBASE PARA LINUX

Una vez dentro de Linux, descarga la versión correcta (usualmente AMD64).
Escribe en la consola de Linux:
wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.0/pocketbase_0.23.0_linux_amd64.zip

Instala la herramienta para descomprimir:
apt update && apt install unzip -y

Descomprime el archivo:
unzip pocketbase_0.23.0_linux_amd64.zip

Ahora tienes un archivo llamado "pocketbase" (verde).

PASO 4: DARLE PERMISOS DE EJECUCIÓN (IMPORTANTE)
A diferencia de Windows, en Linux debes decirle al sistema que el archivo es un programa.
Escribe:
chmod +x pocketbase

PASO 5: MIGRAR TU BASE DE DATOS DESDE WINDOWS
Necesitas pasar tu carpeta "pb_data" de tu PC al servidor Linux.

En tu PC Windows, descarga e instala un programa gratuito llamado "FileZilla" o "WinSCP".

Conéctate a la IP de tu servidor usando SFTP (usuario: root, y tu contraseña).

Copia tu carpeta "pb_data" desde tu Windows y pégala en Linux en la misma carpeta donde descomprimiste PocketBase.

PASO 6: INICIAR EL SERVIDOR (MODO PRODUCCIÓN)
En Linux ya no necesitas Tailscale. Puedes atar PocketBase directamente a un dominio real (ej: api.miapp.com).

Para probar que funciona:
./pocketbase serve --http="0.0.0.0:80"
(Ahora podrías entrar desde tu navegador poniendo directamente la IP del servidor).

PASO 7: MANTENERLO ENCENDIDO SIEMPRE (SYSTEMD)
Si cierras la consola, el servidor se apagará. Para evitar esto, Linux usa "Servicios".

Crea un archivo de servicio:
nano /lib/systemd/system/pocketbase.service

Pega esto adentro (ajustando las rutas si es necesario):
[Unit]
Description=PocketBase Server
After=network.target

[Service]
User=root
Group=root
Type=simple
WorkingDirectory=/root
ExecStart=/root/pocketbase serve --http="0.0.0.0:80" --https="0.0.0.0:443"
Restart=on-failure

[Install]
WantedBy=multi-user.target

Guarda pulsando CTRL+O, Enter, y luego CTRL+X.

Activa el servicio para que inicie siempre que se reinicie el servidor:
systemctl enable pocketbase
systemctl start pocketbase

¡LISTO! 🎉
Tu servidor ahora es inmortal. Si compras un dominio (ej. midominio.com) y lo apuntas a la IP de tu servidor, PocketBase generará automáticamente el candadito verde (HTTPS/SSL) de forma gratuita.


=========================================================

🍎 GUÍA CON MANZANITAS: ¿CÓMO FUNCIONA EL .ZIP (OTA)? 🍎

Para entender esto, primero debes saber un secreto de tu aplicación:
Tu app en el celular (el APK) es como una "Caja Fuerte". Adentro de esa caja fuerte vive un navegador web invisible que lee lo que hay en tu carpeta "www".

Cuando quieres cambiar un botón o un color, NO necesitas romper la caja fuerte (compilar un nuevo APK). Solo necesitas cambiar los papeles que están adentro.

Aquí tienes el paso a paso LITERAL de lo que pasa:

PASO 1: ¿QUÉ METO EN EL .ZIP Y SE COMPILA ALGO?

• NO SE COMPILA NADA. Cero. Nada de Java, nada de Gradle, nada de Android.
• Tú vas a tu computadora, abres tu carpeta "www" y ves tus archivos (index.html, css/main.css, js/api_db.js, etc).
• Seleccionas todo lo que hay DENTRO de "www", le das clic derecho y los metes en un archivo comprimido llamado "actualizacion_v2.zip".
• El .zip es literalmente solo un paquete con tus textos e imágenes.

PASO 2: ¿A DÓNDE SUBO ESE .ZIP?

• Abres tu panel de control o servidor (AWS, VPS, tu backend genérico, etc.).
• Vas a la carpeta pública específica que designaste para alojar las actualizaciones estáticas (ej. /var/www/html/updates).
• Subes tu archivo "actualizacion_v2.zip" ahí.
• Luego, actualizas la base de datos o API indicándole a la app cuál es la nueva versión (ej. v2) y el enlace exacto (ej. https://api.midominio.com/updates/actualizacion_v2.zip).

PASO 3: ¿CÓMO SE ENTERA EL CELULAR?

• Un usuario abre la app en su celular.
• La app se conecta al servidor y pregunta silenciosamente: "¿Hay alguna versión nueva?"
• El servidor responde: "Sí, estamos en la v2. Descárgala de este enlace".

PASO 4: LA DESCARGA INVISIBLE

• El plugin de Capacitor-Updater entra en acción.
• Descarga el archivo "actualizacion_v2.zip" a una carpeta secreta y temporal en la memoria interna del teléfono.
• Descomprime todos los archivos (el nuevo index, el nuevo CSS, etc.) y los pone en una nueva carpetita interna.
• Una vez descomprimido, el archivo .zip se borra solo para no ocupar espacio basura en el teléfono.

PASO 5: LA MAGIA DEL CAMBIO (¿CÓMO ACTUALIZA SIN APK?)

• Recuerda que el APK original venía apuntando a la carpeta "www" vieja.
• El plugin interviene y hace un cambio de rieles (como en los trenes).
• Le dice a la caja fuerte (tu app): "Oye, a partir de este segundo, IGNORA la carpeta vieja que trajiste de fábrica. De ahora en adelante, quiero que leas todo desde esta NUEVA carpeta secreta que acabo de descomprimir".
• Este cambio de rieles queda guardado permanentemente en el celular.

PASO 6: EL PARPADEO FINAL

• Para que el navegador invisible lea la nueva carpeta, la app hace un "refresh" (como presionar F5 en la computadora).
• La pantalla parpadea un segundo en blanco y, al volver a encenderse... ¡PUM! Está cargando tu nuevo index.html con el diseño nuevo.
• ¡Todo esto pasó en 3 segundos sin que el usuario fuera a la Google Play Store!

=========================================================
RESUMEN DE MANZANITAS:

Comprimes tus textos (www) en un .zip en tu compu.

Lo subes a la nube en tu servidor (VPS/AWS/Backend).

El celular baja el .zip.

El celular descomprime el .zip en una carpeta secreta.

El celular "cambia los rieles" apuntando a la nueva carpeta.

La app se reinicia sola y muestra la magia.