// ==============================================================================
// ARCHIVO: runserver.js
// ROL: Orquestador del Servidor Global (PocketBase + Tailscale Funnel)
// SOPORTE: Windows y Linux/macOS Automático
// ==============================================================================

const { spawn } = require('child_process');

console.log("======================================================");
console.log(" 🚀 INICIANDO SERVIDOR GLOBAL (POCKETBASE + TAILSCALE)");
console.log("======================================================\n");

// 1. Detectar el Sistema Operativo para ejecutar el binario correcto
const isWindows = process.platform === "win32";
const pbCommand = isWindows ? '.\\pocketbase.exe' : './pocketbase';

console.log(`[⚙️ OS Detectado] ${isWindows ? 'Windows' : 'Linux/macOS'}`);
console.log(`[⚙️ Comando PB] Ejecutando: ${pbCommand}\n`);

// 2. Iniciar PocketBase
const pbProcess = spawn(pbCommand, ['serve'], { shell: true });

pbProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) console.log(`[📦 PocketBase] ${output}`);
});

pbProcess.stderr.on('data', (data) => {
    console.error(`[📦 PocketBase ERROR] ${data.toString().trim()}`);
});

// 3. Iniciar Tailscale Funnel (después de 2 segundos para dar tiempo a la BD)
setTimeout(() => {
    console.log("\n[🌐 Tailscale] Abriendo túnel global de BD en el puerto local 8090 -> Público: 8443...\n");
    
    // CORRECCIÓN FINAL: Volvemos a usar "funnel" para que sea PÚBLICO y accesible desde 
    // el internet del celular (4G/WiFi), manteniendo los parámetros de segundo plano.
    const tsProcess = spawn('tailscale', ['funnel', '--bg', '--https=8443', 'http://127.0.0.1:8090'], { shell: true });

    tsProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) console.log(`[🌐 Tailscale] ${output}`);
    });

    tsProcess.stderr.on('data', (data) => {
        console.error(`[🌐 Tailscale ERROR] ${data.toString().trim()}`);
    });

    tsProcess.on('close', (code) => {
        console.log(`[🌐 Tailscale] Proceso cerrado con código ${code} (Ejecutándose en segundo plano)`);
    });
}, 2000);