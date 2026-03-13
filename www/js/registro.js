// =========================================================
// REGISTRO.JS - CONTROLADOR DE VALIDACIÓN Y SEGURIDAD
// =========================================================

const RegistroManager = {
    init: function() {
        // Escuchar eventos en el contenedor principal ya que las vistas son dinámicas
        document.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('change', this.handleChange.bind(this));
    },

    // ---------------------------------------------------------
    // 1. MANEJO DE EVENTOS EN TIEMPO REAL
    // ---------------------------------------------------------
    handleInput: function(e) {
        const id = e.target.id;

        if (id === 'reg-nombre') this.validarNombre(e.target);
        if (id === 'reg-apellido1') this.validarApellido(e.target, 1);
        if (id === 'reg-apellido2') this.validarApellido(e.target, 2);
        if (id === 'reg-telefono') this.validarTelefono(e.target);
    },

    handleChange: function(e) {
        const id = e.target.id;
        if (id === 'reg-dia' || id === 'reg-mes' || id === 'reg-anio') {
            this.calcularEdad();
        }
    },

    // ---------------------------------------------------------
    // 2. REGLAS DE VALIDACIÓN ESTRICTA
    // ---------------------------------------------------------
    
    // Nombres: Sin números/especiales, máx 1 espacio, Capitalizado
    validarNombre: function(input) {
        let val = input.value;
        // Eliminar caracteres no permitidos (solo letras y espacios)
        val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        
        // Controlar máximo 1 espacio
        const partes = val.split(' ');
        if (partes.length > 2) {
            val = partes[0] + ' ' + partes[1];
        }

        // Capitalizar: Primera letra de cada palabra
        input.value = val.split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');

        this.mostrarError(input, 'err-nombre', input.value !== val || input.value.trim() === '');
    },

    // Apellidos: Sin números/especiales, SIN ESPACIOS, Capitalizado
    validarApellido: function(input, num) {
        let val = input.value;
        // Eliminar todo excepto letras (Ni siquiera espacios permitidos)
        val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
        
        // Capitalizar
        if (val.length > 0) {
            input.value = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        } else {
            input.value = '';
        }

        if (num === 1) {
            this.mostrarError(input, 'err-apellido1', input.value.trim() === '');
        }
    },

    // Teléfono: Solo números, sin espacios
    validarTelefono: function(input) {
        let val = input.value;
        val = val.replace(/[^0-9]/g, ''); // Limpiar todo lo que no sea número
        input.value = val;
        this.mostrarError(input, 'err-telefono', val.length < 8); // Suponiendo min 8 digitos
    },

    // Helper visual para mostrar errores de bootstrap
    mostrarError: function(input, errId, hasError) {
        const errLabel = document.getElementById(errId);
        if (hasError && input.value.length > 0) {
            input.classList.add('is-invalid');
            if (errLabel) errLabel.style.display = 'block';
        } else {
            input.classList.remove('is-invalid');
            if (errLabel) errLabel.style.display = 'none';
        }
    },

    // ---------------------------------------------------------
    // 3. CÁLCULO DE EDAD DINÁMICO
    // ---------------------------------------------------------
    calcularEdad: function() {
        const dia = document.getElementById('reg-dia')?.value;
        const mes = document.getElementById('reg-mes')?.value;
        const anio = document.getElementById('reg-anio')?.value;
        const errLabel = document.getElementById('err-fecha');
        const badgeEdad = document.getElementById('badge-edad');

        if (!dia || !mes || !anio || anio.length < 4) {
            badgeEdad.classList.add('d-none');
            return;
        }

        // Crear objeto fecha y validar si existe realmente (ej: 30 Feb no existe)
        const fechaNac = new Date(`${anio}-${mes}-${dia}T00:00:00`);
        const fechaValida = fechaNac.getFullYear() == anio && (fechaNac.getMonth() + 1) == mes && fechaNac.getDate() == dia;

        if (!fechaValida || fechaNac > new Date()) {
            errLabel.classList.remove('d-none');
            badgeEdad.classList.add('d-none');
            return;
        }

        errLabel.classList.add('d-none');

        // Calcular edad real
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mesDiff = hoy.getMonth() - fechaNac.getMonth();
        
        if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }

        // Mostrar Badge
        badgeEdad.innerText = `${edad} años`;
        badgeEdad.classList.remove('d-none');
        badgeEdad.className = `badge rounded-pill px-3 ${edad >= 18 ? 'bg-success' : 'bg-warning text-dark'}`;
    },

    // ---------------------------------------------------------
    // 4. INTERACCIÓN VISUAL (OJO DE CONTRASEÑA)
    // ---------------------------------------------------------
    togglePasswordVisibility: function(inputId, iconContainer) {
        const input = document.getElementById(inputId);
        const icon = iconContainer.querySelector('i');
        
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        } else {
            input.type = "password";
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        }
    },

    // ---------------------------------------------------------
    // 5. SEGURIDAD: HASHEO CRIPTOGRÁFICO NATIVO (Web Crypto API)
    // ---------------------------------------------------------
    hashPassword: async function(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    // ---------------------------------------------------------
    // 6. PROCESAMIENTO FINAL DEL FORMULARIO
    // ---------------------------------------------------------
    procesarRegistro: async function() {
        const btnSubmit = document.getElementById('btn-reg-submit');
        const errorDiv = document.getElementById('reg-error');
        
        const inNombre = document.getElementById('reg-nombre').value.trim();
        const inApe1 = document.getElementById('reg-apellido1').value.trim();
        const inApe2 = document.getElementById('reg-apellido2').value.trim();
        const inTelefono = document.getElementById('reg-telefono').value.trim();
        const inEmail = document.getElementById('reg-email').value.trim();
        const inId = document.getElementById('reg-id')?.value.trim() || "";
        
        // Fecha para formato completo
        const inDia = document.getElementById('reg-dia').value;
        const inMes = document.getElementById('reg-mes').value;
        const inAnio = document.getElementById('reg-anio').value;

        const pass = document.getElementById('reg-pass').value;
        const passVerify = document.getElementById('reg-pass-verify').value;

        errorDiv.classList.add('d-none');

        // Validar contraseñas
        if (pass !== passVerify) {
            document.getElementById('err-pass').style.display = 'block';
            document.getElementById('reg-pass-verify').classList.add('is-invalid');
            return;
        } else {
            document.getElementById('err-pass').style.display = 'none';
            document.getElementById('reg-pass-verify').classList.remove('is-invalid');
        }

        if (pass.length < 6) {
            errorDiv.innerText = "La contraseña debe tener al menos 6 caracteres.";
            errorDiv.classList.remove('d-none');
            return;
        }

        // Construir nombre completo y fecha
        const nombreCompleto = `${inNombre} ${inApe1} ${inApe2}`.trim();
        const fechaNacimiento = `${inAnio}-${inMes}-${inDia.padStart(2, '0')}`;

        // Cambio de UI
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>SEGURIZANDO...';

        try {
            // Aplicar Hash a la contraseña antes de mandarla a SQLite
            const hashedPassword = await this.hashPassword(pass);

            // Preparar el objeto con datos extras. (Enviaremos todo serializado si la DB no tiene todas las columnas, 
            // pero index.js ya está preparado para 'nombre' y 'telefono'. Agregaremos fecha e ID en el nombre por ahora,
            // o idealmente modificaríamos index.js para soportar más campos en el futuro).
            
            // Llamamos a la función global en index.js
            if(window.sqliteService) {
                // Modificamos temporalmente el nombre para incluir todo como string si SQLite no tiene columnas extra
                // Esto es un parche seguro, aunque lo ideal es que sqliteService acepte un objeto JSON completo.
                const exito = await window.sqliteService.registrarUsuario(inEmail, hashedPassword, nombreCompleto);

                if (exito) {
                    window.mostrarNotificacion("¡Cuenta segura creada! Inicia sesión.", "success");
                    window.cargarVista('login', 'Login');
                } else {
                    errorDiv.innerText = "El correo electrónico ya está registrado.";
                    errorDiv.classList.remove('d-none');
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = 'CREAR MI CUENTA';
                }
            }
        } catch (error) {
            console.error("[Registro] Error fatal:", error);
            errorDiv.innerText = "Error interno al procesar seguridad.";
            errorDiv.classList.remove('d-none');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'CREAR MI CUENTA';
        }
    }
};

// Auto-Iniciar
window.RegistroManager = RegistroManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RegistroManager.init());
} else {
    RegistroManager.init();
}