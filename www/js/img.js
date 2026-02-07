// --- EDITOR DE IMÁGENES (SALIDA 400PX) ---
const imageEditor = {
    currentImage: null,
    targetId: null,
    sliderValue: 1,
    baseScale: 1,
    posX: 0,
    posY: 0,
    viewSize: 300,   // Tamaño visual en pantalla
    outputSize: 400, // Tamaño real guardado en DB

    showInterface: () => {
        ui.modal(`
            <div class="text-center w-full max-w-sm">
                <h3 class="font-bold text-lg mb-4 text-slate-800">Ajustar Foto</h3>
                
                <!-- Contenedor de visualización (300px) -->
                <div class="relative w-[300px] h-[300px] mx-auto bg-slate-900 rounded-full overflow-hidden border-4 border-indigo-500 shadow-xl mb-6 select-none">
                    <img id="editor-img" class="absolute origin-center select-none pointer-events-none opacity-0 transition-opacity duration-300" 
                         style="left: 50%; top: 50%; transform: translate(-50%, -50%); max-width: none; max-height: none;">
                    
                    <div id="editor-loader" class="absolute inset-0 flex items-center justify-center text-white bg-slate-900 z-10">
                        <i class="ph ph-spinner animate-spin text-2xl"></i>
                    </div>
                </div>

                <div class="space-y-4 px-4">
                    <div>
                        <label class="text-xs font-bold text-slate-500 uppercase flex justify-between"><span>Zoom</span> <span id="lbl-scale">100%</span></label>
                        <input type="range" min="0.5" max="3" step="0.1" value="1" oninput="imageEditor.updatePreview(this.value, 'scale')" class="w-full accent-indigo-600">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-slate-500 uppercase">Posición</label>
                        <div class="flex gap-2">
                            <input type="range" min="-200" max="200" step="1" value="0" oninput="imageEditor.updatePreview(this.value, 'x')" class="w-full accent-indigo-600">
                            <input type="range" min="-200" max="200" step="1" value="0" oninput="imageEditor.updatePreview(this.value, 'y')" class="w-full accent-indigo-600">
                        </div>
                    </div>
                </div>

                <div class="flex gap-2 mt-8">
                    <button onclick="ui.closeModal()" class="w-full py-2 rounded-lg bg-gray-100 font-medium hover:bg-gray-200 transition">Cancelar</button>
                    <button onclick="imageEditor.save()" class="w-full py-2 rounded-lg bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition">Confirmar</button>
                </div>
            </div>
        `);

        setTimeout(() => {
            const img = document.getElementById('editor-img');
            if (!img) return;

            img.onload = () => {
                const loader = document.getElementById('editor-loader');
                if(loader) loader.classList.add('hidden');
                img.classList.remove('opacity-0');

                // Calcular ajuste automático para cubrir el círculo de 300px
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;
                const scaleW = imageEditor.viewSize / w;
                const scaleH = imageEditor.viewSize / h;
                
                // Math.max asegura "Cover" (sin bordes negros)
                imageEditor.baseScale = Math.max(scaleW, scaleH);
                
                // Evitar errores con imágenes corruptas o muy pequeñas
                if (!isFinite(imageEditor.baseScale) || imageEditor.baseScale === 0) imageEditor.baseScale = 1;

                imageEditor.sliderValue = 1;
                imageEditor.posX = 0;
                imageEditor.posY = 0;
                imageEditor.updateVisuals();
            };
            img.src = imageEditor.currentImage;
        }, 100);
    },

    updatePreview: (val, type) => {
        if (type === 'scale') imageEditor.sliderValue = parseFloat(val);
        if (type === 'x') imageEditor.posX = parseInt(val);
        if (type === 'y') imageEditor.posY = parseInt(val);
        imageEditor.updateVisuals();
    },

    updateVisuals: () => {
        const img = document.getElementById('editor-img');
        const lbl = document.getElementById('lbl-scale');
        const finalScale = imageEditor.baseScale * imageEditor.sliderValue;
        
        if (lbl) lbl.innerText = Math.round(imageEditor.sliderValue * 100) + '%';
        if (img) img.style.transform = `translate(calc(-50% + ${imageEditor.posX}px), calc(-50% + ${imageEditor.posY}px)) scale(${finalScale})`;
    },

    save: () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Salida exacta 400x400
            canvas.width = imageEditor.outputSize;
            canvas.height = imageEditor.outputSize;
            
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            
            // Factor de conversión (400 / 300 = 1.333)
            const ratio = imageEditor.outputSize / imageEditor.viewSize;
            
            // Ajustamos escala y posición por el ratio para que coincida con la salida
            const finalScale = imageEditor.baseScale * imageEditor.sliderValue * ratio;
            const finalX = imageEditor.posX * ratio;
            const finalY = imageEditor.posY * ratio;

            ctx.save();
            ctx.translate(cx + finalX, cy + finalY);
            ctx.scale(finalScale, finalScale);
            // Dibujamos usando dimensiones naturales
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
            ctx.restore();

            const finalData = canvas.toDataURL('image/jpeg', 0.85);
            
            const targetEl = document.getElementById(imageEditor.targetId);
            if(targetEl) {
                targetEl.src = finalData;
                targetEl.classList.remove('hidden');
            }

            if (imageEditor.targetId === 'reg-preview') {
                const iconEl = document.getElementById('reg-icon');
                if (iconEl) iconEl.classList.add('hidden');
            }
            
            if (imageEditor.targetId === 'edit-preview') {
                const ph = document.getElementById('edit-placeholder');
                if (ph) ph.classList.add('hidden');
            }

            ui.closeModal();
        };
        img.src = imageEditor.currentImage;
    }
};