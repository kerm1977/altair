// ==============================================================================
// ARCHIVO: configurar_proyecto.js
// RESPONSABILIDAD: Asistente de terminal (Node.js) para inicializar nuevas apps.
//                  Crea configuraciones locales y gestiona la intención de DB.
//                  MODO DIOS: Hashea contraseñas y dicta la estructura final.
//                  SERVIDOR WEB: Levanta un servidor local para probar en Windows.
// ==============================================================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto'); // Para aplicar el mismo Hash (SHA-256) que la app
const { execSync } = require('child_process'); // Para ejecutar comandos de terminal
const http = require('http'); // NUEVO: Para levantar el servidor web de pruebas local

// Configuración de la interfaz de terminal con soporte de promesas
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise(resolve => rl.question(query, resolve));

// Rutas a los archivos locales
const capacitorFile = path.join(__dirname, 'capacitor.config.json');
const packageJsonFile = path.join(__dirname, 'package.json');
const buildConfigFile = path.join(__dirname, 'android', 'build_config.bat');
const initDataPath = path.join(__dirname, 'www', 'init_data.json');

// Búsqueda inteligente del archivo api_db.js
let apiDbFile = path.join(__dirname, 'www', 'js', 'api_db.js');
if (!fs.existsSync(apiDbFile)) apiDbFile = path.join(__dirname, 'www', 'api_db.js');
if (!fs.existsSync(apiDbFile)) apiDbFile = path.join(__dirname, 'api_db.js');

// 📱 Función visual para simular un móvil en la terminal
function mostrarHeaderMovil() {
    console.clear();
    console.log("\x1b[36m"); // Color Cyan
    console.log(" ╭──────────────────────────────────────────╮");
    console.log(" │  12:00 💬                  📶 5G 🔋 98% │");
    console.log(" ├──────────────────────────────────────────┤");
    console.log(" │  🚀 ASISTENTE MULTI-APP (MODO DIOS)      │");
    console.log(" ╰──────────────────────────────────────────╯");
    console.log("\x1b[0m"); // Reset color
    console.log("  [INFO] Iniciando configuración con autoridad absoluta...\n");
}

