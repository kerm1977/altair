// ============================================================================
// ⚠️ FRAGMENTO 4: CONTROLADORES DE USUARIO (A FUTURO SERÁ: js/userController.js)
// ⚠️ SIRVE PARA: Manejar las acciones específicas de edición de perfiles, 
//                guardado de cambios y renderizado de la tabla de administración.
// ============================================================================
async function abrirEditorUsuario(email) {
    const user = await sqliteService.getUsuarioByEmail(email);
    if (user) {
        window.usuarioEnEdicion = user;
        window.cargarVista('editar_usuario', 'Editar Información');
    } else {
        window.mostrarNotificacion("Error: Usuario no encontrado", "danger");
    }
}

async function editarMiPerfil() {
    const usuarioActivo = await sqliteService.getSession();
    if (usuarioActivo) {
        window.abrirEditorUsuario(usuarioActivo.email);
    }
}

async function cancelarEdicion() {
    const usuarioActivo = await sqliteService.getSession();
    if (usuarioActivo && (usuarioActivo.rol === 'superusuario' || usuarioActivo.rol === 'admin') && window.usuarioEnEdicion && window.usuarioEnEdicion.email !== usuarioActivo.email) {
        window.cargarVista('admin_usuarios', 'Usuarios');
    } else {
        window.cargarVista('perfil', 'Mi Perfil');
    }
}

async function guardarEdicionUsuario() {
    const user = window.usuarioEnEdicion;
    if (!user) return;

    const emailViejo = user.email;
    const txtNombre = document.getElementById('edit-nombre').value;
    const txtEmail = document.getElementById('edit-email').value;
    const txtTelefono = document.getElementById('edit-telefono').value;
    const txtPassword = document.getElementById('edit-password').value;

    const selRol = document.getElementById('edit-rol');
    const selEstado = document.getElementById('edit-estado');
    
    const rolActualizado = selRol ? selRol.value : user.rol;
    const estadoActualizado = selEstado ? selEstado.value : user.estado;

    // --- CAPTURAR NUEVOS CAMPOS (ID y Fecha de Nacimiento) ---
    const inIdNacional = document.getElementById('edit-id-nacional');
    const inDia = document.getElementById('edit-dia');
    const inMes = document.getElementById('edit-mes');
    const inAnio = document.getElementById('edit-anio');

    // Construir la fecha en formato YYYY-MM-DD
    let fechaNacimientoStr = user.fecha_nacimiento || '';
    if (inDia && inMes && inAnio && inDia.value && inMes.value && inAnio.value) {
        fechaNacimientoStr = `${inAnio.value}-${inMes.value.padStart(2, '0')}-${inDia.value.padStart(2, '0')}`;
    }

    const btn = document.getElementById('btn-save-edit');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>GUARDANDO...';
    }

    // Si la contraseña cambió, la encriptamos antes de guardar
    let passwordA_Guardar = txtPassword;
    if(txtPassword !== user.password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(txtPassword);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        passwordA_Guardar = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Objeto con todos los datos actualizados
    const nuevosDatos = {
        nombre: txtNombre,
        email: txtEmail,
        telefono: txtTelefono,
        password: passwordA_Guardar,
        rol: rolActualizado,
        estado: estadoActualizado,
        id_nacional: inIdNacional ? inIdNacional.value : user.id_nacional,
        fecha_nacimiento: fechaNacimientoStr,
        foto_perfil: user.foto_perfil
    };

    const exito = await sqliteService.actualizarUsuario(emailViejo, nuevosDatos);
    
    if (exito) {
        window.mostrarNotificacion("Información actualizada correctamente", "success");
        
        const usuarioActivo = await sqliteService.getSession();
        if (usuarioActivo && usuarioActivo.email === emailViejo) {
            nuevosDatos.foto_perfil = usuarioActivo.foto_perfil;
            await sqliteService.setSession(nuevosDatos); 
        }

        setTimeout(async () => {
            window.cancelarEdicion();
        }, 300);
    } else {
        window.mostrarNotificacion("Error: Verifica que el correo no esté usado por otro", "danger");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> GUARDAR CAMBIOS';
        }
    }
}

function renderizarUsuarios(usuarios, tbody) {
    if (!tbody) return;

    if(usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No hay usuarios registrados</td></tr>';
        return;
    }

    let htmlBuffer = '';
    
    usuarios.forEach(u => {
        const displayNombre = u.nombre || u.email.split('@')[0];
        const iniciales = displayNombre.substring(0,2).toUpperCase();
        const estadoClase = u.estado === 'activo' ? 'success' : 'secondary';
        const estadoTexto = u.estado ? u.estado.charAt(0).toUpperCase() + u.estado.slice(1) : 'Activo';
        
        let avatarContent = `<div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2 shadow-sm" style="width:36px; height:36px; font-size:12px; font-weight:bold;">${iniciales}</div>`;
        if (u.foto_perfil) {
            avatarContent = `<div class="me-2 shadow-sm rounded-circle overflow-hidden border border-1 border-primary" style="width:36px; height:36px; flex-shrink:0;">
                                <img src="${u.foto_perfil}" style="width:100%; height:100%; object-fit:cover;">
                             </div>`;
        }

        htmlBuffer += `
            <tr>
                <td class="ps-3">
                    <div class="d-flex align-items-center">
                        ${avatarContent}
                        <div>
                            <div class="fw-bold text-dark" style="font-size: 0.9rem;">${displayNombre}</div>
                            <div class="text-muted" style="font-size: 0.75rem;">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td class="text-center"><span class="badge bg-${estadoClase} bg-opacity-10 text-${estadoClase} border border-${estadoClase} border-opacity-25 rounded-pill">${estadoTexto}</span></td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-light text-primary shadow-sm" onclick="window.abrirEditorUsuario('${u.email}')"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `;
    });
    
    requestAnimationFrame(() => {
        tbody.innerHTML = htmlBuffer;
    });
}

// Exportar las funciones al entorno global para que HTML las reconozca
window.abrirEditorUsuario = abrirEditorUsuario;
window.editarMiPerfil = editarMiPerfil;
window.cancelarEdicion = cancelarEdicion;
window.guardarEdicionUsuario = guardarEdicionUsuario;
window.renderizarUsuarios = renderizarUsuarios;