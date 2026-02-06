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

// --- VALIDADORES ---
const validators = {
    nameInput: (e) => {
        let val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        if (val.length > 0) val = val.charAt(0).toUpperCase() + val.slice(1);
        e.target.value = val;
    },
    numberInput: (e) => { 
        e.target.value = e.target.value.replace(/\D/g, ''); 
    },
    userInput: (e) => { 
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); 
    },
    isValidPhone: (str) => /^\d{8}$/.test(str)
};

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

// --- LÓGICA DE NEGOCIO ---
const app = {
    user: null,
    selectedTech: 'web',
    showRefresh: localStorage.getItem('miApp_showRefresh') === 'true', // Estado del botón refresh

    // AQUÍ CONECTAMOS BIOMETRIC.JS COMO HIJO
    // Si biometricLogic existe (se cargó el script), lo mezclamos en app
    ...(typeof biometricLogic !== 'undefined' ? biometricLogic : {}),

    // --- HERRAMIENTAS DE DESARROLLADOR ---
    setupDevTools: () => {
        let clicks = 0;
        const header = document.getElementById('main-header');
        if (header) {
            header.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                
                clicks++;
                
                if (clicks === 1) {
                    setTimeout(() => clicks = 0, 800);
                }
                
                if (clicks === 3) {
                    ui.toast("⚡ Recargando App...");
                    setTimeout(() => window.location.reload(), 300);
                    clicks = 0;
                }
            });
        }
    },

    // --- DASHBOARD LOGIC ---
    loadDashboardData: () => {
        const currentTech = localStorage.getItem('miApp_tech') || 'web';
        app.selectTech(currentTech);
        
        // Cargar estado del switch de Refresh
        const toggle = document.getElementById('refresh-toggle');
        if(toggle) toggle.checked = app.showRefresh;
    },

    selectTech: (techName) => {
        if(techName === 'cloud') return ui.toast('Próximamente');
        app.selectedTech = techName;
        document.querySelectorAll('.tech-card').forEach(el => el.classList.remove('active'));
        const card = document.getElementById(`card-${techName}`);
        if(card) card.classList.add('active');
    },

    saveTechSettings: () => {
        localStorage.setItem('miApp_tech', app.selectedTech);
        ui.toast(`Tecnología cambiada a: ${app.selectedTech.toUpperCase()}`);
        setTimeout(() => {
            router.navigate('home');
            window.location.reload();
        }, 1000);
    },

    // Trigger para el botón de refrescar
    toggleRefreshBtn: (e) => {
        app.showRefresh = e.target.checked;
        localStorage.setItem('miApp_showRefresh', app.showRefresh);
        ui.updateRefreshButton(app.showRefresh);
        ui.toast(app.showRefresh ? "Botón Activado" : "Botón Oculto");
    },

    // --- VISIBILIDAD BIOMETRÍA (Simulación Web Activada) ---
    updateBiometricUI: () => {
        const btn = document.getElementById('btn-biometric');
        if (!btn) return;
        
        // AHORA buscamos credenciales biométricas ESPECÍFICAS, no el "Recordarme"
        const bioCreds = localStorage.getItem('miApp_bio_creds');
        const isEnabled = localStorage.getItem('miApp_bio_enabled') === 'true';
        
        // MOSTRAR solo si el usuario activó biometría explícitamente y hay credenciales ocultas
        if (bioCreds && isEnabled) {
            btn.classList.remove('hidden');
            btn.classList.add('flex');
        } else {
            btn.classList.add('hidden');
            btn.classList.remove('flex');
        }
    },

    // --- AUTH ---
    login: async (e) => {
        e.preventDefault();
        try {
            // FIX: Limpieza de email
            const email = document.getElementById('log-email').value.trim().toLowerCase();
            const pass = document.getElementById('log-pass').value;
            const remember = document.getElementById('log-remember')?.checked;

            const user = await db.find(email, pass);
            if (user) {
                // 1. "RECORDARME" AHORA ES SOLO VISUAL (Rellenar inputs)
                if (remember) {
                    localStorage.setItem('miApp_remember', JSON.stringify({ email, pass }));
                } else {
                    localStorage.removeItem('miApp_remember');
                }

                // 2. Si la biometría está activa, actualizamos sus credenciales ocultas INDEPENDIENTES
                if (localStorage.getItem('miApp_bio_enabled') === 'true') {
                     localStorage.setItem('miApp_bio_creds', JSON.stringify({ email, pass }));
                }

                app.startSession(user);
            } else {
                ui.toast("Credenciales incorrectas");
            }
        } catch(err) { ui.toast("Error: " + err.message); }
    },

    // Función para rellenar datos si existen (Solo visual)
    checkRemembered: () => {
        const saved = localStorage.getItem('miApp_remember');
        if (saved) {
            try {
                const { email, pass } = JSON.parse(saved);
                setTimeout(() => {
                    const emailInput = document.getElementById('log-email');
                    const passInput = document.getElementById('log-pass');
                    const rememberInput = document.getElementById('log-remember');
                    
                    if (emailInput && passInput) {
                        emailInput.value = email;
                        passInput.value = pass;
                        if(rememberInput) rememberInput.checked = true;
                    }
                }, 150);
            } catch (e) { localStorage.removeItem('miApp_remember'); }
        }
    },

    register: async (e) => {
        e.preventDefault();
        const p1 = document.getElementById('reg-pass1').value;
        const p2 = document.getElementById('reg-pass2').value;
        const movil = document.getElementById('reg-movil')?.value;
        const telefono = document.getElementById('reg-telefono')?.value;

        if(p1 !== p2) return ui.toast('Contraseñas no coinciden');
        if(movil && !validators.isValidPhone(movil)) return ui.toast('Móvil debe tener 8 dígitos');
        if(telefono && !validators.isValidPhone(telefono)) return ui.toast('Teléfono debe tener 8 dígitos');

        const data = {
            nombre: document.getElementById('reg-nombre')?.value || '',
            apellido1: document.getElementById('reg-apellido1')?.value || '',
            apellido2: document.getElementById('reg-apellido2')?.value || '',
            cedula: document.getElementById('reg-cedula')?.value || '',
            nacimiento: document.getElementById('reg-nacimiento')?.value || '',
            movil: movil || '',
            telefono: telefono || '',
            // FIX: Normalizar email al registrar
            email: document.getElementById('reg-email').value.trim().toLowerCase(),
            usuario: document.getElementById('reg-usuario').value,
            password: p1,
            photo: document.getElementById('reg-preview')?.src || 'https://via.placeholder.com/150'
        };

        try {
            await db.insert(data);
            ui.toast('Registro exitoso');
            router.navigate('login');
        } catch(err) { ui.toast(err.message); }
    },

    startSession: (user) => {
        app.user = user;
        localStorage.setItem('miApp_current', JSON.stringify(user));
        router.navigate('home');
    },

    // --- CARGA DE DATOS ---
    loadHomeData: () => {
        if(!app.user) return;
        setTimeout(() => {
            const display = document.getElementById('home-user-display');
            if(display) display.innerText = app.user.usuario || app.user.nombre || "Usuario";
            
            const statusDiv = document.querySelector('.w-2.h-2.rounded-full');
            const statusText = document.querySelector('span.text-xs.font-medium');
            
            if (statusDiv && statusText) {
                const dbStatus = db.getStatus ? db.getStatus() : { type: 'web' };
                
                let color = 'bg-orange-400';
                let label = 'Web Storage';

                if (dbStatus.type === 'sqlite') {
                    color = 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.6)]';
                    label = 'SQLite Nativo';
                } else if (dbStatus.type === 'indexeddb') {
                    color = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
                    label = 'IndexedDB';
                }

                statusDiv.className = `w-2 h-2 rounded-full ${color}`;
                statusText.innerText = `DB: ${label}`;
            }
        }, 100);
    },

    // --- PERFIL Y BIOMETRÍA ---
    initProfileView: async () => {
        if(!app.user) return;
        
        // Rellenar datos
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
        setVal('edit-usuario', app.user.usuario);
        setVal('edit-email', app.user.email);
        if(app.user.photo && !app.user.photo.includes('placeholder')) {
            document.getElementById('edit-img-preview').src = app.user.photo;
        }

        // Mostrar sección de biometría SIEMPRE (para que puedas configurarlo en web)
        const bioContainer = document.getElementById('bio-settings-container');
        const bioToggle = document.getElementById('bio-toggle');

        if (bioContainer) {
            bioContainer.classList.remove('hidden'); // Forzar visualización
            const isEnabled = localStorage.getItem('miApp_bio_enabled') === 'true';
            if(bioToggle) bioToggle.checked = isEnabled;
        }
    },
    
    // Simulación del Toggle para Web (Lógica separada)
    toggleBiometry: async (checkbox) => {
        const enable = checkbox.checked;
        if(enable) {
             // 1. Guardar flag de habilitado
             localStorage.setItem('miApp_bio_enabled', 'true');
             
             // 2. Guardar credenciales en Llavero SEPARADO (miApp_bio_creds)
             // Esto hace que funcione incluso si el usuario NO marcó "Recordarme"
             if(app.user) {
                 localStorage.setItem('miApp_bio_creds', JSON.stringify({
                     email: app.user.email,
                     pass: app.user.password
                 }));
             }
             ui.toast("Biometría activada (Simulada)");
        } else {
             // Limpieza total de lo biométrico
             localStorage.removeItem('miApp_bio_enabled');
             localStorage.removeItem('miApp_bio_creds');
             ui.toast("Biometría desactivada");
        }
    },

    loadProfileData: () => {
        app.initProfileView();
        
        if(!app.user) return;
        setTimeout(() => {
            const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
            setVal('edit-nombre', app.user.nombre);
            setVal('edit-apellido1', app.user.apellido1);
            setVal('edit-apellido2', app.user.apellido2);
            setVal('edit-cedula', app.user.cedula);
            setVal('edit-nacimiento', app.user.nacimiento);
            setVal('edit-movil', app.user.movil);
            setVal('edit-telefono', app.user.telefono);
        }, 50);
    },

    updateProfile: async (e) => {
        e.preventDefault();
        const passOld = document.getElementById('edit-pass-old').value;
        const passNew = document.getElementById('edit-pass-new').value;
        const passConfirm = document.getElementById('edit-pass-confirm').value;
        const movil = document.getElementById('edit-movil').value;
        const telefono = document.getElementById('edit-telefono').value;

        if(movil && !validators.isValidPhone(movil)) return ui.toast('Móvil incorrecto');
        if(telefono && !validators.isValidPhone(telefono)) return ui.toast('Teléfono incorrecto');

        const updates = {
            nombre: document.getElementById('edit-nombre')?.value,
            apellido1: document.getElementById('edit-apellido1')?.value,
            apellido2: document.getElementById('edit-apellido2')?.value,
            nacimiento: document.getElementById('edit-nacimiento')?.value,
            movil: movil,
            telefono: telefono,
            email: document.getElementById('edit-email')?.value,
            usuario: document.getElementById('edit-usuario')?.value,
            photo: document.getElementById('edit-preview')?.src || document.getElementById('edit-img-preview')?.src
        };

        if (passOld || passNew || passConfirm) {
            if (!passOld || !passNew || !passConfirm) return ui.toast('Faltan campos de contraseña');
            if (passOld !== app.user.password) return ui.toast('Contraseña actual incorrecta');
            if (passNew !== passConfirm) return ui.toast('Nuevas no coinciden');
            updates.password = passNew;
        }

        try {
            const updated = await db.update(app.user.email, updates);
            app.user = updated;
            localStorage.setItem('miApp_current', JSON.stringify(updated));
            
            // Si cambia la contraseña, actualizar credenciales biométricas (si estaban activas)
            if (passNew && localStorage.getItem('miApp_bio_enabled') === 'true') {
                localStorage.setItem('miApp_bio_creds', JSON.stringify({
                    email: app.user.email, 
                    pass: app.user.password 
                }));
            }

            ui.toast('Perfil actualizado');
            document.getElementById('edit-pass-old').value = '';
            document.getElementById('edit-pass-new').value = '';
            document.getElementById('edit-pass-confirm').value = '';
        } catch(err) { 
            console.error(err);
            ui.toast('Error al actualizar'); 
        }
    },

    deleteAccountInit: () => {
        ui.modal(`
            <div class="text-center">
                <h3 class="font-bold text-lg mb-4">¿Eliminar Cuenta?</h3>
                <p class="text-sm text-gray-500 mb-4">Esta acción es irreversible.</p>
                <div class="flex gap-2">
                    <button onclick="ui.closeModal()" class="w-full py-2 rounded-lg bg-gray-100">Cancelar</button>
                    <button onclick="app.finalDelete()" class="w-full py-2 rounded-lg bg-red-600 text-white font-bold">Eliminar</button>
                </div>
            </div>
        `);
    },

    finalDelete: async () => {
        try {
            await db.remove(app.user.email);
            app.logout();
            ui.closeModal();
            ui.toast('Cuenta eliminada');
        } catch(e) { ui.toast("Error al eliminar"); }
    },

    logout: () => {
        app.user = null;
        localStorage.removeItem('miApp_current');
        router.navigate('login');
    },

    // --- LOGIN BIOMETRICO (Bridge) ---
    loginBiometry: () => {
        // En entorno real llamaría al plugin, aquí simulamos lectura del storage biométrico
        const savedBio = localStorage.getItem('miApp_bio_creds');
        if (!savedBio) {
            return ui.toast("Error: Datos biométricos corruptos o no encontrados.");
        }

        try {
            const { email, pass } = JSON.parse(savedBio);
            // Simulación de validación exitosa de huella
            ui.toast("Huella reconocida...");
            
            // Login real contra la DB usando las credenciales ocultas
            db.find(email, pass).then(user => {
                if(user) app.startSession(user);
                else ui.toast("Credenciales expiradas");
            });
        } catch (e) {
            ui.toast("Error de autenticación");
        }
    },
    
    checkBiometryAvailability: async () => {
        return biometricLogic ? await biometricLogic.checkBiometryAvailability() : false;
    }
};

