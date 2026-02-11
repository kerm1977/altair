/**
 * player.js - Controlador de Música de La Tribu
 * Gestiona la biblioteca, reproducción persistente y reproductor flotante.
 * Optimizado para listas de más de 50 canciones y alternancia de reproducción.
 */
(function() {
    
    const STORAGE_KEY = 'app_music_library';
    const MUSIC_ASSETS_PATH = 'assets/music/'; 

    const playerController = {
        playlist: [],
        currentIndex: -1,
        audio: null,
        isPlaying: false,
        isMiniPlayerActive: false,

        // --- 1. INICIALIZACIÓN ---
        init: async () => {
            console.log("🎵 Iniciando Reproductor de La Tribu...");
            
            // Si volvemos a entrar a la vista completa, destruimos el mini reproductor flotante
            playerController.hideMiniPlayer();

            // Gestionar persistencia del elemento de audio fuera del router-outlet
            let globalAudio = document.getElementById('audio-element-persistent');
            
            if (!globalAudio) {
                // Crear audio persistente una sola vez en el body del documento
                globalAudio = document.createElement('audio');
                globalAudio.id = 'audio-element-persistent';
                globalAudio.className = 'hidden';
                document.body.appendChild(globalAudio);
            }
            
            playerController.audio = globalAudio;

            // Vincular eventos de audio persistente
            playerController.audio.ontimeupdate = playerController.updateProgress;
            playerController.audio.onended = playerController.next;
            
            playerController.audio.onloadedmetadata = () => {
                const totalTimeEl = document.getElementById('time-total');
                if(totalTimeEl) totalTimeEl.innerText = playerController.formatTime(playerController.audio.duration);
            };

            playerController.audio.onerror = (e) => {
                console.error("Error cargando pista:", playerController.audio.src);
                if(playerController.isPlaying) {
                    playerController.next(); // Saltar a la siguiente si falla
                }
            };

            // Asegurar que la DB esté lista
            if (typeof db !== 'undefined' && db.init && !db.ready) await db.init();
            
            // Sincronizar con la carpeta física y cargar lista
            await playerController.syncLibrary();
            playerController.renderList();

            // SINCRONIZACIÓN DE INTERFAZ:
            // Si ya hay una canción cargada (porque venimos del mini-player), actualizamos la vista
            if (playerController.currentIndex !== -1) {
                const song = playerController.playlist[playerController.currentIndex];
                const titleEl = document.getElementById('player-title');
                if(titleEl && song) titleEl.innerText = song.name;
                playerController.updateUIState(playerController.isPlaying);
            }
        },

        // --- 2. SINCRONIZACIÓN Y PERSISTENCIA ---
        syncLibrary: async () => {
            try {
                console.log("🔄 Sincronizando biblioteca...");
                const data = await db.find(STORAGE_KEY);
                let currentList = (data && data.list) ? data.list : [];

                try {
                    const response = await fetch(`${MUSIC_ASSETS_PATH}manifest.json?v=${Date.now()}`);
                    if (response.ok) {
                        const manifest = await response.json(); 
                        let hasNewFiles = false;

                        manifest.forEach(item => {
                            // ID basado en nombre de archivo para evitar duplicados
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
                            await playerController.persistData(currentList);
                        }
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
            try { await db.update(STORAGE_KEY, payload); } catch (e) { await db.insert(payload); }
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
            
            const titleEl = document.getElementById('player-title');
            if(titleEl) titleEl.innerText = song.name;
            
            playerController.play();

            // Si el mini-player está activo, forzamos su actualización
            if (playerController.isMiniPlayerActive) playerController.showMiniPlayer();
        },

        togglePlay: () => {
            if (playerController.playlist.length === 0) return;
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
            playerController.hideMiniPlayer();
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
            
            // 1. Actualizar Vista Principal
            const progressEl = document.getElementById('player-progress');
            if(progressEl) progressEl.style.width = `${percent}%`;
            const currentEl = document.getElementById('time-current');
            if(currentEl) currentEl.innerText = playerController.formatTime(currentTime);

            // 2. Actualizar Mini Reproductor
            const miniProgress = document.getElementById('mini-progress-bar');
            if(miniProgress) miniProgress.style.width = `${percent}%`;
        },

        updateUIState: (playing) => {
            // Actualizar botones vista principal
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
            
            // Actualizar botones mini-reproductor si está activo
            const miniBtn = document.getElementById('mini-btn-play');
            if (miniBtn) {
                miniBtn.innerHTML = playing ? '<i class="ph-fill ph-pause fs-3"></i>' : '<i class="ph-fill ph-play fs-3"></i>';
            }

            playerController.renderList();
        },

        // --- 4. REPRODUCTOR FLOTANTE (MINI-PLAYER) ---
        
        showMiniPlayer: () => {
            // Solo mostrar si hay una canción seleccionada
            if (playerController.currentIndex === -1) return;
            
            let mini = document.getElementById('mini-player-container');
            const song = playerController.playlist[playerController.currentIndex];

            if (!mini) {
                mini = document.createElement('div');
                mini.id = 'mini-player-container';
                // Estilo premium: Fondo oscuro con transparencia y Blur
                mini.className = 'fixed-bottom text-white mx-2 mb-3 rounded-4 shadow-lg fade-in';
                mini.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
                mini.style.backdropFilter = 'blur(12px)';
                mini.style.webkitBackdropFilter = 'blur(12px)';
                mini.style.zIndex = '2500';
                mini.style.bottom = 'calc(15px + var(--sab))';
                document.body.appendChild(mini);
            }

            mini.innerHTML = `
                <div class="position-relative overflow-hidden rounded-4">
                    <!-- Mini barra de progreso superior -->
                    <div class="position-absolute top-0 start-0 w-100 bg-secondary" style="height: 3px;">
                        <div id="mini-progress-bar" class="bg-warning h-100" style="width: 0%; transition: width 0.3s;"></div>
                    </div>
                    
                    <div class="d-flex align-items-center p-3">
                        <!-- Columna 1: Info (Lado Izquierdo) -->
                        <div class="d-flex align-items-center gap-3 overflow-hidden" style="flex-basis: 35%; min-width: 0;" onclick="window.router.navigate('player')">
                            <img src="logo.png" class="rounded-circle border border-warning" style="width: 38px; height: 38px; min-width: 38px;">
                            <div class="text-truncate">
                                <div class="fw-bold text-truncate" style="font-size: 0.75rem; color: white;">${song.name}</div>
                                <div class="text-warning fw-black" style="font-size: 0.55rem; letter-spacing: 0.5px;">LA TRIBU SONANDO</div>
                            </div>
                        </div>
                        
                        <!-- Columna 2: Controles (Centro) -->
                        <div class="d-flex align-items-center justify-content-center gap-3 flex-grow-1">
                            <button onclick="ViewControllers.player.prev()" class="btn btn-link text-white p-0 border-0"><i class="ph-fill ph-skip-back fs-4"></i></button>
                            <button id="mini-btn-play" onclick="ViewControllers.player.togglePlay()" class="btn btn-warning rounded-circle flex-center text-white p-0 shadow-sm" style="width: 40px; height: 40px;">
                                <i class="ph-fill ${playerController.isPlaying ? 'ph-pause' : 'ph-play'} fs-4"></i>
                            </button>
                            <button onclick="ViewControllers.player.next()" class="btn btn-link text-white p-0 border-0"><i class="ph-fill ph-skip-forward fs-4"></i></button>
                        </div>

                        <!-- Columna 3: Cerrar (Lado Derecho) -->
                        <div class="d-flex align-items-center justify-content-end" style="flex-basis: 15%;">
                            <button onclick="ViewControllers.player.stop()" class="btn btn-link text-white p-1 opacity-50 hover:opacity-100 border-0">
                                <i class="ph ph-x fs-4"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
            playerController.isMiniPlayerActive = true;
        },

        hideMiniPlayer: () => {
            const mini = document.getElementById('mini-player-container');
            if (mini) mini.remove();
            playerController.isMiniPlayerActive = false;
        },

        /**
         * prepareForBackground: Función llamada por el router al navegar fuera.
         * Mantiene el audio y activa el mini-reproductor.
         */
        prepareForBackground: () => {
            if (playerController.currentIndex !== -1) {
                playerController.showMiniPlayer();
            }
        },

        // --- 5. RENDERIZADO Y CIERRE ---
        renderList: () => {
            const container = document.getElementById('playlist-container');
            const searchInput = document.querySelector('input[placeholder="Buscar por nombre..."]');
            const term = searchInput ? searchInput.value.toLowerCase() : '';
            
            if(!container) return;

            playerController.sortLibrary();
            const filtered = playerController.playlist.filter(s => s.name.toLowerCase().includes(term));
            
            const countEl = document.getElementById('song-count');
            if(countEl) countEl.innerText = `${filtered.length} canciones`;

            if(filtered.length === 0) {
                container.innerHTML = `<div class="text-center py-5 opacity-50"><i class="ph-duotone ph-music-notes fs-1"></i><p class="mt-2">Sin canciones</p></div>`;
                return;
            }

            container.innerHTML = filtered.map((song, index) => {
                const realIdx = playerController.playlist.findIndex(s => s.id === song.id);
                const isCurrent = playerController.currentIndex === realIdx;
                const isPlaying = isCurrent && playerController.isPlaying;
                const assetIcon = song.isAsset ? '<i class="ph-fill ph-cloud text-info small me-1" title="Sincronizado"></i>' : '';

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
        },

        filterSongs: () => playerController.renderList(),
        closeModule: () => { window.router.goHome(); },
        formatTime: (s) => { if(isNaN(s)) return "00:00"; const m = Math.floor(s/60); const sec = Math.floor(s%60); return `${m}:${sec < 10 ? '0' + sec : sec}`; },

        // --- FUNCIONES CRUD (LÓGICA INTERNA) ---
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
                    <button onclick="ViewControllers.player.handleUpload()" class="btn btn-warning text-white py-3 rounded-pill fw-bold shadow">GUARDAR</button>
                    <button onclick="ui.closeModal()" class="btn btn-light py-2 rounded-pill">Cancelar</button>
                </div>
            `);
        },
        handleUpload: () => {
            const name = document.getElementById('up-name').value.trim();
            const fileInput = document.getElementById('up-file');
            if(!name || !fileInput.files[0]) return window.ui.toast("Faltan datos");
            const reader = new FileReader();
            reader.onload = async (e) => {
                const newSong = { id: 'manual_' + Date.now(), name: name, data: e.target.result, isAsset: false };
                playerController.playlist.push(newSong);
                await playerController.persistData(playerController.playlist);
                window.ui.closeModal(); playerController.renderList(); window.ui.toast("Añadida");
            };
            reader.readAsDataURL(fileInput.files[0]);
        },
        editSong: (id) => {
            const song = playerController.playlist.find(s => s.id === id);
            if(!song) return;
            window.ui.modal(`<h4 class="fw-black mb-4">Editar Nombre</h4><input type="text" id="edit-name" class="form-control mb-4" value="${song.name}"><div class="d-grid gap-2"><button onclick="ViewControllers.player.saveEdit('${id}')" class="btn btn-success text-white py-3 rounded-pill fw-bold">GUARDAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2 rounded-pill">Cancelar</button></div>`);
        },
        saveEdit: async (id) => {
            const newName = document.getElementById('edit-name').value.trim();
            if(!newName) return;
            const idx = playerController.playlist.findIndex(s => s.id === id);
            if(idx !== -1) { playerController.playlist[idx].name = newName; await playerController.persistData(playerController.playlist); window.ui.closeModal(); playerController.renderList(); }
        },
        confirmDelete: (id) => window.ui.modal(`<div class="mb-2 text-warning"><i class="ph-fill ph-warning fs-1"></i></div><h4>¿Borrar de la lista?</h4><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.player.step2Delete('${id}')" class="btn btn-warning py-2 rounded-pill fw-bold text-dark">SÍ, CONTINUAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        step2Delete: (id) => window.ui.modal(`<div class="mb-2 text-danger"><i class="ph-fill ph-warning-octagon fs-1"></i></div><h4>¡Atención!</h4><p class="small text-muted">Se eliminará el registro local.</p><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.player.step3Delete('${id}')" class="btn btn-danger py-2 rounded-pill fw-bold">ENTIENDO</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        step3Delete: (id) => window.ui.modal(`<h4 class="fw-black">¿BORRAR DEFINITIVAMENTE?</h4><div class="d-grid gap-2 mt-4"><button onclick="ViewControllers.player.finalDelete('${id}')" class="btn btn-dark py-2 rounded-pill fw-bold">SÍ, BORRAR</button><button onclick="ui.closeModal()" class="btn btn-light py-2">Cancelar</button></div>`),
        finalDelete: async (id) => {
            playerController.playlist = playerController.playlist.filter(s => s.id !== id);
            await playerController.persistData(playerController.playlist);
            window.ui.closeModal(); playerController.renderList();
            if (playerController.currentIndex !== -1) { const playingId = playerController.playlist[playerController.currentIndex]?.id; if(playingId === id) playerController.stop(); }
        },
        downloadSong: async (id) => {
            const song = playerController.playlist.find(s => s.id === id);
            if(!song) return;
            let sourceData = song.data;
            if(song.isAsset) {
                try {
                    const res = await fetch(song.data); const blob = await res.blob();
                    sourceData = await new Promise(r => { const reader = new FileReader(); reader.onloadend = () => r(reader.result); reader.readAsDataURL(blob); });
                } catch(e) { return window.ui.toast("Error al leer archivo"); }
            }
            if (window.Capacitor && window.Capacitor.isNative) {
                try { const b64 = sourceData.split(',')[1]; await window.Capacitor.Plugins.Filesystem.writeFile({ path: `${song.name.replace(/\s+/g, '_')}.mp3`, data: b64, directory: 'DOCUMENTS', recursive: true }); window.ui.toast("Guardado en Documentos"); } catch(e) { window.ui.toast("Error al exportar"); }
            } else { const a = document.createElement('a'); a.href = sourceData; a.download = `${song.name}.mp3`; a.click(); }
        }
    };

    window.ViewControllers = window.ViewControllers || {};
    window.ViewControllers.player = playerController;

})();