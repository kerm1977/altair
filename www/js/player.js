/**
 * player.js - Controlador de Música de La Tribu
 * Gestiona la biblioteca, reproducción y sincronización automática de archivos.
 * Optimizado para listas de más de 50 canciones y alternancia de reproducción.
 */
(function() {
    
    const STORAGE_KEY = 'app_music_library';
    const MUSIC_ASSETS_PATH = 'assets/music/'; // Ruta a la carpeta física

    const playerController = {
        playlist: [],
        currentIndex: -1,
        audio: null,
        isPlaying: false,

        // --- 1. INICIALIZACIÓN ---
        init: async () => {
            console.log("🎵 Iniciando Reproductor de La Tribu...");
            
            // Vincular el elemento de audio del DOM
            playerController.audio = document.getElementById('audio-element');
            if(playerController.audio) {
                playerController.audio.ontimeupdate = playerController.updateProgress;
                playerController.audio.onended = playerController.next;
                playerController.audio.onloadedmetadata = () => {
                    const totalTimeEl = document.getElementById('time-total');
                    if(totalTimeEl) totalTimeEl.innerText = playerController.formatTime(playerController.audio.duration);
                };
                playerController.audio.onerror = (e) => {
                    console.error("Error cargando pista:", playerController.audio.src);
                    if(playerController.isPlaying) {
                        playerController.next();
                    }
                };
            }

            // Asegurar que la DB esté lista
            if (typeof db !== 'undefined' && db.init && !db.ready) await db.init();
            
            // Sincronizar con la carpeta física y cargar lista
            await playerController.syncLibrary();
            playerController.renderList();
        },

        // --- 2. SINCRONIZACIÓN Y PERSISTENCIA ---
        syncLibrary: async () => {
            try {
                console.log("🔄 Sincronizando biblioteca...");
                
                // Cargar registros actuales de la DB
                const data = await db.find(STORAGE_KEY);
                let currentList = (data && data.list) ? data.list : [];

                // Intentar leer el manifiesto de la carpeta de assets
                try {
                    const response = await fetch(`${MUSIC_ASSETS_PATH}manifest.json?v=${Date.now()}`);
                    if (response.ok) {
                        const manifest = await response.json(); 
                        console.log(`📄 Manifiesto detectado con ${manifest.length} entradas.`);
                        
                        let hasNewFiles = false;

                        manifest.forEach(item => {
                            // Usamos el nombre de archivo como identificador único para assets
                            const assetId = 'asset_' + item.file.toLowerCase().replace(/[^a-z0-9]/gi, '_');
                            
                            const exists = currentList.some(s => s.id === assetId || (s.isAsset && s.fileName === item.file));
                            
                            if (!exists) {
                                currentList.push({
                                    id: assetId,
                                    name: item.name || item.file.replace(/\.[^/.]+$/, ""),
                                    fileName: item.file,
                                    data: encodeURI(`${MUSIC_ASSETS_PATH}${item.file}`), 
                                    duration: "--:--",
                                    isAsset: true
                                });
                                hasNewFiles = true;
                            }
                        });

                        if (hasNewFiles) {
                            console.log("📥 Se han añadido nuevas canciones detectadas.");
                            await playerController.persistData(currentList);
                        }
                    } else {
                        console.warn("⚠️ No se pudo acceder a manifest.json.");
                    }
                } catch (err) {
                    console.error("❌ Error leyendo manifest.json:", err);
                }

                playerController.playlist = currentList;
                playerController.sortLibrary();
                console.log(`✅ Biblioteca lista: ${playerController.playlist.length} canciones.`);

            } catch (e) {
                console.error("❌ Error crítico en syncLibrary:", e);
                playerController.playlist = [];
            }
        },

        persistData: async (list) => {
            const payload = { email: STORAGE_KEY, list: list, lastUpdate: Date.now() };
            try { 
                await db.update(STORAGE_KEY, payload); 
            } catch (e) { 
                await db.insert(payload); 
            }
        },

        sortLibrary: () => {
            // Orden Alfabético obligatorio
            playerController.playlist.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, {sensitivity: 'base'}));
        },

        // --- 3. CONTROLES DE REPRODUCCIÓN ---
        
        /**
         * toggleSong: Maneja el clic en la lista.
         * Si es la misma canción, alterna Play/Pause. Si es otra, la carga y reproduce.
         */
        toggleSong: (index) => {
            if (playerController.currentIndex === index) {
                playerController.togglePlay();
            } else {
                playerController.playIndex(index);
            }
        },

        playIndex: (index) => {
            const song = playerController.playlist[index];
            if (!song) return;

            playerController.currentIndex = index;
            
            // Cargar la fuente (Ruta de asset o Base64 manual)
            playerController.audio.src = song.data;
            playerController.audio.load();
            
            // Actualizar Título en UI
            const titleEl = document.getElementById('player-title');
            if(titleEl) titleEl.innerText = song.name;
            
            playerController.play();
            playerController.highlightCurrent();
        },

        togglePlay: () => {
            if (playerController.playlist.length === 0) return window.ui.toast("Playlist vacía");
            if (playerController.isPlaying) playerController.pause();
            else playerController.play();
        },

        play: () => {
            if(playerController.currentIndex === -1 && playerController.playlist.length > 0) {
                return playerController.playIndex(0);
            }
            if(!playerController.audio.src) return;

            playerController.audio.play().then(() => {
                playerController.isPlaying = true;
                playerController.updateUIState(true);
            }).catch(err => {
                console.warn("Error Play:", err);
            });
        },

        pause: () => {
            if(playerController.audio) playerController.audio.pause();
            playerController.isPlaying = false;
            playerController.updateUIState(false);
        },

        stop: () => {
            playerController.pause();
            if(playerController.audio) playerController.audio.currentTime = 0;
            playerController.updateProgress();
            const statusEl = document.getElementById('player-status');
            if(statusEl) statusEl.innerText = "DETENIDO";
            const coverEl = document.getElementById('player-cover');
            if(coverEl) coverEl.classList.remove('is-playing-img');
        },

        next: () => {
            if (playerController.playlist.length === 0) return;
            let nextIdx = playerController.currentIndex + 1;
            if (nextIdx >= playerController.playlist.length) nextIdx = 0;
            playerController.playIndex(nextIdx);
        },

        prev: () => {
            if (playerController.playlist.length === 0) return;
            let prevIdx = playerController.currentIndex - 1;
            if (prevIdx < 0) prevIdx = playerController.playlist.length - 1;
            playerController.playIndex(prevIdx);
        },

        seek: (e) => {
            if (!playerController.audio || !playerController.audio.duration) return;
            const bar = e.currentTarget;
            const percent = e.offsetX / bar.offsetWidth;
            playerController.audio.currentTime = percent * playerController.audio.duration;
        },

        updateProgress: () => {
            if(!playerController.audio) return;
            const { currentTime, duration } = playerController.audio;
            if (isNaN(duration)) return;
            const percent = (currentTime / duration) * 100;
            const progressEl = document.getElementById('player-progress');
            if(progressEl) progressEl.style.width = `${percent}%`;
            const currentEl = document.getElementById('time-current');
            if(currentEl) currentEl.innerText = playerController.formatTime(currentTime);
        },

        updateUIState: (playing) => {
            const btn = document.getElementById('btn-play-pause');
            const cover = document.getElementById('player-cover');
            const status = document.getElementById('player-status');

            if (btn) {
                btn.innerHTML = playing 
                    ? '<i class="ph-fill ph-pause fs-1"></i>' 
                    : '<i class="ph-fill ph-play fs-1 ms-1"></i>';
            }

            if (cover) {
                if (playing) cover.classList.add('is-playing-img');
                else cover.classList.remove('is-playing-img');
            }

            if (status) {
                status.innerText = playing ? "REPRODUCIENDO" : "PAUSADO";
                if (playing) {
                    status.classList.replace('bg-warning-subtle', 'bg-warning');
                    status.classList.replace('text-warning', 'text-white');
                } else {
                    status.classList.replace('bg-warning', 'bg-warning-subtle');
                    status.classList.replace('text-white', 'text-warning');
                }
            }
            
            // Refrescar la lista para sincronizar los iconos de Play/Pause en cada fila
            playerController.renderList();
        },

        highlightCurrent: () => {
            document.querySelectorAll('.song-item').forEach(el => el.classList.remove('song-active'));
            const activeEl = document.getElementById(`song-${playerController.currentIndex}`);
            if (activeEl) {
                activeEl.classList.add('song-active');
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        },

        // --- 4. GESTIÓN DE ARCHIVOS (SUBIR, EDITAR, BORRAR) ---
        showUploadModal: () => {
            window.ui.modal(`
                <h4 class="fw-black mb-3 text-warning">Subir Canción</h4>
                <div class="mb-3 text-start">
                    <label class="form-label small fw-bold">NOMBRE VISIBLE</label>
                    <input type="text" id="up-name" class="form-control" placeholder="Ej: Mix Caminata">
                </div>
                <div class="mb-4 text-start">
                    <label class="form-label small fw-bold">ARCHIVO DE AUDIO</label>
                    <input type="file" id="up-file" class="form-control" accept="audio/*">
                </div>
                <div class="d-grid gap-2">
                    <button onclick="ViewControllers.player.handleUpload()" class="btn btn-warning text-white py-3 rounded-pill fw-bold shadow">
                        GUARDAR EN BIBLIOTECA
                    </button>
                    <button onclick="ui.closeModal()" class="btn btn-light py-2 rounded-pill">Cancelar</button>
                </div>
            `);
        },

        handleUpload: () => {
            const name = document.getElementById('up-name').value.trim();
            const fileInput = document.getElementById('up-file');
            if(!name || !fileInput.files[0]) return window.ui.toast("Campos obligatorios");

            const reader = new FileReader();
            reader.onload = async (e) => {
                const newSong = {
                    id: 'manual_' + Date.now(),
                    name: name,
                    data: e.target.result, // Base64
                    isAsset: false
                };
                playerController.playlist.push(newSong);
                await playerController.persistData(playerController.playlist);
                window.ui.closeModal();
                playerController.renderList();
                window.ui.toast("Canción añadida");
            };
            reader.readAsDataURL(fileInput.files[0]);
        },

        editSong: (id) => {
            const song = playerController.playlist.find(s => s.id === id);
            if(!song) return;
            window.ui.modal(`
                <h4 class="fw-black mb-4">Renombrar Canción</h4>
                <input type="text" id="edit-name" class="form-control mb-4" value="${song.name}">
                <div class="d-grid gap-2">
                    <button onclick="ViewControllers.player.saveEdit('${id}')" class="btn btn-success text-white py-3 rounded-pill fw-bold">GUARDAR CAMBIOS</button>
                    <button onclick="ui.closeModal()" class="btn btn-light py-2 rounded-pill">Cancelar</button>
                </div>
            `);
        },

        saveEdit: async (id) => {
            const newName = document.getElementById('edit-name').value.trim();
            if(!newName) return;
            const idx = playerController.playlist.findIndex(s => s.id === id);
            if(idx !== -1) {
                playerController.playlist[idx].name = newName;
                await playerController.persistData(playerController.playlist);
                window.ui.closeModal();
                playerController.renderList();
            }
        },

        confirmDelete: (id) => window.ui.modal(`<div class="mb-2 text-warning"><i class="ph-fill ph-warning fs-1"></i></div><h4>¿Borrar de la lista?</h4><p class="small text-muted">Paso 1/3: Confirmación inicial.</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.player.step2Delete('${id}')" class="btn btn-warning py-2 rounded-pill fw-bold text-dark">SÍ, CONTINUAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        step2Delete: (id) => window.ui.modal(`<div class="mb-2 text-danger"><i class="ph-fill ph-warning-octagon fs-1"></i></div><h4 class="text-danger">¡Atención!</h4><p class="small text-muted">Paso 2/3: Se eliminará de la base de datos local.</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.player.step3Delete('${id}')" class="btn btn-danger py-2 rounded-pill fw-bold">LO ENTIENDO</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        step3Delete: (id) => window.ui.modal(`<h4 class="fw-black">¿BORRAR DEFINITIVAMENTE?</h4><p class="small text-muted">Paso 3/3: Esta acción no tiene vuelta atrás.</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.player.finalDelete('${id}')" class="btn btn-dark py-2 rounded-pill fw-bold">SÍ, BORRAR AHORA</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        
        finalDelete: async (id) => {
            playerController.playlist = playerController.playlist.filter(s => s.id !== id);
            await playerController.persistData(playerController.playlist);
            window.ui.closeModal();
            playerController.renderList();
            window.ui.toast("Eliminado con éxito");
            
            if (playerController.currentIndex !== -1) {
                const playingId = playerController.playlist[playerController.currentIndex]?.id;
                if(playingId === id) playerController.stop();
            }
        },

        downloadSong: async (id) => {
            const song = playerController.playlist.find(s => s.id === id);
            if(!song) return;
            
            let sourceData = song.data;
            if(song.isAsset) {
                try {
                    window.ui.toast("Preparando descarga...");
                    const res = await fetch(song.data);
                    const blob = await res.blob();
                    sourceData = await new Promise(r => { 
                        const reader = new FileReader(); 
                        reader.onloadend = () => r(reader.result); 
                        reader.readAsDataURL(blob); 
                    });
                } catch(e) { return window.ui.toast("Error al leer archivo"); }
            }

            if (window.Capacitor && window.Capacitor.isNative) {
                try {
                    const b64 = sourceData.split(',')[1];
                    await window.Capacitor.Plugins.Filesystem.writeFile({
                        path: `${song.name.replace(/\s+/g, '_')}.mp3`,
                        data: b64,
                        directory: 'DOCUMENTS',
                        recursive: true
                    });
                    window.ui.toast("Guardado en Documentos");
                } catch(e) { window.ui.toast("Error al exportar"); }
            } else {
                const a = document.createElement('a'); a.href = sourceData; a.download = `${song.name}.mp3`; a.click();
            }
        },

        // --- 5. RENDERIZADO Y BUSCADOR ---
        renderList: () => {
            const container = document.getElementById('playlist-container');
            const searchInput = document.querySelector('input[placeholder="Buscar por nombre..."]');
            const term = searchInput ? searchInput.value.toLowerCase() : '';
            
            if(!container) return;

            // Siempre ordenado alfabéticamente
            playerController.sortLibrary();
            
            const filtered = playerController.playlist.filter(s => s.name.toLowerCase().includes(term));
            const countEl = document.getElementById('song-count');
            if(countEl) countEl.innerText = `${filtered.length} canciones`;

            if(filtered.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5 opacity-50">
                        <i class="ph-duotone ph-music-notes fs-1"></i>
                        <p class="mt-2">Sin canciones en la tribu</p>
                    </div>`;
                return;
            }

            container.innerHTML = filtered.map((song, index) => {
                const realIdx = playerController.playlist.findIndex(s => s.id === song.id);
                const isCurrent = playerController.currentIndex === realIdx;
                const isPlaying = isCurrent && playerController.isPlaying;
                const assetIcon = song.isAsset ? '<i class="ph-fill ph-cloud text-info small me-1"></i>' : '';

                // El contenedor ahora llama a toggleSong para permitir reproducir/pausar
                return `
                <div id="song-${realIdx}" class="song-item d-flex align-items-center justify-content-between p-3 mb-2 rounded-4 border bg-white shadow-sm transition-all ${isCurrent ? 'song-active' : ''}" 
                     onclick="if(!event.target.closest('button')) ViewControllers.player.toggleSong(${realIdx})">
                    <div class="d-flex align-items-center gap-3 overflow-hidden">
                        <div class="rounded-circle flex-center border" style="width:38px; height:38px; min-width:38px;">
                            <i class="ph-fill ${isPlaying ? 'ph-pause text-warning' : (isCurrent && !isPlaying ? 'ph-play text-warning' : 'ph-play text-muted')}"></i>
                        </div>
                        <div class="text-truncate">
                            <h6 class="mb-0 fw-bold text-dark text-truncate">${assetIcon}${song.name}</h6>
                            <small class="text-muted">Audio MP3</small>
                        </div>
                    </div>
                    <div class="d-flex gap-1">
                        <button onclick="ViewControllers.player.downloadSong('${song.id}')" class="btn btn-sm btn-light text-muted border-0"><i class="ph-bold ph-download-simple"></i></button>
                        <button onclick="ViewControllers.player.editSong('${song.id}')" class="btn btn-sm btn-light text-muted border-0"><i class="ph-bold ph-pencil-simple"></i></button>
                        <button onclick="ViewControllers.player.confirmDelete('${song.id}')" class="btn btn-sm btn-light text-danger border-0"><i class="ph-bold ph-trash"></i></button>
                    </div>
                </div>`;
            }).join('');
            
            // No llamamos a highlightCurrent aquí porque el renderList ya aplica la clase 'song-active'
        },

        filterSongs: () => playerController.renderList(),
        
        closeModule: () => { 
            playerController.stop(); 
            if(window.router) window.router.goHome(); 
        },

        formatTime: (s) => { 
            if(isNaN(s)) return "00:00"; 
            const m = Math.floor(s/60); 
            const sec = Math.floor(s%60); 
            return `${m}:${sec < 10 ? '0' + sec : sec}`; 
        }
    };

    // Registrar globalmente para el Router
    window.ViewControllers = window.ViewControllers || {};
    window.ViewControllers.player = playerController;

})();