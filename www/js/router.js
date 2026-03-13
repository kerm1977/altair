// ============================================================================
// ⚠️ FRAGMENTO 3: ENRUTAMIENTO Y VISTAS (A FUTURO SERÁ: js/router.js)
// ⚠️ SIRVE PARA: Cambiar entre pantallas (`<template>`), inyectar HTML en el DOM,
//                manejar la barra de navegación y poblar los datos de cada vista.
// ============================================================================
function cargarVista(vistaId, titulo) {
    const root = document.getElementById('app-root');
    const header = document.getElementById('app-header');
    const bottomNav = document.getElementById('app-bottom-nav');
    const titleEl = document.getElementById('view-title');

    if(!root || root.dataset.vistaActual === vistaId) return;
    root.dataset.vistaActual = vistaId;
    
    root.style.display = 'none';
    root.classList.remove('fade-in');
    
    const template = document.getElementById('tpl-' + vistaId);
    
    if (template) {
        requestAnimationFrame(() => {
            root.innerHTML = '';
            root.appendChild(template.content.cloneNode(true));
            
            root.style.display = 'block';
            root.classList.add('fade-in');
            
            if (titleEl && titulo) titleEl.innerText = titulo;

            const esAuth = vistaId === 'login' || vistaId === 'registro';
            
            if (esAuth) {
                header.classList.add('d-none');
                bottomNav.classList.add('d-none');
                bottomNav.classList.remove('d-flex');
            } else {
                header.classList.remove('d-none');
                bottomNav.classList.remove('d-none');
                bottomNav.classList.add('d-flex');
                
                document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
                    btn.classList.remove('active', 'text-primary');
                    btn.classList.add('text-secondary');
                });
                
                const activeBtn = document.getElementById('nav-' + vistaId); 
                if(activeBtn) {
                    activeBtn.classList.add('active', 'text-primary');
                    activeBtn.classList.remove('text-secondary');
                } else if (vistaId === 'editar_usuario') {
                    const adminBtn = document.getElementById('nav-admin_usuarios');
                    if (adminBtn) {
                        adminBtn.classList.add('active', 'text-primary');
                        adminBtn.classList.remove('text-secondary');
                    }
                }
            }

            ejecutarLogicaVista(vistaId);
        });
    }
}

async function ejecutarLogicaVista(vistaId) {
    const usuarioActivo = await sqliteService.getSession();

    // Lógicas de UI de Admin
    const navAdminUsuarios = document.getElementById('nav-admin_usuarios');
    if (navAdminUsuarios) {
        if (usuarioActivo && (usuarioActivo.rol === 'superusuario' || usuarioActivo.rol === 'admin')) {
            navAdminUsuarios.classList.remove('d-none');
        } else {
            navAdminUsuarios.classList.add('d-none');
        }
    }

    if (vistaId === 'inicio' && usuarioActivo) {
        const displayNombre = usuarioActivo.nombre || usuarioActivo.email.split('@')[0];
        const el = document.getElementById('inicio-nombre');
        if (el) el.innerText = `Hola, ${displayNombre}`;

        const tarjetaAdminUsuarios = document.querySelector('button[onclick*="admin_usuarios"]');
        if (tarjetaAdminUsuarios) {
            if (usuarioActivo.rol === 'superusuario' || usuarioActivo.rol === 'admin') {
                tarjetaAdminUsuarios.classList.remove('d-none');
            } else {
                tarjetaAdminUsuarios.classList.add('d-none');
            }
        }
    }
    
    if (vistaId === 'perfil' && usuarioActivo) {
        const elEmail = document.getElementById('perfil-email');
        const elRol = document.getElementById('perfil-rol');
        const elNombre = document.getElementById('perfil-nombre');
        const elAvatar = document.getElementById('perfil-avatar');
        const elTelefono = document.getElementById('perfil-telefono');
        
        const displayNombre = usuarioActivo.nombre || usuarioActivo.email.split('@')[0];
        if (elNombre) elNombre.innerText = displayNombre;
        if (elEmail) elEmail.innerText = usuarioActivo.email;
        if (elTelefono) elTelefono.innerText = usuarioActivo.telefono || 'No especificado';
        if (elRol) elRol.innerText = usuarioActivo.rol ? usuarioActivo.rol.toUpperCase() : 'USUARIO';
        
        if (elAvatar) {
            if (usuarioActivo.foto_perfil) {
                elAvatar.innerHTML = `<img src="${usuarioActivo.foto_perfil}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                elAvatar.innerHTML = displayNombre.charAt(0).toUpperCase();
            }
        }
    }

    if (vistaId === 'admin_usuarios') {
        const tbody = document.getElementById('lista-usuarios-admin');
        const searchInput = document.getElementById('buscador-usuarios'); 

        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2"></div>Consultando...</td></tr>';
            try {
                const usuarios = await sqliteService.getUsuarios();
                window.renderizarUsuarios(usuarios, tbody);

                if (searchInput) {
                    searchInput.addEventListener('input', async (e) => {
                        const termino = e.target.value.trim();
                        if (window.SearchManager) {
                            window.SearchManager.buscar(termino, tbody);
                        } else {
                            const res = await sqliteService.buscarUsuarios(termino);
                            window.renderizarUsuarios(res, tbody);
                        }
                    });
                }
            } catch(e) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error al consultar DB local</td></tr>';
            }
        }
    }

    if (vistaId === 'editar_usuario') {
        const userEdit = window.usuarioEnEdicion;
        
        if (userEdit) {
            const elEmailDisplay = document.getElementById('edit-email-display');
            const inNombre = document.getElementById('edit-nombre');
            const inEmail = document.getElementById('edit-email');
            const inTelefono = document.getElementById('edit-telefono');
            const inPassword = document.getElementById('edit-password');
            const selRol = document.getElementById('edit-rol');
            const selEstado = document.getElementById('edit-estado');
            const boxPrivilegios = document.getElementById('box-privilegios');

            if (elEmailDisplay) elEmailDisplay.innerText = userEdit.email;
            if (inNombre) inNombre.value = userEdit.nombre || '';
            if (inEmail) inEmail.value = userEdit.email || '';
            if (inTelefono) inTelefono.value = userEdit.telefono || '';
            if (inPassword) inPassword.value = userEdit.password || '';
            
            if (usuarioActivo.rol === 'usuario' && boxPrivilegios) {
                boxPrivilegios.classList.add('d-none');
            } else if (selRol && selEstado) {
                selRol.value = userEdit.rol || 'usuario';
                selEstado.value = userEdit.estado || 'activo';
            }
        }
    }
}

// --- EXPORTAR AL ENTORNO GLOBAL ---
window.cargarVista = cargarVista;
window.ejecutarLogicaVista = ejecutarLogicaVista;