async function configurar() {
    mostrarHeaderMovil();

    // ==============================================================================
    // 0. DIAGNÓSTICO PREVIO (PRE-CHECK)
    // ==============================================================================
    let configPrevia = null;
    
    if (fs.existsSync(initDataPath)) {
        try {
            configPrevia = JSON.parse(fs.readFileSync(initDataPath, 'utf8'));
            console.log("======================================================");
            console.log("📊 DIAGNÓSTICO DEL SISTEMA ACTUAL");
            console.log("======================================================");
            console.log(`  🗄️  Motor DB Activo: ${configPrevia.dbName || 'No definido'}`);
            console.log(`  👥 Superusuarios  : ${configPrevia.superusers ? configPrevia.superusers.length : 0} registrados en el manifiesto`);
            console.log(`  🔒 Encriptación   : ${configPrevia.useEncryption ? 'Activada (SQLCipher)' : 'Desactivada'}`);
            console.log("======================================================\n");

            const continuar = await ask(`  ¿Deseas continuar y modificar esta configuración existente? (S/N): `);
            
            if (continuar.trim().toUpperCase() !== 'S' && continuar.trim().toUpperCase() !== 'SI') {
                console.log("\n  [✔] Operación cancelada. El sistema se mantiene intacto.");
                process.exit(0);
            }
            console.log("\n  [INFO] Iniciando re-configuración...\n");
        } catch(e) {
            console.log("  [!] init_data.json detectado pero no se pudo leer. Asumiendo instalación limpia.\n");
        }
    } else {
        console.log("  [i] No se detectó configuración previa. Iniciando instalación limpia...\n");
    }

    // ==============================================================================
    // 1. DATOS BÁSICOS
    // ==============================================================================
    const appNameInput = await ask(' 📱 1. Nombre de la App (Ej: Altair Pro): ');
    const appName = appNameInput.trim() || 'MiApp';
    const appSlug = appName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ''); // Sin espacios
    const defaultId = `com.${appSlug.toLowerCase()}.app`;

    const appIdInput = await ask(` 🆔 2. ID de la App (Enter para usar: ${defaultId}): `);
    const appId = appIdInput.trim() || defaultId;

    // ==============================================================================
    // 2. CONFIGURACIÓN DEL ÍCONO
    // ==============================================================================
    const askIcon = await ask('\n 🖼️  3. ¿Desea cambiar el icono de la aplicacion? (S/N): ');
    let iconPath = "";
    
    if (askIcon.trim().toLowerCase() === 's' || askIcon.trim().toLowerCase() === 'si') {
        const iconPathInput = await ask('   [INFO] Arrastra aqui tu imagen (Soporta PNG y JPG): ');
        iconPath = iconPathInput.trim().replace(/^["']|["']$/g, '');
        
        // Traducción automática de rutas WSL a Windows
        if (iconPath.toLowerCase().startsWith('/mnt/')) {
            const parts = iconPath.split('/');
            const drive = parts[2].toUpperCase(); 
            const rest = parts.slice(3).join('\\');
            iconPath = `${drive}:\\${rest}`;
        }
    }

    // ==============================================================================
    // 3. ANÁLISIS DE BASE DE DATOS EXISTENTE (MERGE vs RESET)
    // ==============================================================================
    let dbAction = 'create';
    let superusuarios = [];
    let dbFileName = `${appSlug}.db`;
    let useEncryption = false;
    let dbPassword = "";

    // Como ya cargamos configPrevia en el Paso 0, solo evaluamos si existe
    if (configPrevia) {
        console.log("\n======================================================");
        console.log("🗄️  INTENCIÓN SOBRE LA BASE DE DATOS NATIVA");
        console.log("======================================================");

        const accion = await ask(`  ¿Deseas (A)gregar superusuarios [Merge] o (R)esetear DB desde cero [Formatear]? (A/R): `);

        if (accion.trim().toUpperCase() === 'R') {
            console.log(`\n   [⚠️] INICIANDO PROTOCOLO DE BORRADO SEGURO...`);
            const conf1 = await ask(`   1/3: ¿Seguro que deseas formatear la base de datos al iniciar la app? (SI/NO): `);
            if (conf1.trim().toUpperCase() === 'SI' || conf1.trim().toUpperCase() === 'S') {
                const conf2 = await ask(`   2/3: ¡ATENCIÓN! Se perderán los datos en el celular. Escribe 'BORRAR' para continuar: `);
                if (conf2.trim() === 'BORRAR') {
                    const conf3 = await ask(`   3/3: Última advertencia. Escribe 'ESTOY SEGURO' para formatearla: `);
                    if (conf3.trim() === 'ESTOY SEGURO') {
                        console.log(`   [✔] Se ordenará el FORMATEO en el próximo inicio de la App.`);
                        dbAction = 'overwrite';
                        configPrevia = null; // Destruimos en memoria para pedir encriptación de nuevo en el Paso 5
                    } else {
                        console.log(`   [✖] Operación cancelada.`); process.exit(0);
                    }
                } else {
                    console.log(`   [✖] Operación cancelada.`); process.exit(0);
                }
            } else {
                console.log(`   [✖] Operación cancelada.`); process.exit(0);
            }
        } else {
            console.log(`   [✔] Modo Merge activado. Se conservarán configuraciones y encriptación previas.`);
            dbAction = 'combine';
            superusuarios = configPrevia.superusers || [];
            dbFileName = configPrevia.dbName;
            useEncryption = configPrevia.useEncryption;
            dbPassword = configPrevia.dbPassword;
        }
    }

    // ==============================================================================
    // 4. RECOLECCIÓN DE SUPERUSUARIOS
    // ==============================================================================
    console.log("\n======================================================");
    console.log(dbAction === 'combine' ? "🛡️  AGREGAR NUEVOS SUPERUSUARIOS" : "🛡️  CONFIGURACIÓN DE SUPERUSUARIOS (ADMINISTRADORES)");
    console.log("======================================================");
    
    let numAdmins = 0;
    while (numAdmins < 1 || numAdmins > 4) {
        const numInput = await ask(dbAction === 'combine' ? '¿Cuántos Superusuarios NUEVOS deseas agregar? (1 a 4): ' : '¿Cuántos Superusuarios tendrá la App? (Entre 1 y 4): ');
        numAdmins = parseInt(numInput.trim());
        if (isNaN(numAdmins) || numAdmins < 1 || numAdmins > 4) {
            console.log("   [!] Ingresa un número válido (1, 2, 3 o 4).\n");
        }
    }

    for (let i = 1; i <= numAdmins; i++) {
        console.log(`\n--- Nuevo Superusuario ${i} ---`);
        
        const emailInput = await ask(`   Correo electrónico (Enter para 'admin${i}@app.com'): `);
        const email = emailInput.trim() || `admin${i}@app.com`;
        
        let password = "";
        let passMatch = false;
        
        while (!passMatch) {
            const passMsg = email.startsWith('admin') 
                ? `   Contraseña temporal (Enter para 'admin'): ` 
                : `   Contraseña temporal: `;
                
            const passInput = await ask(passMsg);
            password = passInput.trim() || (email.startsWith('admin') ? 'admin' : '');
            
            if (email.startsWith('admin') && password === 'admin') {
                passMatch = true;
                console.log(`   [✔] Credenciales por defecto configuradas.`);
            } else {
                const confirm = await ask(`   Confirmar Contraseña: `);
                
                if (password === confirm && password.length >= 4) {
                    passMatch = true;
                } else {
                    console.log("   [!] Las contraseñas no coinciden o son muy cortas.\n");
                }
            }
        }
        
        // ⚡ DIOS MODE: El script convierte la contraseña plana en SHA-256 idéntico al que usa la app
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        const pin = String(superusuarios.length).repeat(8); 
        
        // Entregamos el objeto EXACTO que SQLite y la UI esperan
        superusuarios.push({ 
            nombre: `Administrador Supremo ${i}`,
            email: email, 
            password: hashedPassword, // ¡Ya viene cifrada de fábrica!
            telefono: "00000000",
            rol: "superusuario",
            estado: "activo",
            foto_perfil: "",
            pin: pin,
            _timestamp_inyeccion: new Date().getTime() + i
        });
    }

    // ==============================================================================
    // 5. CONFIGURACIÓN DE SEGURIDAD (Solo si es DB Nueva o Reset)
    // ==============================================================================
    if (dbAction !== 'combine') {
        console.log("\n======================================================");
        console.log("🗄️  CONFIGURACIÓN DEL MOTOR SQLITE NATIVO");
        console.log("======================================================");

        const customDbName = await ask(`   Nombre del archivo de Base de Datos (Enter para usar: '${dbFileName}'): `);
        dbFileName = customDbName.trim() || dbFileName;
        if (!dbFileName.endsWith('.db')) dbFileName += '.db'; 

        const askEncryption = await ask(`   ¿Desea proteger la base de datos con encriptación SQLCipher? (S/N): `);

        if (askEncryption.trim().toUpperCase() === 'S' || askEncryption.trim().toUpperCase() === 'SI') {
            useEncryption = true;
            let passMatch = false;
            while(!passMatch) {
                const p1 = await ask(`      Escriba la clave maestra de SQLCipher: `);
                const p2 = await ask(`      Confirmar clave maestra: `);
                
                if (p1 === p2 && p1.length >= 4) {
                    dbPassword = p1;
                    passMatch = true;
                    console.log(`      [✔] Motor de encriptación asegurado.`);
                } else {
                    console.log(`      [!] Las claves no coinciden o son muy cortas.\n`);
                }
            }
        } else {
            console.log(`      [i] La base de datos se creará sin encriptación nativa.`);
        }
    }

    console.log("\n⏳ Aplicando configuraciones locales e inyectando intenciones...");
    
    // ==============================================================================
    // 6. MODIFICAR ARCHIVOS LOCALES
    // ==============================================================================
    try {
        if (fs.existsSync(capacitorFile)) {
            let cap = JSON.parse(fs.readFileSync(capacitorFile, 'utf8'));
            cap.appId = appId; 
            cap.appName = appName;
            
            if (!cap.plugins) cap.plugins = {};
            cap.plugins.StatusBar = {
                overlaysWebView: false,
                style: "DARK", 
                backgroundColor: "#0d6efd" 
            };

            fs.writeFileSync(capacitorFile, JSON.stringify(cap, null, 2));
            console.log(`  [✔] capacitor.config.json -> Inyectado AppId y Barra de Estado Móvil`);
        }

        if (fs.existsSync(packageJsonFile)) {
            let pkg = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
            pkg.name = appSlug.toLowerCase();
            fs.writeFileSync(packageJsonFile, JSON.stringify(pkg, null, 2));
            console.log(`  [✔] package.json          -> Nombre: ${appSlug.toLowerCase()}`);
        }

        if (fs.existsSync(buildConfigFile)) {
            let batContent = `@echo off\r\nset "CUSTOM_NAME=${appName}"\r\nset "ICON_PATH=${iconPath}"\r\n`;
            fs.writeFileSync(buildConfigFile, batContent);
            console.log(`  [✔] build_config.bat      -> Enlace compilador creado (${appName})`);
        }

        if (fs.existsSync(apiDbFile)) {
            let apiDbContent = fs.readFileSync(apiDbFile, 'utf8');
            apiDbContent = apiDbContent.replace(/const APP_SLUG\s*=\s*['"].*?['"];?/, `const APP_SLUG = "${appSlug}";`);
            fs.writeFileSync(apiDbFile, apiDbContent, 'utf8');
            console.log(`  [✔] api_db.js             -> Variable APP_SLUG actualizada`);
        }

        // --- CREACIÓN DE init_data.json CON LA AUTORIDAD ABSOLUTA ---
        fs.writeFileSync(initDataPath, JSON.stringify({ 
            _metadata: "ESTE ARCHIVO ES CONTROLADO POR CONFIGURAR_PROYECTO.JS (MODO DIOS)",
            timestamp_ejecucion: new Date().getTime(),
            dbAction: dbAction, // 'combine' o 'overwrite'
            dbName: dbFileName,
            useEncryption: useEncryption,
            dbPassword: dbPassword,
            superusers: superusuarios // Ya vienen hasheados y estructurados
        }, null, 2));
        
        console.log(`  [✔] init_data.json        -> Generado con instrucción de DB: [${dbAction.toUpperCase()}]`);

    } catch (e) {
        console.log("  [ADVERTENCIA] No se pudieron actualizar todos los archivos locales: " + e.message);
    }

    // ==============================================================================
    // 7. SINCRONIZACIÓN Y PRUEBAS EN WINDOWS (MÓDULO NUEVO)
    // ==============================================================================
    console.log("\n======================================================");
    console.log("🚀 PASO FINAL: SINCRONIZACIÓN Y PRUEBAS WEB");
    console.log("======================================================");
    
    console.log("  [1/3] Empujando código web hacia el cascarón de Android...");
    try {
        execSync('npx cap sync android', { stdio: 'inherit' });
        console.log("  [✔] ¡Sincronización completada con éxito!");
    } catch (error) {
        console.log("  [✖] Error al sincronizar. (Asegúrate de tener instalado Capacitor).");
    }

    // 🔥 LA SOLUCIÓN DEFINITIVA AL PROBLEMA DE WINDOWS:
    const probarWeb = await ask(`\n  🌐 [2/3] ¿Estás probando en Windows y deseas levantar el Servidor Web Seguro? (Evita fallos de JSON) (S/N): `);
    
    if (probarWeb.trim().toUpperCase() === 'S' || probarWeb.trim().toUpperCase() === 'SI') {
        iniciarServidorPruebas();
        return; // Detenemos aquí la consola porque el servidor se queda encendido escuchando
    }

    const compilar = await ask(`\n  🔨 [3/3] ¿Deseas compilar el APK Android automáticamente ahora mismo? (S/N): `);
    
    if (compilar.trim().toUpperCase() === 'S' || compilar.trim().toUpperCase() === 'SI') {
        console.log("\n  [INFO] Iniciando el Motor Compilador (construir.bat)...");
        try {
            const construirPath = path.join(__dirname, 'android', 'construir.bat');
            if (fs.existsSync(construirPath)) {
                execSync(`"${construirPath}"`, { stdio: 'inherit' });
                console.log("\n  [✔] ¡APK Compilado exitosamente! Búscalo en tu carpeta /apks");
            } else {
                console.log(`\n  [✖] No se encontró construir.bat en la carpeta android. Compila manualmente.`);
            }
        } catch (error) {
            console.log("\n  [✖] Error durante la compilación. Verifica tu entorno de Android Studio/Gradle.");
        }
    }

    console.log("\n✨ ¡MODO DIOS COMPLETADO!");
    process.exit(0);
}

// ==============================================================================
// 🌐 FUNCIÓN PARA EVITAR EL BLOQUEO CORS AL LEER JSON EN WINDOWS
// ==============================================================================
function iniciarServidorPruebas() {
    const PORT = 8080;
    const MIME_TYPES = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };

    console.log("\n  [INFO] Levantando Motor de Pruebas Web Local...");
    
    const server = http.createServer((req, res) => {
        let urlLimpia = req.url.split('?')[0]; // Ignorar parámetros de caché como ?t=123
        let filePath = path.join(__dirname, 'www', urlLimpia === '/' ? 'index.html' : urlLimpia);
        
        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(404);
                res.end('Archivo no encontrado: ' + filePath);
            } else {
                // Headers MUY ESTRICTOS para evitar que el navegador guarde versiones viejas del JSON
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Surrogate-Control': 'no-store'
                });
                res.end(content, 'utf-8');
            }
        });
    });

    server.listen(PORT, () => {
        console.log(`\n  ======================================================`);
        console.log(`  🟢 SERVIDOR ACTIVO EN: http://localhost:${PORT}`);
        console.log(`  ======================================================`);
        console.log(`  [i] Mantén esta ventana de terminal abierta mientras programas.`);
        console.log(`  [i] Presiona Ctrl+C aquí en la terminal para apagar el servidor.\n`);
        
        // Abre el navegador automáticamente (Solo Windows)
        try {
            execSync(`start http://localhost:${PORT}`);
        } catch(e) {
            console.log(`  👉 Por favor abre http://localhost:${PORT} en tu navegador manualmente.`);
        }
    });
}

// Iniciar el script
configurar();