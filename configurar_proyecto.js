const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

rl.question('1. Nombre de la nueva App (Ej: Altair Pro): ', (appName) => {
    if (!appName.trim()) {
        console.log("❌ El nombre es obligatorio. Saliendo...");
        rl.close();
        return;
    }

    // Generamos el Slug (Nombre seguro para URL y Archivo .db)
    const appSlug = appName.replace(/\s+/g, '');

    rl.question(`2. ID de la App (Ej: com.${appSlug.toLowerCase()}.app) [Enter para default]: `, (appId) => {
        if (!appId.trim()) {
            appId = `com.${appSlug.toLowerCase()}.app`;
        }

        rl.question('3. Breve descripción: ', (appDesc) => {
            
            console.log("\n⏳ Aplicando cambios en archivos locales...");

            // -------------------------------------------------------------
            // 1. ACTUALIZAR capacitor.config.json
            // -------------------------------------------------------------
            try {
                if (fs.existsSync(capacitorFile)) {
                    let cap = JSON.parse(fs.readFileSync(capacitorFile, 'utf8'));
                    cap.appId = appId;
                    cap.appName = appName;
                    fs.writeFileSync(capacitorFile, JSON.stringify(cap, null, 2), 'utf8');
                    console.log(`  [✔] capacitor.config.json -> App: ${appName}`);
                }
            } catch (e) {
                console.error("  [!] Error en capacitor.config.json:", e.message);
            }

            // -------------------------------------------------------------
            // 2. ACTUALIZAR api_db.js (Sincronización con el Motor)
            // -------------------------------------------------------------
            try {
                if (fs.existsSync(apiDbFile)) {
                    let apiContent = fs.readFileSync(apiDbFile, 'utf8');
                    
                    // La nueva URL apunta al slug dinámico del Motor Universal
                    const nuevaUrlBase = `https://kenth1977.pythonanywhere.com/api/${appSlug}`;
                    
                    // Buscamos la línea const API_URL = "..."
                    const regexUrl = /const API_URL\s*=\s*["'][^"']+["']/;
                    
                    if (regexUrl.test(apiContent)) {
                        apiContent = apiContent.replace(regexUrl, `const API_URL = "${nuevaUrlBase}"`);
                        fs.writeFileSync(apiDbFile, apiContent, 'utf8');
                        console.log(`  [✔] api_db.js              -> Encontrado en: ${path.relative(__dirname, apiDbFile)}`);
                        console.log(`  [✔] URL actualizada        -> ${nuevaUrlBase}`);
                    } else {
                        console.log("  [!] No se encontró 'const API_URL' en api_db.js.");
                    }
                } else {
                    console.log("  [!] ARCHIVO NO ENCONTRADO: No se detectó api_db.js en la raíz, www/ o www/js/");
                }
            } catch (e) {
                console.error("  [!] Error en api_db.js:", e.message);
            }

            // -------------------------------------------------------------
            // 3. ACTUALIZAR package.json
            // -------------------------------------------------------------
            try {
                if (fs.existsSync(packageJsonFile)) {
                    let pkg = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
                    pkg.name = appSlug.toLowerCase();
                    if (appDesc) pkg.description = appDesc;
                    fs.writeFileSync(packageJsonFile, JSON.stringify(pkg, null, 2), 'utf8');
                    console.log(`  [✔] package.json            -> Nombre: ${pkg.name}`);
                }
            } catch (e) {}

            console.log("\n======================================================");
            console.log("✨ ¡CONFIGURACIÓN COMPLETADA!");
            console.log(`📡 Tu App ahora apunta a la base de datos: ${appSlug}.db`);
            console.log("\nPROXIMOS PASOS:");
            console.log(`1. Visita: https://kenth1977.pythonanywhere.com/api/${appSlug}/crear_ahora`);
            console.log(`2. Verifica que el mensaje diga "status: ok"`);
            console.log(`3. Abre tu App local con 'npx http-server' y ¡listo!`);
            console.log("======================================================\n");
            
            rl.close();
        });
    });
});