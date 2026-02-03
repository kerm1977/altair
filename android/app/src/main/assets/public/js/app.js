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
    
    previewImage: (input, imgId, iconId) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById(imgId);
                img.src = e.target.result;
                img.classList.remove('hidden');
                if(iconId) document.getElementById(iconId).classList.add('hidden');
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    toast: (msg) => {
        const el = document.getElementById('toast');
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
    }
};

// --- ROUTER (INYECTOR DE VISTAS) ---
const router = {
    navigate: async (viewName) => {
        const outlet = document.getElementById('router-outlet');
        const header = document.getElementById('main-header');

        try {
            // Buscamos el archivo directamente en la raíz (ej: "login.html")
            const response = await fetch(`${viewName}.html`);
            
            if (!response.ok) throw new Error(`Vista no encontrada: ${viewName}.html`);
            
            // 2. Extraer texto e inyectar
            const html = await response.text();
            outlet.innerHTML = `<div class="fade-in h-full">${html}</div>`;

            // 3. Manejar Header Global
            if (viewName === 'login' || viewName === 'register') {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
                
                // Si vamos a home o perfil, rellenar datos si es necesario
                if(viewName === 'home') app.loadHomeData();
                if(viewName === 'perfil') app.loadProfileData();
            }

        } catch (error) {
            console.error('Error cargando vista:', error);
            
            // Si estamos en file://, damos un mensaje más específico
            if (window.location.protocol === 'file:') {
                ui.toast(`Bloqueo de seguridad: No se puede cargar ${viewName}.html`);
            } else {
                ui.toast(`Error: No encuentro el archivo ${viewName}.html`);
            }
        }
    }
};

// --- LÓGICA DE NEGOCIO ---
const app = {
    user: null,

    login: (e) => {
        e.preventDefault();
        try {
            const email = document.getElementById('log-email').value;
            const pass = document.getElementById('log-pass').value;
            const user = db.find(email, pass);
            app.startSession(user);
        } catch(err) { ui.toast(err.message); }
    },

    register: (e) => {
        e.preventDefault();
        const p1 = document.getElementById('reg-pass1').value;
        const p2 = document.getElementById('reg-pass2').value;
        if(p1 !== p2) return ui.toast('Contraseñas no coinciden');

        const data = {
            nombre: document.getElementById('reg-nombre').value,
            apellido1: document.getElementById('reg-apellido1').value,
            apellido2: document.getElementById('reg-apellido2').value,
            cedula: document.getElementById('reg-cedula').value,
            nacimiento: document.getElementById('reg-nacimiento').value,
            movil: document.getElementById('reg-movil').value,
            telefono: document.getElementById('reg-telefono').value,
            email: document.getElementById('reg-email').value,
            usuario: document.getElementById('reg-usuario').value,
            password: p1,
            photo: document.getElementById('reg-preview').src || 'https://via.placeholder.com/150'
        };

        try {
            db.insert(data);
            ui.toast('Registro exitoso');
            router.navigate('login');
        } catch(err) { ui.toast(err.message); }
    },

    startSession: (user) => {
        app.user = user;
        localStorage.setItem('miApp_current', JSON.stringify(user));
        router.navigate('home');
    },

    loadHomeData: () => {
        if(!app.user) return;
        setTimeout(() => { // Pequeño delay para asegurar que el DOM cargó
            const display = document.getElementById('home-user-display');
            if(display) display.innerText = app.user.nombre;
        }, 50);
    },

    loadProfileData: () => {
        if(!app.user) return;
        setTimeout(() => {
            document.getElementById('edit-nombre').value = app.user.nombre;
            document.getElementById('edit-apellido1').value = app.user.apellido1;
            document.getElementById('edit-apellido2').value = app.user.apellido2;
            document.getElementById('edit-cedula').value = app.user.cedula;
            document.getElementById('edit-nacimiento').value = app.user.nacimiento;
            document.getElementById('edit-movil').value = app.user.movil;
            document.getElementById('edit-telefono').value = app.user.telefono;
            document.getElementById('edit-email').value = app.user.email;
            document.getElementById('edit-usuario').value = app.user.usuario;
            document.getElementById('edit-preview').src = app.user.photo;
        }, 50);
    },

    updateProfile: (e) => {
        e.preventDefault();
        const newPass = document.getElementById('edit-pass').value;
        const updates = {
            nombre: document.getElementById('edit-nombre').value,
            apellido1: document.getElementById('edit-apellido1').value,
            apellido2: document.getElementById('edit-apellido2').value,
            nacimiento: document.getElementById('edit-nacimiento').value,
            movil: document.getElementById('edit-movil').value,
            telefono: document.getElementById('edit-telefono').value,
            email: document.getElementById('edit-email').value,
            usuario: document.getElementById('edit-usuario').value,
            photo: document.getElementById('edit-preview').src
        };
        if(newPass) updates.password = newPass;

        try {
            const updated = db.update(app.user.email, updates);
            app.user = updated;
            localStorage.setItem('miApp_current', JSON.stringify(updated));
            ui.toast('Perfil guardado');
        } catch(err) { ui.toast('Error guardando'); }
    },

    deleteAccountInit: () => {
        ui.modal(`
            <div class="text-center">
                <i class="ph-fill ph-warning text-4xl text-yellow-500 mb-2"></i>
                <h3 class="font-bold text-lg">¿Estás seguro?</h3>
                <p class="text-sm text-gray-500 mb-4">Paso 1/3: Eliminar cuenta</p>
                <div class="flex gap-2">
                    <button onclick="ui.closeModal()" class="w-full py-2 rounded-lg bg-gray-100">Cancelar</button>
                    <button onclick="app.deleteAccountStep2()" class="w-full py-2 rounded-lg bg-yellow-500 text-white font-bold">Continuar</button>
                </div>
            </div>
        `);
    },
    deleteAccountStep2: () => {
        ui.modal(`
            <div class="text-center">
                <i class="ph-fill ph-warning-octagon text-4xl text-orange-500 mb-2"></i>
                <h3 class="font-bold text-lg">Confirmación</h3>
                <p class="text-sm text-gray-500 mb-4">Paso 2/3: Perderás tus datos</p>
                <div class="flex gap-2">
                    <button onclick="ui.closeModal()" class="w-full py-2 rounded-lg bg-gray-100">Cancelar</button>
                    <button onclick="app.deleteAccountStep3()" class="w-full py-2 rounded-lg bg-orange-500 text-white font-bold">Entiendo</button>
                </div>
            </div>
        `);
    },
    deleteAccountStep3: () => {
        ui.modal(`
            <div class="text-center">
                <i class="ph-fill ph-skull text-4xl text-red-600 mb-2"></i>
                <h3 class="font-bold text-lg text-red-600">Última Oportunidad</h3>
                <p class="text-sm text-gray-500 mb-4">Paso 3/3: Irreversible</p>
                <div class="flex gap-2">
                    <button onclick="ui.closeModal()" class="w-full py-2 rounded-lg bg-gray-100">Cancelar</button>
                    <button onclick="app.finalDelete()" class="w-full py-2 rounded-lg bg-red-600 text-white font-bold">ELIMINAR YA</button>
                </div>
            </div>
        `);
    },
    finalDelete: () => {
        db.remove(app.user.email);
        app.logout();
        ui.closeModal();
        ui.toast('Cuenta eliminada');
    },

    logout: () => {
        app.user = null;
        localStorage.removeItem('miApp_current');
        router.navigate('login');
    }
};