const router = {
    navigate: async (viewName) => {
        const outlet = document.getElementById('router-outlet');
        const header = document.getElementById('main-header');
        
        try {
            // --- ESTRATEGIA: Carga directa desde la raíz ---
            // Los archivos HTML están en la misma carpeta que index.html (www/)
            let response = await fetch(`${viewName}.html`);

            if (!response.ok) throw new Error(`Archivo no encontrado: ${viewName}.html`);

            const html = await response.text();
            outlet.innerHTML = `<div class="fade-in h-full">${html}</div>`;
            
            // Lógica Post-Navegación
            ui.updateRefreshButton(app.showRefresh);

            if (viewName === 'login' || viewName === 'register') {
                header.classList.add('hidden');
                if(viewName === 'login') {
                    app.checkRemembered(); // Solo rellena inputs si "Recordarme" estaba activo
                    if (app.updateBiometricUI) app.updateBiometricUI(); // Botón aparece si biometría estaba activa
                }
            } else {
                header.classList.remove('hidden');
                if(viewName === 'home') app.loadHomeData();
                if(viewName === 'perfil') app.loadProfileData();
                if(viewName === 'dashboard') app.loadDashboardData();
            }

        } catch (error) {
            console.error(error);
            // PANTALLA DE ERROR (Elimina el Spinner de la muerte)
            outlet.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                    <div class="text-red-400 text-5xl mb-4"><i class="ph-bold ph-warning-octagon"></i></div>
                    <h2 class="text-xl font-bold text-slate-800 mb-2">Error de Carga</h2>
                    <p class="text-slate-500 mb-6 text-sm">No se pudo encontrar el archivo <b>${viewName}.html</b>.</p>
                    <p class="text-xs bg-slate-100 p-3 rounded-lg text-slate-500 border border-slate-200 mb-6">
                        Verifica que el archivo esté en la raíz de la carpeta <code>/www/</code>
                    </p>
                    <button onclick="location.reload()" class="btn-primary bg-indigo-600 shadow-indigo-200">
                        <i class="ph-bold ph-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
            if(window.location.protocol === 'file:') ui.toast("Error: Usa Live Server");
        }
    }
};

