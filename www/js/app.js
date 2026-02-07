// --- CONFIGURACIÓN UI ---
const ui = {
    togglePass: (id, icon) => {
        const input = document.getElementById(id);
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        icon.classList.toggle('ph-eye');
        icon.classList.toggle('ph-eye-slash');
        icon.classList.toggle('text-indigo-600');
    },

    toast: (msg) => {
        const el = document.getElementById('toast');
        if(!el) return;
        el.innerText = msg;
        el.classList.remove('opacity-0', '-translate-y-10');
        setTimeout(() => el.classList.add('opacity-0', '-translate-y-10'), 3000);
    },

    modal: (html) => {
        document.getElementById('modal-content').innerHTML = html;
        document.getElementById('modal-overlay').classList.remove('hidden');
    },

    closeModal: () => {
        document.getElementById('modal-overlay').classList.add('hidden');
    },

    // --- BOTÓN DE REFRESCAR GLOBAL ---
    updateRefreshButton: (show) => {
        let btn = document.getElementById('global-refresh-btn');
        
        if (show) {
            // Si no existe, lo creamos dinámicamente
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'global-refresh-btn';
                // Estilos de Botón Flotante (FAB) en la esquina inferior derecha
                btn.className = 'fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:bg-slate-800 transition-all active:scale-95 border-2 border-white/20';
                btn.innerHTML = '<i class="ph-bold ph-arrows-clockwise text-2xl animate-pulse-slow"></i>';
                btn.onclick = () => {
                    ui.toast("Recargando sistema...");
                    setTimeout(() => window.location.reload(), 300);
                };
                document.body.appendChild(btn);
            }
            btn.classList.remove('hidden');
        } else {
            if (btn) btn.classList.add('hidden');
        }
    },

    // --- EDITOR: PRECARGA HÍBRIDA (OPTIMIZACIÓN + SEGURIDAD) ---
    // Solución definitiva para que la imagen siempre cargue rápido
    openImageEditor: (input, targetImgId) => {
        if (input.files && input.files[0]) {
            ui.toast("Procesando imagen...");
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const tempImg = new Image();
                
                tempImg.onload = () => {
                    try {
                        // 1. Redimensionar PREVIO a un tamaño seguro
                        const MAX_SIZE = 600;
                        let w = tempImg.width;
                        let h = tempImg.height;

                        if (w > h) {
                            if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
                        } else {
                            if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
                        }

                        w = Math.floor(w);
                        h = Math.floor(h);

                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillRect(0, 0, w, h);
                        ctx.drawImage(tempImg, 0, 0, w, h);

                        imageEditor.currentImage = canvas.toDataURL('image/jpeg', 0.9);
                    } catch (err) {
                        console.error("Fallo optimización", err);
                        imageEditor.currentImage = e.target.result;
                    }

                    imageEditor.targetId = targetImgId;
                    imageEditor.showInterface();
                    input.value = ''; 
                };

                tempImg.onerror = () => {
                    ui.toast("La imagen está dañada");
                    imageEditor.currentImage = e.target.result;
                    imageEditor.targetId = targetImgId;
                    imageEditor.showInterface();
                };

                tempImg.src = e.target.result;
            };
            
            reader.onerror = () => ui.toast("Error leyendo archivo");
            reader.readAsDataURL(input.files[0]);
        }
    }
};






