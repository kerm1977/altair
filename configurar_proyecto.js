// ==============================================================================
// ARCHIVO: configurar_proyecto.js
// ROL: Asistente de configuración (Modo Dios) - Versión PocketBase (Sin SQLite)
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
console.log("Este asistente preparará tu app y sincronizará el código automáticamente.\n");

rl.question("1. Nombre de la nueva App (Ej: Mi Restaurante): ", (appName) => {
    
    // Asignar nombre o usar default
    const finalAppName = appName.trim() || 'La Tribu';
    
    // Generar ID sugerido limpiando el nombre (minúsculas, sin espacios ni caracteres raros)
    const sugerenciaId = `com.${finalAppName.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`;

    rl.question(`2. ID del Paquete (Presiona Enter para usar '${sugerenciaId}'): `, (appId) => {
        
        let finalAppId = appId.trim() || sugerenciaId;

        // ===================================================================
        // VALIDACIÓN CRÍTICA PARA ANDROID (Debe contener al menos un punto)
        // ===================================================================
        if (!finalAppId.includes('.')) {
            finalAppId = `com.${finalAppId.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`;
            console.log(`\n⚠️  AVISO: Android exige que el ID tenga al menos un punto (.). Auto-corregido a: '${finalAppId}'`);
        }

        // NUEVAS PREGUNTAS PARA EL PACKAGE.JSON
        rl.question("3. Descripción de la App (Ej: App de Delivery): ", (appDesc) => {
            const finalAppDesc = appDesc.trim() || 'Plantilla de App con PocketBase';

            rl.question("4. Autor (Ej: Tu Nombre o Empresa): ", (appAuthor) => {
                const finalAppAuthor = appAuthor.trim() || '';

                console.log("\n⚙️  Configurando variables del proyecto...");

                // ===================================================================
                // 1. ACTUALIZAR capacitor.config.json
                // ===================================================================
                const capConfigPath = path.join(__dirname, 'capacitor.config.json');
                if (fs.existsSync(capConfigPath)) {
                    try {
                        const capConfig = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'));
                        capConfig.appId = finalAppId;
                        capConfig.appName = finalAppName;
                        fs.writeFileSync(capConfigPath, JSON.stringify(capConfig, null, 2));
                        console.log(`✅ capacitor.config.json actualizado (Nombre: ${finalAppName}, ID: ${finalAppId})`);
                    } catch (err) {
                        console.error("❌ Error leyendo capacitor.config.json:", err.message);
                    }
                } else {
                    console.warn("⚠️ No se encontró capacitor.config.json");
                }

                // ===================================================================
                // 2. ACTUALIZAR package.json 
                // ===================================================================
                const pkgConfigPath = path.join(__dirname, 'package.json');
                if (fs.existsSync(pkgConfigPath)) {
                    try {
                        const pkgConfig = JSON.parse(fs.readFileSync(pkgConfigPath, 'utf8'));
                        
                        // package.json exige nombres en minúsculas, sin espacios y seguros para URL
                        const safePkgName = finalAppName.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                        
                        // Se reescribe la información interna del proyecto
                        pkgConfig.name = safePkgName || 'app-generica';
                        pkgConfig.version = "1.0.0"; // Reiniciamos la versión a la 1.0.0 por ser una app nueva
                        pkgConfig.description = finalAppDesc;
                        pkgConfig.author = finalAppAuthor;
                        
                        // Se guarda el archivo package.json modificado asegurando codificación utf8
                        fs.writeFileSync(pkgConfigPath, JSON.stringify(pkgConfig, null, 2), 'utf8');
                        
                        // Verificación de lectura: abrimos el archivo nuevamente para estar 100% seguros de que se guardó
                        const checkPkg = JSON.parse(fs.readFileSync(pkgConfigPath, 'utf8'));
                        console.log(`✅ package.json actualizado (Nombre interno verificado: ${checkPkg.name}, Autor: ${checkPkg.author || 'Anónimo'})`);
                    } catch (err) {
                        console.error("❌ Error actualizando package.json:", err.message);
                    }
                } else {
                    console.warn("⚠️ No se encontró package.json");
                }

                // ===================================================================
                // 3. EJECUTAR npx cap sync AUTOMÁTICAMENTE
                // ===================================================================
                console.log("\n🔄 Inyectando el código en Android (Ejecutando npx cap sync)...");
                console.log("⏳ Por favor espera, esto puede tomar unos segundos...\n");
                
                try {
                    // stdio: 'inherit' permite que veas los colores y el progreso real de Capacitor en tu consola
                    execSync('npx cap sync', { stdio: 'inherit' });
                    console.log("\n✅ Sincronización completada con éxito.");
                } catch (error) {
                    console.error("\n❌ Error al ejecutar npx cap sync. Revisa si Capacitor está instalado correctamente.");
                }

                console.log("\n========================================================");
                console.log("🎉 ¡CONFIGURACIÓN COMPLETADA!");
                console.log("========================================================");
                console.log("👉 El código ya está dentro de la caja fuerte de Android.");
                console.log("👉 Tu único paso final es compilar:");
                console.log("   1. cd android");
                console.log("   2. construir.bat");
                
                // Aviso visual importante para el usuario sobre su consola
                console.log("\n💡 NOTA SOBRE LA CONSOLA:");
                console.log("Si tu terminal sigue mostrando '(pepinocho@1.0.0)' es normal.");
                console.log("Las consolas guardan ese nombre en memoria al abrirlas.");
                console.log("Cierra la consola y ábrela de nuevo (o escribe 'cd .') para refrescarlo.\n");
                
                rl.close();
            }); // Fin pregunta 4 (Autor)
        }); // Fin pregunta 3 (Descripción)
    }); // Fin pregunta 2 (ID)
}); // Fin pregunta 1 (Nombre)