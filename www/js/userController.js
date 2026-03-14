// ============================================================================
// ⚠️ FRAGMENTO 4: CONTROLADORES DE USUARIO (js/userController.js)
// ⚠️ SIRVE PARA: Manejar las acciones específicas de edición de perfiles, 
//                guardado de cambios con validación de contraseña y nombres.
// ============================================================================

/**
 * Busca un usuario por email y carga la vista de edición.
 */
async function abrirEditorUsuario(email) {
    const user = await sqliteService.getUsuarioByEmail(email);
    if (user) {
        window.usuarioEnEdicion = user;
        window.cargarVista('editar_usuario', 'Editar Información');
    } else {
        window.mostrarNotificacion("Error: Usuario no encontrado", "danger");
    }
}

/**
 * Inicia el proceso de edición del perfil del usuario logueado actualmente.
 */
async function editarMiPerfil() {
    const usuarioActivo = await sqliteService.getSession();
    if (usuarioActivo) {
        window.abrirEditorUsuario(usuarioActivo.email);
    }
}

/**
 * Cancela la edición y devuelve al usuario a la vista correcta según su rol.
 */
async function cancelarEdicion() {
    const usuarioActivo = await sqliteService.getSession();
    // Si es admin y editaba a otro, vuelve a la lista. Si no, vuelve a su perfil.
    if (usuarioActivo && (usuarioActivo.rol === 'superusuario' || usuarioActivo.rol === 'admin') && window.usuarioEnEdicion && window.usuarioEnEdicion.email !== usuarioActivo.email) {
        window.cargarVista('admin_usuarios', 'Usuarios');
    } else {
        window.cargarVista('perfil', 'Mi Perfil');
    }
}

/**
 * Lógica principal para guardar los cambios de un usuario.
 * Procesa nombres desglosados y el cambio de contraseña seguro.
 */
async function guardarEdicionUsuario() {
    const user = window.usuarioEnEdicion;
    if (!user) return;

    const emailViejo = user.email;
    
    // --- CAPTURAR PARTES DEL NOMBRE ---
    const inNombre = document.getElementById('edit-nombre');
    const inApellido1 = document.getElementById('edit-apellido1');
    const inApellido2 = document.getElementById('edit-apellido2');
    
    const txtNombre = inNombre ? inNombre.value.trim() : '';
    const txtApellido1 = inApellido1 ? inApellido1.value.trim() : '';
    const txtApellido2 = inApellido2 ? inApellido2.value.trim() : '';

    // Recomponer el nombre completo para la base de datos
    let nombreCompleto = txtNombre;
    if (txtApellido1) nombreCompleto += ' ' + txtApellido1;
    if (txtApellido2) nombreCompleto += ' ' + txtApellido2;

    const txtEmail = document.getElementById('edit-email').value;
    const txtTelefono = document.getElementById('edit-telefono').value;

    // --- CAPTURAR CAMPOS DE SEGURIDAD (CONTRASEÑAS) ---
    const inCurrentPass = document.getElementById('edit-current-password');
    const inNewPass = document.getElementById('edit-new-password');
    const inVerifyPass = document.getElementById('edit-verify-password');
    
    const txtCurrentPass = inCurrentPass ? inCurrentPass.value : '';
    const txtNewPass = inNewPass ? inNewPass.value : '';
    const txtVerifyPass = inVerifyPass ? inVerifyPass.value : '';

    // --- CAPTURAR OTROS CAMPOS ---
    const inIdNacional = document.getElementById('edit-id-nacional');
    const inDia = document.getElementById('edit-dia');
    const inMes = document.getElementById('edit-mes');
    const inAnio = document.getElementById('edit-anio');

    const selRol = document.getElementById('edit-rol');
    const selEstado = document.getElementById('edit-estado');
    
    const rolActualizado = selRol ? selRol.value : user.rol;
    const estadoActualizado = selEstado ? selEstado.value : user.estado;

    // Construir la fecha de nacimiento (YYYY-MM-DD)
    let fechaNacimientoStr = user.fecha_nacimiento || '';
    if (inDia && inMes && inAnio && inDia.value && inMes.value && inAnio.value) {
        fechaNacimientoStr = `${inAnio.value}-${inMes.value.padStart(2, '0')}-${inDia.value.padStart(2, '0')}`;
    }

    const btn = document.getElementById('btn-save-edit');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>GUARDANDO...';
    }

    // Por defecto, mantenemos la contraseña actual (el hash que ya existe)
    let passwordA_Guardar = user.password; 

    // --- LÓGICA DE CAMBIO DE CONTRASEÑA ---
    if (txtNewPass !== '') {
        // 1. Validar que la nueva contraseña coincida con su verificación
        if (txtNewPass !== txtVerifyPass) {
            window.mostrarNotificacion("Las nuevas contraseñas no coinciden.", "danger");
            restaurarBotonGuardar(btn);
            return;
        }

        // 2. Verificar si es necesario validar la contraseña actual
        // (Un administrador editando a OTRO usuario no necesita saber la contraseña actual)
        const usuarioActivo = await sqliteService.getSession();
        const esMismoUsuario = (usuarioActivo && usuarioActivo.email === user.email);

        if (esMismoUsuario) {
            // Validar contraseña actual contra el hash almacenado
            const encoder = new TextEncoder();
            const dataCurrent = encoder.encode(txtCurrentPass);
            const hashBufferCurrent = await crypto.subtle.digest('SHA-256', dataCurrent);
            const hashArrayCurrent = Array.from(new Uint8Array(hashBufferCurrent));
            const currentPassHashed = hashArrayCurrent.map(b => b.toString(16).padStart(2, '0')).join('');

            if (currentPassHashed !== user.password) {
                window.mostrarNotificacion("La contraseña actual es incorrecta.", "danger");
                restaurarBotonGuardar(btn);
                return;
            }
        }

        // 3. Todo correcto: Cifrar la nueva contraseña
        const encoderNew = new TextEncoder();
        const dataNew = encoderNew.encode(txtNewPass);
        const hashBufferNew = await crypto.subtle.digest('SHA-256', dataNew);
        const hashArrayNew = Array.from(new Uint8Array(hashBufferNew));
        passwordA_Guardar = hashArrayNew.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Objeto con la información consolidada
    const nuevosDatos = {
        nombre: nombreCompleto,
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
            // Actualizar la sesión si el usuario editado es el mismo que está logueado
            nuevosDatos.foto_perfil = usuarioActivo.foto_perfil;
            nuevosDatos.tema = usuarioActivo.tema; 
            await sqliteService.setSession(nuevosDatos); 
        }

        setTimeout(async () => {
            window.cancelarEdicion();
        }, 300);
    } else {
        window.mostrarNotificacion("Error: El correo electrónico ya está en uso.", "danger");
        restaurarBotonGuardar(btn);
    }
}

/**
 * Restaura el botón de guardado a su estado original.
 */
function restaurarBotonGuardar(btn) {
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> GUARDAR CAMBIOS';
    }
}

/**
 * Genera el HTML para la lista de administración de usuarios.
 */
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
        const estadoTexto = u.estado === 'activo' ? 'Activo' : 'Inactivo';
        
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

// Exportar las funciones al entorno global
window.abrirEditorUsuario = abrirEditorUsuario;
window.editarMiPerfil = editarMiPerfil;
window.cancelarEdicion = cancelarEdicion;
window.guardarEdicionUsuario = guardarEdicionUsuario;
window.renderizarUsuarios = renderizarUsuarios;