// Inicialización PWA
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const btn = document.getElementById('pwa-install-btn');
    if(btn) {
        btn.classList.remove('hidden');
        btn.onclick = () => e.prompt();
    }
});

// Arranque
window.onload = () => {
    // DIAGNÓSTICO PARA EL USUARIO: Protocolo file://
    // Esto te avisará si abriste el archivo incorrectamente
    if (window.location.protocol === 'file:') {
        ui.modal(`
            <div class="text-center p-4">
                <i class="ph-fill ph-warning-octagon text-5xl text-red-500 mb-4"></i>
                <h3 class="font-bold text-xl mb-2 text-slate-800">Modo de Vista Incorrecto</h3>
                <p class="text-gray-600 mb-4 text-sm text-left leading-relaxed">
                    Por seguridad, los navegadores bloquean la carga de vistas cuando abres el <b>index.html</b> con doble clic (Protocolo file://).
                </p>
                <div class="bg-indigo-50 p-4 rounded-xl text-left text-sm mb-4 border border-indigo-100">
                    <p class="font-bold text-indigo-700 mb-2">Cómo probar tu app:</p>
                    <ul class="list-disc pl-4 text-indigo-600 space-y-1">
                        <li>Usa la extensión <b>Live Server</b> en VS Code.</li>
                        <li>O ejecuta <b>npx http-server</b> en la terminal dentro de 'www'.</li>
                    </ul>
                </div>
                <button onclick="ui.closeModal()" class="w-full py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-200">Entendido</button>
            </div>
        `);
        return;
    }

    const saved = localStorage.getItem('miApp_current');
    if(saved) {
        app.user = JSON.parse(saved);
        router.navigate('home');
    } else {
        router.navigate('login');
    }
};