// EXPOSICIÓN GLOBAL
window.app = app;
window.ui = ui;
window.validators = validators;
window.router = router;

// Arranque
window.onload = async () => {
    try {
        // 1. Inicializar DB (Si existe)
        if(typeof db !== 'undefined' && db.init) {
            const dbTimeout = new Promise((_, reject) => setTimeout(() => reject("DB Timeout"), 1000));
            await Promise.race([db.init(), dbTimeout]).catch(err => {
                console.warn("Advertencia: DB lenta o fallo", err);
            });
        }
        
        // 2. Configurar herramientas
        if (app.setupDevTools) app.setupDevTools();
        if (ui.updateRefreshButton) ui.updateRefreshButton(app.showRefresh);

        // 3. Enrutamiento Inicial
        const saved = localStorage.getItem('miApp_current');
        if(saved) {
            try {
                app.user = JSON.parse(saved);
                router.navigate('home');
            } catch (e) {
                localStorage.removeItem('miApp_current');
                router.navigate('login');
            }
        } else {
            router.navigate('login');
        }

    } catch (e) {
        console.error("Error fatal en arranque:", e);
        const outlet = document.getElementById('router-outlet');
        if(outlet) outlet.innerHTML = '<div class="p-8 text-center"><h2 class="text-red-500 font-bold">Error Crítico</h2><p>Revisa la consola.</p></div>';
    }
};