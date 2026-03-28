// ==============================================================================
// ARCHIVO: runserver.js
// ROL: Orquestador del Servidor Global (PocketBase + Tailscale Funnel)
// ==============================================================================

const { spawn } = require('child_process');

console.log("======================================================");
console.log(" 🚀 INICIANDO SERVIDOR GLOBAL (POCKETBASE + TAILSCALE)");
console.log("======================================================\n");

// 1. Iniciar PocketBase (Apunta directamente al .exe en la misma carpeta)
// Aquí está el cambio clave:
const pbProcess = spawn('.\\pocketbase.exe', ['serve'], { shell: true });

pbProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) console.log(`[📦 PocketBase] ${output}`);
});

pbProcess.stderr.on('data', (data) => {
    console.error(`[📦 PocketBase ERROR] ${data.toString().trim()}`);
});

// 2. Iniciar Tailscale Funnel (después de 2 segundos para dar tiempo a la BD)
setTimeout(() => {
    console.log("\n[🌐 Tailscale] Abriendo túnel global en el puerto 8090...\n");
    const tsProcess = spawn('tailscale', ['funnel', '8090'], { shell: true });

    tsProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) console.log(`[🌐 Tailscale] ${output}`);
    });

    tsProcess.stderr.on('data', (data) => {
        console.error(`[🌐 Tailscale ERROR] ${data.toString().trim()}`);
    });

    // 3. Apagado seguro (Ctrl + C)
    process.on('SIGINT', () => {
        console.log("\n\n🛑 Apagando servidores de forma segura...");
        pbProcess.kill();
        tsProcess.kill();
        console.log("✅ Servidores apagados. ¡Hasta pronto!");
        process.exit();
    });

}, 2000);