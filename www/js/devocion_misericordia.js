// ==============================================================================
// ARCHIVO: www/js/devocion_misericordia.js
// ROL: Motor de secuencia para la Coronilla a la Divina Misericordia
// ==============================================================================

window.generarPasosMisericordia = function() {
    let steps = [];
    
    steps.push({ physicalId: 0, loopId: 0, title: 'La Señal de la Cruz', badge: 'Inicio', text: 'Por la señal de la Santa Cruz, de nuestros enemigos, líbranos, Señor, Dios nuestro. En el nombre del Padre y del Hijo y del Espíritu Santo. Amén.' });
    steps.push({ physicalId: 1, loopId: 0, title: 'Padre Nuestro', badge: 'Inicio', text: 'Padre nuestro que estás en el cielo...', fullText: FULL_PADRE_NUESTRO });
    steps.push({ physicalId: 2, loopId: 0, title: 'Ave María', badge: 'Inicio', text: 'Dios te salve, María, llena eres de gracia...', fullText: FULL_AVE_MARIA });
    steps.push({ physicalId: 3, loopId: 0, title: 'El Credo de los Apóstoles', badge: 'Inicio', text: 'Creo en Dios Padre, Todopoderoso...', fullText: FULL_CREDO });

    for (let paso = 1; paso <= 5; paso++) {
        steps.push({ 
            physicalId: 4, loopId: paso, title: 'Padre Eterno', badge: `Paso ${paso} de 5`, 
            text: '«Padre Eterno, te ofrezco el Cuerpo,\nla Sangre, el Alma y la Divinidad\nde Tu Amadísimo Hijo,\nNuestro Señor Jesucristo,\npara el perdón de nuestros\npecados y los del mundo entero.»',
            fullText: 'Padre Eterno, Te ofrezco el Cuerpo y la Sangre, el Alma y la Divinidad de Tu Amadísimo Hijo, nuestro Señor Jesucristo, como propiciación por nuestros pecados y los del mundo entero.'
        });
        for (let jac = 1; jac <= 10; jac++) {
            steps.push({ 
                physicalId: 4 + jac, loopId: paso, title: `Jaculatoria (${jac}/10)`, badge: `Paso ${paso} de 5`, 
                text: 'Por su dolorosa Pasión,\nten misericordia de nosotros y del mundo entero.',
                fullText: 'Por su dolorosa Pasión, ten misericordia de nosotros y del mundo entero.'
            });
        }
    }

    for (let tris = 1; tris <= 3; tris++) {
        steps.push({ 
            physicalId: 4, loopId: 6, title: `Santo Dios, Santo Fuerte (${tris}/3)`, badge: 'Cierre', 
            text: 'Te invitamos a tocar la medalla (o Siguiente) 3 veces:\n\nSanto Dios, Santo Fuerte, Santo Inmortal, ten piedad de nosotros y del mundo entero.',
            fullText: 'Santo Dios, Santo Fuerte, Santo Inmortal, ten piedad de nosotros y del mundo entero.'
        });
    }
    
    steps.push({ physicalId: 0, loopId: 7, title: 'Oración Final', badge: 'Despedida', text: '¡Toca la cruz iluminada para decir la oración final de Sangre y Agua!' });

    return steps;
};