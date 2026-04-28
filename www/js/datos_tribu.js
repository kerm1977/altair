// ==============================================================================
// ARCHIVO: www/js/datos_tribu.js
// ROL: Contiene la información y la oración de La Tribu de Los Libres
// ==============================================================================

document.addEventListener("DOMContentLoaded", function() {
    // Buscamos el cuerpo del modal de "Acerca de"
    const aboutModalBody = document.getElementById('aboutModalBody');
    
    if (aboutModalBody) {
        aboutModalBody.innerHTML = `
            <div class="display-4 text-success mb-3 opacity-75">
                <i class="bi bi-tree"></i>
            </div>
            <h2 class="prayer-title fw-bold mb-3 text-dark fs-3">La Tribu de Los Libres</h2>
            
            <p class="text-secondary small mb-3" style="line-height: 1.6;">
                Este devocionario fue creado por el equipo de Senderismo de <strong>La Tribu de Los Libres</strong> de La Unión de Cartago, Costa Rica, utilizando las bases del sitio <a href="https://www.vatican.va/special/rosary/index_rosary_sp.htm" target="_blank" class="text-decoration-none fw-bold text-primary">VATICAN</a> en memoria a las compañeras y compañeros creyentes que perdieron a un ser querido o simplemente son creyentes y seguidores de el Santo Rosario y la Divina Misericordia.
            </p>
            <p class="text-secondary small mb-4 fw-bold" style="line-height: 1.6;">
                Esta app es de uso Libre sin costo alguno para toda la comunidad Católica y todas aquellas personas que encuentren consuelo en la Oración.
            </p>
            
            <hr class="w-50 mx-auto text-muted mb-4 opacity-25">

            <h4 class="prayer-title fw-bold text-dark mb-3 fs-5">Oración de La Tribu</h4>
            
            <div class="card card-body bg-light border-0 shadow-sm text-center fst-italic text-secondary" style="font-size: 0.9rem; line-height: 1.8;">
                <p>GRACIAS SEÑOR POR ESTE HERMOSO DÍA QUE NOS HAS REGALADO.</p>
                <p>POR NUESTROS AMIGOS Y AMIGAS QUE NOS ACOMPAÑAN EN ESTA ACTIVIDAD Y AQUELLOS QUE NO PUDIERON ESTAR HOY CON NOSOTROS.</p>
                <p>NOS AMPARAMOS A TU PROTECCIÓN Y LA DE NUESTROS FAMILIARES QUE NOS ESPERAN EN CASA.</p>
                <p>PROTEGE A LOS INDEFENSOS QUE SUFREN LA AGRESIÓN Y ABANDONO DE CUALQUIER TIPO.</p>
                <p>PONEMOS A TODAS LAS PERSONAS QUE ESTÁN EN LOS HOSPITALES, A LOS PRIVADOS DE LIBERTAD Y DE MOVIMIENTO QUE DESEAN TENER LA OPORTUNIDAD QUE NOSOTROS TENEMOS EN ESTE DÍA... ACOMPÁÑALOS Y DALES FUERZA PARA VENCER SU ANGUSTIA.</p>
                <p>QUE TU PROTECCIÓN LLEGUE A LOS DEMÁS GRUPOS Y SENDERISTAS DEL MUNDO QUE COMPARTEN NUESTRA MISMA PASIÓN PARA QUE LLEVEMOS UN CORAZÓN PASIVO, ALEGRE Y SERENO CON UN ESPÍRITU PROTECTOR DE LA NATURALEZA Y NUESTRO ENTORNO, DISFRUTANDO ASÍ CADA PASO QUE DAMOS EN NUESTRA NACIÓN Y NUESTRA TIERRA.</p>
                <p>QUE HOY LA NATURALEZA Y LA MONTAÑA SE SOMETAN A TU ORDEN Y A TU PROTECCIÓN..... PARA QUE CONVIVAMOS CON ELLA DE MANERA PASIVA Y ARMONIOSA.</p>
                <p class="mb-0 fw-bold">FORTALECE NUESTRA AMISTAD, NUESTRA HERMANDAD Y DIOS CUBRA CON SU SANGRE PRECIOSA A ESTE GRUPO LLAMADO LA TRIBU.</p>
            </div>

            <div class="mt-4 text-center">
                <h5 class="prayer-title fw-bold text-dark fs-6 mb-3">Perfil de Senderismo</h5>
                <div class="d-flex flex-column gap-2 justify-content-center align-items-center small">
                    <a href="https://www.facebook.com/LaTribuDeLosLibres" target="_blank" class="text-decoration-none social-link fw-bold"><i class="bi bi-facebook me-2"></i>La Tribu de Los Libres</a>
                    <a href="https://latribu.top" target="_blank" class="text-decoration-none social-link fw-bold"><i class="bi bi-globe me-2"></i>latribu.top</a>
                </div>
            </div>
        `;
    }
});