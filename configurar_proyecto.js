const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process'); // <-- NUEVO: Para ejecutar npm automáticamente

// Configuración de la interfaz de terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Script de automatización para el Motor Universal v2
 * Este script configura los archivos locales para conectar con una base de datos 
 * específica en PythonAnywhere basándose en el nombre de la App.
 */

// Rutas a los archivos locales
const capacitorFile = path.join(__dirname, 'capacitor.config.json');
const packageJsonFile = path.join(__dirname, 'package.json');

// Intentamos localizar api_db.js en la raíz, en www/ o en www/js/
let apiDbFile = path.join(__dirname, 'api_db.js');

if (!fs.existsSync(apiDbFile)) {
    apiDbFile = path.join(__dirname, 'www', 'api_db.js');
}

// Si aún no existe, probamos en la subcarpeta js/
if (!fs.existsSync(apiDbFile)) {
    apiDbFile = path.join(__dirname, 'www', 'js', 'api_db.js');
}

console.log("======================================================");
console.log("🚀  ASISTENTE MULTI-APP (MOTOR UNIVERSAL V2)");
console.log("======================================================\n");

rl.question('1. Nombre de la nueva App (Ej: Altair Pro): ', (appNameInput) => {
    const appName = appNameInput.trim() || 'MiApp';
    const appSlug = appName.replace(/[^a-zA-Z0-9 ]/g, ''); // Permite espacios temporalmente
    const defaultId = `com.${appSlug.replace(/\s+/g, '').toLowerCase()}.app`; // ID sin espacios

    // === MODIFICACIÓN: Autollenado en la consola ===
    rl.question(`2. ID de la App (Puedes editarlo o presionar Enter): `, (appIdInput) => {
        const appId = appIdInput.trim() || defaultId;

        // === PREGUNTAR POR EL ÍCONO AQUÍ ===
        rl.question('\n3. ¿Desea cambiar el icono de la aplicacion? (S/N): ', (askIcon) => {
            const ans = askIcon.trim().toLowerCase();
            if (ans === 's' || ans === 'si') {
                rl.question('   [INFO] Arrastra aqui tu imagen (Soporta PNG y JPG): ', (iconPathInput) => {
                    let iconPath = iconPathInput.trim().replace(/^["']|["']$/g, '');
                    
                    // =========================================================
                    // Traducción de rutas WSL (/mnt/c/...) a Windows (C:\...)
                    // =========================================================
                    if (iconPath.toLowerCase().startsWith('/mnt/')) {
                        const parts = iconPath.split('/');
                        const drive = parts[2].toUpperCase(); // 'c' -> 'C'
                        const rest = parts.slice(3).join('\\');
                        iconPath = `${drive}:\\${rest}`;
                    }

                    // Llamamos a procesar, eliminando espacios del slug para la Base de Datos
                    finalizarConfiguracion(appName, appSlug.replace(/\s+/g, ''), appId, iconPath);
                });
            } else {
                finalizarConfiguracion(appName, appSlug.replace(/\s+/g, ''), appId, "");
            }
        });
    });
    
    // ESTA ES LA MAGIA: Escribe el ID en la línea de comandos para que el usuario pueda editarlo
    rl.write(defaultId); 
});

function finalizarConfiguracion(appName, appSlug, appId, iconPath) {
    console.log("\n⏳ Aplicando cambios en archivos locales...");

    try {
        if (fs.existsSync(capacitorFile)) {
            let cap = JSON.parse(fs.readFileSync(capacitorFile, 'utf8'));
            cap.appId = appId;
            cap.appName = appName;
            fs.writeFileSync(capacitorFile, JSON.stringify(cap, null, 2), 'utf8');
            console.log(`  [✔] capacitor.config.json -> App: ${appName}`);
        }
    } catch (e) { console.error("  [!] Error en capacitor.config.json:", e.message); }

    try {
        if (fs.existsSync(apiDbFile)) {
            let apiContent = fs.readFileSync(apiDbFile, 'utf8');
            const regex = /const API_URL = ".*";/;
            apiContent = apiContent.replace(regex, `const API_URL = "https://kenth1977.pythonanywhere.com/api/${appSlug}";`);
            fs.writeFileSync(apiDbFile, apiContent, 'utf8');
            console.log(`  [✔] api_db.js              -> Encontrado y actualizado`);
            console.log(`  [✔] URL actualizada        -> https://kenth1977.pythonanywhere.com/api/${appSlug}`);
        }
    } catch (e) { console.error("  [!] Error en api_db.js:", e.message); }

    try {
        if (fs.existsSync(packageJsonFile)) {
            let pkg = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
            pkg.name = appSlug.toLowerCase();
            fs.writeFileSync(packageJsonFile, JSON.stringify(pkg, null, 2), 'utf8');
            console.log(`  [✔] package.json            -> Nombre: ${pkg.name}`);
        }
    } catch (e) {}

    // =============================================================
    // MAGIA NUEVA: DOWNGRADE AUTOMÁTICO DE CAPACITOR UPDATER
    // =============================================================
    try {
        console.log("\n⏳ Instalando la versión correcta del plugin OTA para evitar errores Java...");
        // Esto obligará a tu PC a descargar los archivos correctos a "node_modules"
        execSync('npm install @capgo/capacitor-updater@6.4.0', { stdio: 'inherit' });
        console.log(`  [✔] Plugin instalado correctamente. El error de compilación ha sido neutralizado.`);
    } catch (error) {
        console.error("  [!] Hubo un detalle descargando el plugin, revisa tu conexión a internet.");
    }

    // =============================================================
    // CREAR ARCHIVO DE ENLACE PARA CONSTRUIR.BAT
    // =============================================================
    try {
        const androidDir = path.join(__dirname, 'android');
        if (fs.existsSync(androidDir)) {
            const buildConfigFile = path.join(androidDir, 'build_config.bat');
            // Guardamos las respuestas en variables de Batch (.bat)
            const batContent = `@echo off\nset "CUSTOM_NAME=${appName}"\nset "ICON_PATH=${iconPath}"\n`;
            fs.writeFileSync(buildConfigFile, batContent, 'utf8');
            console.log(`  [✔] build_config.bat        -> Enlace creado para automatizar compilacion`);
        }
    } catch(e) {
        console.error("  [!] Error creando build_config.bat:", e.message);
    }

    console.log("\n======================================================");
    console.log("✨ ¡CONFIGURACIÓN COMPLETADA!");
    console.log(`📡 Tu App ahora apunta a la base de datos: ${appSlug}.db`);
    console.log("\nPROXIMOS PASOS:");
    console.log(`1. Visita: https://kenth1977.pythonanywhere.com/api/${appSlug}/crear_ahora`);
    console.log(`2. Entra a la carpeta android: cd android`);
    console.log(`3. Ejecuta: construir.bat`);
    console.log("======================================================\n");
    
    rl.close();
}