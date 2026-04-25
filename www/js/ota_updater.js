// ==============================================================================
// ARCHIVO: js/ota_updater.js
// ROL: Sistema de Actualizaciones Automáticas (OTA) interactivo con Modal UI
// ==============================================================================

async function verificarActualizacionesOTA() {
    console.log("🔄 Iniciando verificación de actualizaciones OTA...");
    
    try {
        // Validamos si el plugin de Capacitor está disponible
        if (typeof Capacitor === 'undefined' || !Capacitor.Plugins.CapacitorUpdater) {
            console.warn("⚠️ Plugin CapacitorUpdater no detectado. ¿Estás probando en navegador web?");
            return;
        }

        const CapacitorUpdater = Capacitor.Plugins.CapacitorUpdater;

        // 1. Notificamos a Capgo que la app inició correctamente
        await CapacitorUpdater.notifyAppReady();

        // 2. Obtener la información del servidor (PocketBase) usando la URL de api_db.js
        const url = `${POCKETBASE_URL}/collections/ota_updates/records?sort=-created&perPage=1`;
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            throw new Error("No se pudo conectar con el servidor de actualizaciones OTA.");
        }

        const datos = await respuesta.json();

        // 3. Verificar si hay alguna actualización publicada
        if (datos.items && datos.items.length > 0) {
            const ultimaActualizacion = datos.items[0];
            const versionServidor = ultimaActualizacion.version;
            const nombreArchivo = ultimaActualizacion.archivo_zip;
            const recordId = ultimaActualizacion.id;

            // Construir la URL de descarga exacta
            const urlDescarga = `${POCKETBASE_URL}/files/ota_updates/${recordId}/${nombreArchivo}`;

            // 4. Obtener la versión local
            let versionLocal = "0.0.0";
            try {
                const estado = await CapacitorUpdater.current();
                versionLocal = estado.bundle || "builtin"; // 'builtin' es el código del APK original
            } catch (e) {
                console.log("ℹ️ Detectada versión base del APK.");
                versionLocal = "builtin";
            }

            console.log(`📦 Versión Local: ${versionLocal} | ☁️ Versión Servidor: ${versionServidor}`);

            // 5. Si hay una nueva versión, mostramos el modal en lugar de forzar la actualización
            if (versionServidor !== versionLocal) {
                console.log(`🚀 Nueva versión encontrada (${versionServidor}). Mostrando aviso al usuario...`);
                
                // Obtener los elementos del DOM (del index.html)
                const modalElement = document.getElementById('updateAppModal');
                const btnDownload = document.getElementById('btn-download-update');
                
                if (modalElement && btnDownload) {
                    // Instanciar y mostrar el Modal usando Bootstrap
                    const updateModal = new bootstrap.Modal(modalElement);
                    updateModal.show();

                    // Asignar el evento de clic al botón de "Actualizar Ahora"
                    btnDownload.onclick = async () => {
                        try {
                            // Cambiar la UI del botón para mostrar que está cargando
                            btnDownload.disabled = true;
                            btnDownload.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Descargando...`;
                            
                            console.log("📥 Descargando paquete de actualización...");
                            
                            // Descargar el archivo ZIP
                            const versionDescargada = await CapacitorUpdater.download({
                                url: urlDescarga,
                                version: versionServidor
                            });

                            // Cambiar UI a instalando
                            btnDownload.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Instalando y reiniciando...`;
                            console.log("✅ Descarga completada. Aplicando actualización...");
                            
                            // Aplicar la actualización (Esto forzará un reinicio inmediato de la app)
                            await CapacitorUpdater.set({ id: versionDescargada.id });
                            
                        } catch (err) {
                            console.error("❌ Error al descargar o aplicar la actualización:", err);
                            // Restaurar el botón en caso de error de red
                            btnDownload.disabled = false;
                            btnDownload.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i> Error. Intentar de nuevo`;
                        }
                    };
                } else {
                    console.warn("⚠️ No se encontró el modal 'updateAppModal' en el HTML.");
                }
            } else {
                console.log("✅ La aplicación ya está actualizada.");
            }
        } else {
            console.log("ℹ️ No hay actualizaciones disponibles en el servidor.");
        }

    } catch (error) {
        console.error("❌ Error en el proceso OTA:", error);
    }
}

// Exponer la función globalmente por si necesitamos llamarla manualmente
window.verificarActualizacionesOTA = verificarActualizacionesOTA;

// Ejecutar automáticamente al abrir la app en el dispositivo
document.addEventListener('deviceready', () => {
    verificarActualizacionesOTA();
}, false);