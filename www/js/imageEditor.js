// ============================================================================
// ⚠️ FRAGMENTO 5: EDITOR DE IMÁGENES (js/imageEditor.js)
// ⚠️ SIRVE PARA: Proveer la UI y lógica para subir, arrastrar, recortar
//                en círculo y convertir a Base64 la foto de perfil.
// ============================================================================
const ImageEditorManager = {
    // Variables de estado del editor
    img: new Image(),
    scale: 1, // Nivel de zoom
    offsetX: 0, // Desplazamiento X de la imagen
    offsetY: 0, // Desplazamiento Y de la imagen
    isDragging: false, // Indica si el usuario está arrastrando la imagen
    startX: 0, // Posición inicial X del toque/clic
    startY: 0, // Posición inicial Y del toque/clic
    canvas: null, // Referencia al elemento <canvas> HTML
    ctx: null, // Contexto 2D para dibujar en el canvas

    // Abre el diálogo del sistema operativo para seleccionar una imagen
    abrirSelectorImagen: function() {
        let input = document.getElementById('input-foto-perfil');
        // Si el input oculto no existe, lo creamos dinámicamente
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'input-foto-perfil';
            input.accept = 'image/png, image/jpeg, image/jpg'; // Solo imágenes
            input.style.display = 'none';
            document.body.appendChild(input);
            // Escuchamos cuando el usuario seleccione un archivo
            input.addEventListener('change', (e) => this.procesarArchivo(e));
        }
        input.click(); // Forzamos el clic
    },

    // Lee el archivo seleccionado y lo carga en la variable img
    procesarArchivo: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            window.mostrarNotificacion("Por favor, selecciona una imagen válida.", "danger");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            // Cuando la imagen termine de cargar en memoria, abrimos el modal
            this.img.onload = () => {
                this.abrirModalCropper();
            };
            this.img.src = event.target.result; // Asignamos los datos Base64 a la imagen
        };
        reader.readAsDataURL(file); // Leemos el archivo
        e.target.value = ''; // Limpiamos el input para poder seleccionar la misma foto después si se desea
    },

    // Crea (si no existe) y muestra la interfaz de recorte sobre la pantalla
    abrirModalCropper: function() {
        // Reiniciamos los valores por defecto cada vez que abrimos el modal
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // Inyectar el modal de forma autónoma si no existe en el HTML
        if (!document.getElementById('modal-cropper')) {
            const modalHTML = `
                <div id="modal-cropper" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; flex-direction:column; align-items:center; justify-content:center;">
                    <h5 class="text-white mb-3 fw-bold">Ajusta tu foto</h5>
                    <div style="position:relative; width:300px; height:300px; background:#111; border-radius:15px; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.8);">
                        <!-- Lienzo interactivo donde se pinta la imagen -->
                        <canvas id="cropper-canvas" width="300" height="300" style="cursor:move; touch-action:none;"></canvas>
                    </div>
                    <div class="mt-4 w-100 px-4" style="max-width:350px;">
                        <label class="text-white small mb-2 d-block text-center"><i class="bi bi-zoom-in me-2"></i>Tamaño</label>
                        <!-- Control deslizante para hacer zoom -->
                        <input type="range" class="form-range" id="cropper-zoom" min="10" max="300" value="100">
                    </div>
                    <div class="d-flex mt-4 gap-3 w-100 px-4" style="max-width:350px;">
                        <!-- Botones de acción -->
                        <button class="btn btn-outline-light flex-fill rounded-pill py-2" onclick="window.ImageEditorManager.cerrarModal()">Cancelar</button>
                        <button class="btn btn-primary flex-fill rounded-pill fw-bold py-2" id="btn-modal-guardar-foto" onclick="window.ImageEditorManager.guardarImagen()">Guardar Foto</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Mostramos el modal
        document.getElementById('modal-cropper').style.display = 'flex';
        
        // Configuramos el canvas
        this.canvas = document.getElementById('cropper-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Activamos los eventos de ratón/táctiles y dibujamos la imagen por primera vez
        this.configurarEventos();
        this.dibujar();
    },

    // Enlaza las interacciones del usuario con la lógica
    configurarEventos: function() {
        const zoomSlider = document.getElementById('cropper-zoom');
        if(zoomSlider) {
            zoomSlider.value = 100;
            // Escuchamos los cambios en el control deslizante para redibujar con el nuevo zoom
            zoomSlider.oninput = (e) => {
                this.scale = e.target.value / 100;
                this.dibujar();
            };
        }

        // Eventos para Mouse (Escritorio / Web)
        this.canvas.onmousedown = (e) => this.iniciarArrastre(e.clientX, e.clientY);
        this.canvas.onmousemove = (e) => this.arrastrar(e.clientX, e.clientY);
        window.onmouseup = () => this.detenerArrastre();
        
        // Eventos Táctiles (Móviles nativos)
        this.canvas.ontouchstart = (e) => { e.preventDefault(); this.iniciarArrastre(e.touches[0].clientX, e.touches[0].clientY); };
        this.canvas.ontouchmove = (e) => { e.preventDefault(); this.arrastrar(e.touches[0].clientX, e.touches[0].clientY); };
        window.ontouchend = () => this.detenerArrastre();
    },

    // Registra dónde el usuario hizo clic o tocó inicialmente
    iniciarArrastre: function(clientX, clientY) {
        this.isDragging = true;
        // Calculamos la posición relativa al desplazamiento actual
        this.startX = clientX - this.offsetX;
        this.startY = clientY - this.offsetY;
    },

    // Actualiza la posición de la imagen mientras el dedo se mueve
    arrastrar: function(clientX, clientY) {
        if (!this.isDragging) return;
        // Calculamos el nuevo desplazamiento basándonos en la posición inicial
        this.offsetX = clientX - this.startX;
        this.offsetY = clientY - this.startY;
        this.dibujar(); // Redibujamos constantemente para crear el efecto de movimiento
    },

    // Indica que se soltó la pantalla
    detenerArrastre: function() {
        this.isDragging = false;
    },

    // Motor de renderizado: Pinta la imagen y la máscara circular
    dibujar: function() {
        if(!this.ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 1. Limpiamos el lienzo completamente
        this.ctx.clearRect(0, 0, w, h);
        
        const cx = w / 2; // Centro X
        const cy = h / 2; // Centro Y
        
        this.ctx.save();
        // Movemos el punto de origen al centro y aplicamos los desplazamientos del usuario
        this.ctx.translate(cx + this.offsetX, cy + this.offsetY);
        // Aplicamos el zoom del usuario
        this.ctx.scale(this.scale, this.scale);
        
        const iw = this.img.width;
        const ih = this.img.height;
        
        // Calculamos la escala base para que la imagen quepa inicialmente en el cuadro
        const baseScale = Math.max(w / iw, h / ih);
        this.ctx.scale(baseScale, baseScale);
        
        // 2. Dibujamos la imagen centrada respecto a las nuevas coordenadas
        this.ctx.drawImage(this.img, -iw/2, -ih/2, iw, ih);
        this.ctx.restore();
        
        // 3. Dibujar máscara oscura semi-transparente que simula el recorte fuera del círculo
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.beginPath();
        this.ctx.rect(0, 0, w, h);
        this.ctx.arc(cx, cy, 140, 0, Math.PI*2, true); 
        this.ctx.fill();

        // 4. Aro indicador brillante (línea guía del recorte)
        this.ctx.strokeStyle = '#0d6efd';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 140, 0, Math.PI*2);
        this.ctx.stroke();
    },

    // Oculta la interfaz
    cerrarModal: function() {
        const modalEl = document.getElementById('modal-cropper');
        if(modalEl) modalEl.style.display = 'none';
    },

    // Extrae el círculo visible, lo comprime y lo guarda en SQLite
    guardarImagen: async function() {
        const btn = document.getElementById('btn-modal-guardar-foto');
        if(btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>...';
        }

        // Crear un canvas secundario INVISIBLE para procesar el recorte limpio
        const outCanvas = document.createElement('canvas');
        const size = 400; // Resolución final de la foto de perfil (400x400 px)
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext('2d');
        
        // Fondo blanco (necesario para el formato JPEG)
        outCtx.fillStyle = '#ffffff';
        outCtx.fillRect(0, 0, size, size);

        // Hacer un clip (recorte) circular nativo
        outCtx.beginPath();
        outCtx.arc(size/2, size/2, size/2, 0, Math.PI*2);
        outCtx.clip();
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        const radius = 140; // El radio interno de la zona visible definido en dibujar()
        
        // 🛠️ MEJORA: Replicamos las transformaciones exactamente en lugar de capturar la pantalla.
        // Esto evita que las líneas azules de la interfaz se guarden en la foto final.
        const exportScale = size / (radius * 2);

        outCtx.save();
        outCtx.translate(size/2, size/2); // Mover al centro del lienzo de salida
        outCtx.scale(exportScale, exportScale); // Escalar al tamaño final

        // Aplicar los mismos desplazamientos del usuario
        outCtx.translate(this.offsetX, this.offsetY);
        outCtx.scale(this.scale, this.scale);

        const iw = this.img.width;
        const ih = this.img.height;
        const baseScale = Math.max(w / iw, h / ih);
        outCtx.scale(baseScale, baseScale);

        outCtx.drawImage(this.img, -iw/2, -ih/2, iw, ih);
        outCtx.restore();
        
        // Exportar a JPEG comprimido (80% calidad) para optimizar la base de datos
        const base64Img = outCanvas.toDataURL('image/jpeg', 0.80); 
        
        try {
            const usuarioActivo = await sqliteService.getSession();
            if (usuarioActivo) {
                // Guardado en Base de Datos
                if (!sqliteService.isWeb && sqliteService.db) {
                    await sqliteService.db.run(
                        "UPDATE usuarios SET foto_perfil = ? WHERE email = ?",
                        [base64Img, usuarioActivo.email]
                    );
                } else {
                    let users = JSON.parse(localStorage.getItem("mock_db_usuarios") || "[]");
                    let index = users.findIndex(u => u.email === usuarioActivo.email);
                    if (index !== -1) {
                        users[index].foto_perfil = base64Img;
                        localStorage.setItem("mock_db_usuarios", JSON.stringify(users));
                    }
                }
                
                // Actualizar la sesión actual con la nueva foto
                usuarioActivo.foto_perfil = base64Img;
                await sqliteService.setSession(usuarioActivo);
                
                window.mostrarNotificacion("Foto de perfil actualizada", "success");
                this.cerrarModal();
                
                if(btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Guardar Foto';
                }
                
                // ====================================================================
                // 🛠️ FIX MAGIA VISUAL: Reflejo instantáneo en el DOM
                // ====================================================================
                const avataresVisibles = document.querySelectorAll('.img-avatar-dinamico, #nav-profile-img, #perfil-avatar img');
                avataresVisibles.forEach(imgEl => {
                    imgEl.src = base64Img;
                });
                
                // Reconstruir el contenedor por si era un círculo con iniciales
                const contenedorAvatar = document.getElementById('perfil-avatar');
                if (contenedorAvatar) {
                    contenedorAvatar.innerHTML = `<img src="${base64Img}" class="img-avatar-dinamico shadow-sm" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                }

                // Recargar la vista actual silenciosamente
                const root = document.getElementById('app-root');
                if (root && root.dataset.vistaActual) {
                    const titleEl = document.getElementById('view-title');
                    window.cargarVista(root.dataset.vistaActual, titleEl ? titleEl.innerText : 'Perfil');
                }
            }
        } catch (error) {
            console.error("[ImageEditor] Error guardando la foto:", error);
            window.mostrarNotificacion("Error al guardar la foto en la base de datos.", "danger");
            if(btn) {
                btn.disabled = false;
                btn.innerHTML = 'Guardar Foto';
            }
        }
    }
};

// --- EXPORTAR AL ENTORNO GLOBAL ---
window.ImageEditorManager = ImageEditorManager;