// configurar_proyecto.js
// ==============================================================================
// ARCHIVO: configurar_proyecto.js
// ROL: Asistente CLI para configurar Nombre, ID, Package, Icono y Sincronizar
// ==============================================================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("========================================================");
console.log("🚀 MODO DIOS: CONFIGURADOR DE APP (POCKETBASE) 🚀");
console.log("========================================================\n");
console.log("Este asistente preparará tu app, tu icono y sincronizará el código automáticamente.\n");

const capConfigPath = path.join(__dirname, 'capacitor.config.json');

// Leer configuración actual si existe para usarla de default
let currentAppName = "Altair";
let currentAppId = "com.altair.app";

if (fs.existsSync(capConfigPath)) {
    try {
        const currentConfig = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'));
        if (currentConfig.appName) currentAppName = currentConfig.appName;
        if (currentConfig.appId) currentAppId = currentConfig.appId;
    } catch (e) {}
}

rl.question(`1. Nombre de la nueva App (Ej: Mi Restaurante) [Actual: ${currentAppName}]: `, (appNameInput) => {
    const finalAppName = appNameInput.trim() || currentAppName;
    
    // Generar ID sugerido limpiando el nombre
    const sugerenciaId = `com.${finalAppName.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`;

    rl.question(`2. ID del Paquete (Presiona Enter para usar '${sugerenciaId}'): `, (appIdInput) => {
        let finalAppId = appIdInput.trim() || sugerenciaId;

        // ===================================================================
        // VALIDACIÓN CRÍTICA PARA ANDROID (Debe contener al menos un punto)
        // ===================================================================
        if (!finalAppId.includes('.')) {
            finalAppId = `com.${finalAppId.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`;
            console.log(`\n⚠️  AVISO: Android exige que el ID tenga al menos un punto (.). Auto-corregido a: '${finalAppId}'`);
        }

        rl.question("3. Descripción de la App (Ej: App de Delivery): ", (appDesc) => {
            const finalAppDesc = appDesc.trim() || 'Plantilla de App con PocketBase';

            rl.question("4. Autor (Ej: Tu Nombre o Empresa): ", (appAuthor) => {
                const finalAppAuthor = appAuthor.trim() || '';

                console.log('\n======================================================');
                console.log(' 🖼️  CONFIGURACIÓN DEL ICONO / LOGO DE LA APP');
                console.log('======================================================');
                console.log('👉 ARRASTRA Y SUELTA tu imagen (PNG o JPG) aquí en la consola y presiona Enter.');
                console.log('   (O simplemente presiona Enter para saltar este paso y mantener el actual)');

                rl.question('\n5. Ruta de la imagen: ', (iconInput) => {
                    
                    console.log("\n⚙️  Configurando variables del proyecto...");

                    // ===================================================================
                    // 1. ACTUALIZAR capacitor.config.json
                    // ===================================================================
                    if (fs.existsSync(capConfigPath)) {
                        try {
                            const capConfig = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'));
                            capConfig.appId = finalAppId;
                            capConfig.appName = finalAppName;
                            fs.writeFileSync(capConfigPath, JSON.stringify(capConfig, null, 2));
                            console.log(`✅ capacitor.config.json actualizado.`);
                        } catch (err) {
                            console.error("❌ Error leyendo capacitor.config.json:", err.message);
                        }
                    }

                    // ===================================================================
                    // 2. ACTUALIZAR package.json 
                    // ===================================================================
                    const pkgConfigPath = path.join(__dirname, 'package.json');
                    if (fs.existsSync(pkgConfigPath)) {
                        try {
                            const pkgConfig = JSON.parse(fs.readFileSync(pkgConfigPath, 'utf8'));
                            const safePkgName = finalAppName.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                            
                            pkgConfig.name = safePkgName || 'app-generica';
                            pkgConfig.version = "1.0.0";
                            pkgConfig.description = finalAppDesc;
                            pkgConfig.author = finalAppAuthor;
                            
                            fs.writeFileSync(pkgConfigPath, JSON.stringify(pkgConfig, null, 2), 'utf8');
                            console.log(`✅ package.json actualizado.`);
                        } catch (err) {}
                    }

                    // ===================================================================
                    // 3. LA MAGIA: PROCESAR ICONO CON LA HERRAMIENTA OFICIAL DE CAPACITOR
                    // ===================================================================
                    // Limpieza robusta de ruta y espacios escapados
                    let cleanIconPath = iconInput.trim().replace(/^["']|["']$/g, '');
                    cleanIconPath = cleanIconPath.replace(/\\ /g, ' '); // NUEVO: Elimina las barras invertidas que escapan espacios
                    
                    // TRADUCTOR INVISIBLE: Si la consola te coló una ruta tipo GitBash/WSL (/mnt/c/...), la pasamos a C:\
                    if (process.platform === 'win32' && cleanIconPath.match(/^\/mnt\/[a-zA-Z]\//)) {
                        const letraDisco = cleanIconPath.charAt(5).toUpperCase();
                        const restoRuta = cleanIconPath.slice(7).replace(/\//g, '\\');
                        cleanIconPath = `${letraDisco}:\\${restoRuta}`;
                    } else if (process.platform === 'win32' && cleanIconPath.match(/^\/[a-zA-Z]\//)) {
                        // Por si acaso lanza formato tipo /c/Users/...
                        const letraDisco = cleanIconPath.charAt(1).toUpperCase();
                        const restoRuta = cleanIconPath.slice(3).replace(/\//g, '\\');
                        cleanIconPath = `${letraDisco}:\\${restoRuta}`;
                    }
                    
                    if (cleanIconPath && fs.existsSync(cleanIconPath)) {
                        const ext = path.extname(cleanIconPath).toLowerCase();
                        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
                            try {
                                // A. CREAR LA RUTA EXACTA QUE PEDISTE (www/img/icos)
                                const customImgDir = path.join(__dirname, 'www', 'img', 'icos');
                                if (!fs.existsSync(customImgDir)) {
                                    fs.mkdirSync(customImgDir, { recursive: true });
                                }

                                // B. Extraer el nombre original y copiar la imagen ahí
                                const originalFileName = path.basename(cleanIconPath);
                                const customImgPath = path.join(customImgDir, originalFileName);
                                fs.copyFileSync(cleanIconPath, customImgPath);
                                console.log(`\n✅ Imagen del APK guardada correctamente en la ruta:`);
                                console.log(`   -> ${customImgPath}`);

                                // C. CONFIGURAR CAPACITOR (Para generar el código en Java/Android)
                                // Capacitor necesita a juro que exista 'assets/icon.png', así que le hacemos una copia invisible.
                                const assetsDir = path.join(__dirname, 'assets');
                                if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
                                fs.copyFileSync(cleanIconPath, path.join(assetsDir, 'icon.png'));
                                fs.copyFileSync(cleanIconPath, path.join(assetsDir, 'splash.png'));

                                // D. Instalar la librería oficial de iconos (si no existe)
                                const isAssetsInstalled = fs.existsSync(path.join(__dirname, 'node_modules', '@capacitor', 'assets'));
                                if (!isAssetsInstalled) {
                                    console.log("⏳ Preparando generador de iconos de Android...");
                                    console.log("   (Instalando @capacitor/assets, esto puede tardar unos segundos...)");
                                    // Añadido --legacy-peer-deps para ignorar conflictos de versiones entre plugins
                                    execSync('npm install @capacitor/assets --save-dev --legacy-peer-deps', { stdio: 'inherit' });
                                } else {
                                    console.log("✅ Generador de iconos nativo ya instalado, omitiendo descarga.");
                                }

                                // E. Destruir y generar los iconos perfectos en Android
                                console.log("🖼️  Generando Iconos Adaptativos y Pantalla de Carga en Android...");
                                execSync('npx capacitor-assets generate --android', { stdio: 'inherit' });
                                
                                console.log(`✅ ¡Iconos de Android configurados con éxito!`);

                            } catch (err) {
                                console.log(`❌ Error procesando el icono: ${err.message}`);
                                console.log(`💡 SUGERENCIA: Revisa los logs de arriba. Si npm falla, puedes intentar instalarlo manualmente ejecutando: npm install @capacitor/assets --save-dev --legacy-peer-deps`);
                            }
                        } else {
                            console.log(`❌ Formato no soportado (${ext}). Por favor usa archivos PNG o JPG.`);
                        }
                    } else if (cleanIconPath) {
                        console.log(`❌ No se encontró la imagen en la ruta especificada:\n   -> ${cleanIconPath}`);
                    } else {
                        console.log(`ℹ️  No se modificó el icono. Se usará el actual.`);
                    }

                    // ===================================================================
                    // 4. EJECUTAR npx cap sync AUTOMÁTICAMENTE
                    // ===================================================================
                    console.log("\n🔄 Inyectando todo el código en Android (Ejecutando npx cap sync)...");
                    try {
                        execSync('npx cap sync', { stdio: 'inherit' });
                        console.log("\n✅ Sincronización completada con éxito.");
                    } catch (error) {
                        console.error("\n❌ Error al ejecutar npx cap sync.");
                    }

                    // ===================================================================
                    // FIN
                    // ===================================================================
                    console.log("\n========================================================");
                    console.log("🎉 ¡CONFIGURACIÓN COMPLETADA!");
                    console.log("========================================================");
                    console.log("👉 El código y tu icono ya están dentro de la caja fuerte de Android.");
                    console.log("👉 Tu único paso final es compilar:");
                    console.log("   1. cd android");
                    console.log("   2. construir.bat\n");
                    
                    rl.close();
                }); // Fin pregunta 5 (Icono)
            }); // Fin pregunta 4 (Autor)
        }); // Fin pregunta 3 (Descripción)
    }); // Fin pregunta 2 (ID)
}); // Fin pregunta 1 (Nombre)