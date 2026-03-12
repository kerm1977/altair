// ==============================================================================
// ARCHIVO: configurar_proyecto.js
// RESPONSABILIDAD: Asistente de terminal (Node.js) para inicializar nuevas apps.
//                  Crea configuraciones locales y envía superusuarios al Backend.
// ==============================================================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https'); 

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

// Búsqueda inteligente del archivo api_db.js
let apiDbFile = path.join(__dirname, 'www', 'js', 'api_db.js');
if (!fs.existsSync(apiDbFile)) apiDbFile = path.join(__dirname, 'www', 'api_db.js');
if (!fs.existsSync(apiDbFile)) apiDbFile = path.join(__dirname, 'api_db.js');

// 📱 Función visual para simular un móvil en la terminal
function mostrarHeaderMovil() {
    console.clear();
    console.log("\x1b[36m"); // Color Cyan
    console.log(" ╭──────────────────────────────────────────╮");
    console.log(" │  12:00 💬                   📶 5G 🔋 98% │");
    console.log(" ├──────────────────────────────────────────┤");
    console.log(" │  🚀 ASISTENTE MULTI-APP (MOTOR V2)       │");
    console.log(" ╰──────────────────────────────────────────╯");
    console.log("\x1b[0m"); // Reset color
    console.log("  [INFO] Iniciando configuración de entorno móvil nativo...\n");
}

async function configurar() {
    mostrarHeaderMovil();

    // 1. Datos básicos de la App
    const appNameInput = await ask(' 📱 1. Nombre de la nueva App (Ej: Altair Pro): ');
    const appName = appNameInput.trim() || 'MiApp';
    const appSlug = appName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ''); // Sin espacios
    const defaultId = `com.${appSlug.toLowerCase()}.app`;

    const appIdInput = await ask(` 🆔 2. ID de la App (Enter para usar: ${defaultId}): `);
    const appId = appIdInput.trim() || defaultId;

    // 2. Configuración del Ícono (Soporte WSL incluido)
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

    // 3. Recolección de Superusuarios y PINs
    console.log("\n======================================================");
    console.log("🛡️  CONFIGURACIÓN DE SUPERUSUARIOS (ADMINISTRADORES)");
    console.log("======================================================");
    
    let numAdmins = 0;
    while (numAdmins < 1 || numAdmins > 4) {
        const numInput = await ask('¿Cuántos Superusuarios tendrá la App? (Entre 1 y 4): ');
        numAdmins = parseInt(numInput.trim());
        if (isNaN(numAdmins) || numAdmins < 1 || numAdmins > 4) {
            console.log("   [!] Ingresa un número válido (1, 2, 3 o 4).\n");
        }
    }

    const superusuarios = [];
    for (let i = 1; i <= numAdmins; i++) {
        console.log(`\n--- Superusuario ${i} ---`);
        const email = await ask(`   Correo electrónico: `);
        
        let password = "";
        let passMatch = false;
        
        while (!passMatch) {
            password = await ask(`   Contraseña temporal: `);
            const confirm = await ask(`   Confirmar Contraseña: `);
            
            if (password === confirm && password.length >= 4) {
                passMatch = true;
            } else {
                console.log("   [!] Las contraseñas no coinciden o son muy cortas.\n");
            }
        }
        
        // Generamos un PIN de 8 dígitos para el acceso en la DB (Ej: Admin 1 = 00000000)
        const pin = String(i - 1).repeat(8);
        superusuarios.push({ email, password, pin });
    }

    console.log("\n⏳ Aplicando configuraciones locales y estilos nativos móviles...");
    
    // 4. Modificar Archivos Locales (Capacitor, Package, Android, api_db, init_data)
    try {
        if (fs.existsSync(capacitorFile)) {
            let cap = JSON.parse(fs.readFileSync(capacitorFile, 'utf8'));
            cap.appId = appId; 
            cap.appName = appName;
            
            // --- NUEVO: CONFIGURACIÓN DE BARRA DE ESTADO MÓVIL (STATUS BAR) ---
            if (!cap.plugins) cap.plugins = {};
            cap.plugins.StatusBar = {
                overlaysWebView: false,
                style: "DARK", // Texto blanco en la batería/hora
                backgroundColor: "#0d6efd" // Azul primario de Bootstrap
            };
            // -------------------------------------------------------------------

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
            // Reemplaza la URL dinámicamente
            apiDbContent = apiDbContent.replace(/const API_URL\s*=\s*['"].*?['"];?/, `const API_URL = "https://kenth1977.pythonanywhere.com/api/${appSlug}";`);
            fs.writeFileSync(apiDbFile, apiDbContent, 'utf8');
            console.log(`  [✔] api_db.js             -> API_URL apuntada a /api/${appSlug}`);
        }

        // --- CREACIÓN DE init_data.json PARA LA APP ---
        const initDataPath = path.join(__dirname, 'www', 'init_data.json');
        fs.writeFileSync(initDataPath, JSON.stringify({ superusers: superusuarios }, null, 2));
        console.log(`  [✔] init_data.json        -> Generado con ${superusuarios.length} superusuarios iniciales.`);
        // ----------------------------------------------

    } catch (e) {
        console.log("  [ADVERTENCIA] No se pudieron actualizar todos los archivos locales: " + e.message);
    }

    // 5. Enviar los Superusuarios a PythonAnywhere (El Abuelo)
    const payloadStr = JSON.stringify({ superusers: superusuarios });

    const options = {
        hostname: 'kenth1977.pythonanywhere.com',
        port: 443,
        path: `/api/${appSlug}/setup_superusers`, 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadStr)
        }
    };

    console.log("\n📡 Inyectando superusuarios a la base de datos en la nube...");

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            try {
                const jsonRes = JSON.parse(body);
                console.log("\n======================================================");
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log("✨ ¡CONFIGURACIÓN COMPLETADA Y ENLAZADA!");
                    console.log(`📡 Base de datos creada/vinculada: ${appSlug}.db`);
                    console.log(`  [✔] Servidor Respondió: ${jsonRes.message || 'Usuarios guardados exitosamente.'}`);
                } else {
                    console.log("⚠️ HUBO UN PROBLEMA EN EL SERVIDOR:");
                    console.log(`  [!] El servidor rechazó la operación: ${jsonRes.error || jsonRes.message}`);
                }
            } catch (e) {
                console.log("\n  [❌] ERROR CRÍTICO EN EL SERVIDOR DE PYTHONANYWHERE [❌]");
                console.log(`  El servidor ha devuelto un error en lugar de procesar los datos.`);
                console.log(`  Verifica el error.log en PythonAnywhere o reinicia el servidor.`);
            }
            finalizar();
        });
    });

    req.on('error', (e) => {
        console.error("\n  [!] Error de conexión: No se pudieron guardar los superusuarios en la nube.");
        console.error(`      Motivo: ${e.message}`);
        console.log("  [INFO] Verifica tu conexión a internet o si el servidor está encendido.\n");
        finalizar();
    });

    req.write(payloadStr);
    req.end();
}

function finalizar() {
    console.log("\nPRÓXIMOS PASOS:");
    console.log(`1. Sincroniza el código web: npx cap sync android`);
    console.log(`2. Compila el APK: ve a la carpeta android y ejecuta construir.bat`);
    console.log("======================================================\n");
    process.exit(0);
}

// Iniciar el script
configurar();