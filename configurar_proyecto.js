// ==============================================================================
// ARCHIVO: configurar_proyecto.js
// RESPONSABILIDAD: Asistente de terminal (Node.js) para inicializar nuevas apps.
//                  Crea configuraciones locales y DB SQLite (Modo 100% Local).
// ==============================================================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

    // ==============================================================================
    // 1. DATOS BÁSICOS
    // ==============================================================================
    const appNameInput = await ask(' 📱 1. Nombre de la nueva App (Ej: Altair Pro): ');
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
    // 3. RECOLECCIÓN DE SUPERUSUARIOS (Máx 4)
    // ==============================================================================
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
        
        const emailInput = await ask(`   Correo electrónico (Enter para 'admin@app.com'): `);
        const email = emailInput.trim() || 'admin@app.com';
        
        let password = "";
        let passMatch = false;
        
        while (!passMatch) {
            const passMsg = email === 'admin@app.com' 
                ? `   Contraseña temporal (Enter para 'admin'): ` 
                : `   Contraseña temporal: `;
                
            const passInput = await ask(passMsg);
            password = passInput.trim() || (email === 'admin@app.com' ? 'admin' : '');
            
            if (email === 'admin@app.com' && password === 'admin') {
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
        
        const pin = String(i - 1).repeat(8);
        superusuarios.push({ email, password, pin });
    }

    // ==============================================================================
    // 4. GESTIÓN DE BASE DE DATOS LOCAL (SQLITE) COMBINADA CON SUPERUSUARIOS
    // ==============================================================================
    console.log("\n 🗄️  5. Verificación de Base de Datos Local");
    const dbFileName = `${appSlug}.db`;
    const dbFilePath = path.join(__dirname, dbFileName);
    let dbAction = 'create';

    if (fs.existsSync(dbFilePath)) {
        console.log(`   [!] Se detectó la base de datos: ${dbFileName}`);
        const action = await ask(`   ¿Deseas (C)ombinarla [Conservar datos y agregar los ${superusuarios.length} usuarios asignados] o (S)obreescribirla [Borrar todo]? (C/S): `);

        if (action.trim().toUpperCase() === 'S') {
            console.log(`\n   [⚠️] INICIANDO PROTOCOLO DE BORRADO SEGURO...`);
            
            const conf1 = await ask(`   1/3: ¿Estás seguro de borrar la base de datos actual? (SI/NO): `);
            const conf1Val = conf1.trim().toUpperCase();
            
            // Aceptamos "S" o "SI" para que sea más amigable
            if (conf1Val === 'SI' || conf1Val === 'S') {
                
                const conf2 = await ask(`   2/3: ¡ATENCIÓN! Se perderán TODOS los datos. Escribe 'BORRAR' para continuar: `);
                if (conf2.trim() === 'BORRAR') {
                    
                    const conf3 = await ask(`   3/3: Última advertencia. Escribe 'ESTOY SEGURO' para eliminarla definitivamente: `);
                    if (conf3.trim() === 'ESTOY SEGURO') {
                        fs.unlinkSync(dbFilePath);
                        console.log(`   [✔] Base de datos anterior eliminada permanentemente.`);
                        fs.writeFileSync(dbFilePath, ''); 
                        console.log(`   [✔] Nueva base de datos en blanco creada: ${dbFileName}`);
                        dbAction = 'overwrite';
                    } else {
                        console.log(`   [✖] Seguridad activada (Paso 3 fallido). Operación cancelada.`);
                        process.exit(0);
                    }
                } else {
                    console.log(`   [✖] Seguridad activada (Paso 2 fallido). Operación cancelada.`);
                    process.exit(0);
                }
            } else {
                console.log(`   [✖] Operación cancelada por el usuario.`);
                process.exit(0);
            }
        } else {
            // Combinar: Mantenemos la original y hacemos una copia de seguridad por si acaso
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `${appSlug}_backup_${timestamp}.db`;
            fs.copyFileSync(dbFilePath, path.join(__dirname, backupName));
            console.log(`   [✔] Respaldo de seguridad creado: ${backupName}`);
            console.log(`   [✔] La DB se mantendrá. Se inyectarán los ${superusuarios.length} superusuarios a la información existente.`);
            dbAction = 'combine';
        }
    } else {
        fs.writeFileSync(dbFilePath, '');
        console.log(`   [✔] Base de datos local creada exitosamente: ${dbFileName}`);
    }

    console.log("\n⏳ Aplicando configuraciones locales y estilos nativos móviles...");
    
    // ==============================================================================
    // 5. MODIFICAR ARCHIVOS LOCALES
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
            // Solo actualizamos el APP_SLUG para modo local, eliminamos la reescritura de API_URL hacia PythonAnywhere
            apiDbContent = apiDbContent.replace(/const APP_SLUG\s*=\s*['"].*?['"];?/, `const APP_SLUG = "${appSlug}";`);
            fs.writeFileSync(apiDbFile, apiDbContent, 'utf8');
            console.log(`  [✔] api_db.js             -> Variable APP_SLUG actualizada`);
        }

        // --- CREACIÓN DE init_data.json CON BANDERA DE ACCIÓN ---
        const initDataPath = path.join(__dirname, 'www', 'init_data.json');
        fs.writeFileSync(initDataPath, JSON.stringify({ 
            superusers: superusuarios, 
            dbName: dbFileName,
            dbAction: dbAction // 'create', 'overwrite' o 'combine'
        }, null, 2));
        console.log(`  [✔] init_data.json        -> Generado con acción '${dbAction}' y ${superusuarios.length} superusuarios.`);

    } catch (e) {
        console.log("  [ADVERTENCIA] No se pudieron actualizar todos los archivos locales: " + e.message);
    }

    console.log("\n✨ ¡CONFIGURACIÓN LOCAL COMPLETADA!");
    finalizar();
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