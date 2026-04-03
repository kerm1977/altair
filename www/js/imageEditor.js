// ============================================================================
// ARCHIVO: js/imageEditor.js
// DESCRIPCIÓN: UI y lógica para subir, arrastrar, hacer zoom y recortar 
// en círculo la foto de perfil. Adaptado para PocketBase.
// ============================================================================

const ImageEditorManager = {
    img: new Image(),
    scale: 1, 
    offsetX: 0, 
    offsetY: 0,
    isDragging: false, 
    startX: 0, 
    startY: 0,
    canvas: null, 
    ctx: null,
    targetImgId: '', 

    abrirSelectorImagen: function(targetId) {
        console.log("[ImageEditor] Abriendo selector para:", targetId);
        const self = this;
        self.targetImgId = targetId;
        
        let input = document.getElementById('cropper-global-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'cropper-global-input';
            input.accept = 'image/png, image/jpeg, image/jpg, image/webp';
            input.style.display = 'none';
            document.body.appendChild(input);
            
            input.addEventListener('change', function(e) {
                self.procesarArchivo(e);
            });
        }
        input.value = ''; // Limpiar para permitir seleccionar la misma foto
        input.click();
    },

    procesarArchivo: function(e) {
        const self = this;
        const file = e.target.files[0];
        if (!file) return;
        
        console.log("[ImageEditor] Archivo seleccionado:", file.name);
        
        if (!file.type.startsWith('image/')) {
            alert("Por favor, selecciona una imagen válida.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            self.img.onload = function() {
                console.log("[ImageEditor] Imagen cargada en memoria. Abriendo modal...");
                self.abrirModalCropper();
            };
            self.img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    },

    abrirModalCropper: function() {
        const self = this;
        self.scale = 1;
        self.offsetX = 0;
        self.offsetY = 0;
        
        let modal = document.getElementById('modal-cropper');
        if (!modal) {
            const modalHTML = `
                <div id="modal-cropper" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:10000; flex-direction:column; align-items:center; justify-content:center;">
                    <div class="glass-panel p-4 d-flex flex-column align-items-center rounded-4 border-secondary border-opacity-25" style="width: 90%; max-width: 400px; background: rgba(30,30,30,0.7); box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
                        <h5 class="text-white mb-3 fw-bold"><i class="bi bi-crop me-2"></i>Ajusta tu foto</h5>
                        
                        <!-- Contenedor del Lienzo -->
                        <div style="position:relative; width:280px; height:280px; background:#111; border-radius:50%; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.8); cursor:move;">
                            <canvas id="cropper-canvas" width="280" height="280" style="touch-action:none;"></canvas>
                        </div>
                        
                        <!-- Control de Zoom -->
                        <div class="mt-4 w-100 px-3">
                            <label class="text-white small mb-2 d-flex justify-content-between text-muted-themed">
                                <i class="bi bi-zoom-out fs-5"></i>
                                <span class="fw-bold">Zoom</span>
                                <i class="bi bi-zoom-in fs-5"></i>
                            </label>
                            <input type="range" class="form-range" id="cropper-zoom" min="10" max="300" value="100">
                        </div>
                        
                        <p class="text-muted-themed small mt-2 mb-0 text-center"><i class="bi bi-arrows-move me-1"></i> Desliza para encuadrar la imagen</p>
                        
                        <!-- Botones -->
                        <div class="d-flex mt-4 gap-3 w-100">
                            <button class="btn btn-outline-secondary flex-fill rounded-pill py-2 fw-bold" onclick="window.ImageEditorManager.cerrarModal()">Cancelar</button>
                            <button class="btn btn-primary flex-fill rounded-pill fw-bold py-2 shadow" id="btn-modal-guardar-foto" onclick="window.ImageEditorManager.guardarImagen()">
                                <i class="bi bi-check2-circle me-1"></i> Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById('modal-cropper');
        }

        modal.style.display = 'flex';
        
        self.canvas = document.getElementById('cropper-canvas');
        self.ctx = self.canvas.getContext('2d');
        
        self.configurarEventos();
        self.dibujar();
    },

    configurarEventos: function() {
        const self = this;
        const zoomSlider = document.getElementById('cropper-zoom');
        if(zoomSlider) {
            zoomSlider.value = 100;
            zoomSlider.oninput = function(e) {
                self.scale = e.target.value / 100;
                self.dibujar();
            };
        }

        // Eventos Mouse (Escritorio)
        self.canvas.onmousedown = function(e) { self.iniciarArrastre(e.clientX, e.clientY); };
        self.canvas.onmousemove = function(e) { self.arrastrar(e.clientX, e.clientY); };
        window.addEventListener('mouseup', function() { self.detenerArrastre(); });
        
        // Eventos Táctiles (Móviles)
        self.canvas.ontouchstart = function(e) { e.preventDefault(); self.iniciarArrastre(e.touches[0].clientX, e.touches[0].clientY); };
        self.canvas.ontouchmove = function(e) { e.preventDefault(); self.arrastrar(e.touches[0].clientX, e.touches[0].clientY); };
        window.addEventListener('touchend', function() { self.detenerArrastre(); });
    },

    iniciarArrastre: function(clientX, clientY) {
        this.isDragging = true;
        this.startX = clientX - this.offsetX;
        this.startY = clientY - this.offsetY;
    },

    arrastrar: function(clientX, clientY) {
        if (!this.isDragging) return;
        this.offsetX = clientX - this.startX;
        this.offsetY = clientY - this.startY;
        this.dibujar(); 
    },

    detenerArrastre: function() {
        this.isDragging = false;
    },

    dibujar: function() {
        const self = this;
        if(!self.ctx) return;
        const w = self.canvas.width;
        const h = self.canvas.height;
        
        self.ctx.clearRect(0, 0, w, h);
        
        const cx = w / 2; 
        const cy = h / 2; 
        
        self.ctx.save();
        self.ctx.translate(cx + self.offsetX, cy + self.offsetY);
        self.ctx.scale(self.scale, self.scale);
        
        const iw = self.img.width;
        const ih = self.img.height;
        
        const baseScale = Math.max(w / iw, h / ih);
        self.ctx.scale(baseScale, baseScale);
        
        self.ctx.drawImage(self.img, -iw/2, -ih/2, iw, ih);
        self.ctx.restore();
        
        // Máscara oscura para lo que queda fuera
        self.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        self.ctx.beginPath();
        self.ctx.rect(0, 0, w, h);
        self.ctx.arc(cx, cy, 140, 0, Math.PI*2, true); 
        self.ctx.fill();
    },

    cerrarModal: function() {
        const modalEl = document.getElementById('modal-cropper');
        if(modalEl) modalEl.style.display = 'none';
    },

    guardarImagen: function() {
        const self = this;
        const btn = document.getElementById('btn-modal-guardar-foto');
        if(btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>...';
        }

        try {
            const outCanvas = document.createElement('canvas');
            const size = 400; // Resolución final alta calidad
            outCanvas.width = size;
            outCanvas.height = size;
            const outCtx = outCanvas.getContext('2d');
            
            outCtx.fillStyle = '#ffffff';
            outCtx.fillRect(0, 0, size, size);

            outCtx.beginPath();
            outCtx.arc(size/2, size/2, size/2, 0, Math.PI*2);
            outCtx.clip();
            
            const w = self.canvas.width;
            const h = self.canvas.height;
            const radius = 140; 
            
            const exportScale = size / (radius * 2);

            outCtx.save();
            outCtx.translate(size/2, size/2); 
            outCtx.scale(exportScale, exportScale); 

            outCtx.translate(self.offsetX, self.offsetY);
            outCtx.scale(self.scale, self.scale);

            const iw = self.img.width;
            const ih = self.img.height;
            const baseScale = Math.max(w / iw, h / ih);
            outCtx.scale(baseScale, baseScale);

            outCtx.drawImage(self.img, -iw/2, -ih/2, iw, ih);
            outCtx.restore();
            
            const base64Img = outCanvas.toDataURL('image/jpeg', 0.85); 
            
            // Convertir Base64 a File para PocketBase
            const arr = base64Img.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            const croppedFile = new File([u8arr], "avatar_tribu_vip.jpg", {type:mime});

            window.archivoAvatarTemp = croppedFile;

            // Actualizamos visualmente el círculo en la interfaz
            if (self.targetImgId) {
                const targetImg = document.getElementById(self.targetImgId);
                if (targetImg) targetImg.src = base64Img;
            }

            self.cerrarModal();
            
        } catch (err) {
            console.error("[ImageEditor] Error al procesar imagen:", err);
            alert("Hubo un error procesando la imagen. Intenta con otra.");
        } finally {
            if(btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Aplicar';
            }
        }
    }
};

window.ImageEditorManager = ImageEditorManager;