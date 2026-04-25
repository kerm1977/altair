// --- CONSTANTES PARA ORACIONES COMPLETAS ---
const FULL_PADRE_NUESTRO = "Padre nuestro que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.";
const FULL_AVE_MARIA = "Dios te salve, María, llena eres de gracia, el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.";
const FULL_GLORIA = "Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.\n\nJaculatoria de Fátima:\nOh Jesús mío, perdona nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas, especialmente a las más necesitadas de tu infinita misericordia. Amén.";
const FULL_CREDO = "Creo en Dios Padre, Todopoderoso, Creador del cielo y de la tierra. Y en Jesucristo, su único Hijo, Nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó entre los muertos, subió a los cielos y está sentado a la derecha de Dios Padre, Todopoderoso. Desde allí vendrá a juzgar a vivos y a muertos. Creo en el Espíritu Santo, la Santa Iglesia Católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida perdurable. Amén.";
const FULL_SALVE = "Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh clementísima, oh piadosa, oh dulce siempre Virgen María! Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.";

// --- BASE DE DATOS DE LOS MISTERIOS DEL ROSARIO CON LECTURAS COMPLETAS ---
const misteriosData = {
    gozosos: [
        { titulo: "La Anunciación de Gabriel a María", lectura: "Meditamos el anuncio del Arcángel San Gabriel a la Virgen María y la Encarnación del Hijo de Dios. (Lucas 1, 26-38).\n\nEl ángel Gabriel se presenta a la Virgen María y le anuncia que será la Madre del Salvador. Ella responde con total obediencia: 'He aquí la esclava del Señor, hágase en mí según tu palabra'." },
        { titulo: "La Visitación de María a Isabel", lectura: "Meditamos la visita de María a su prima Santa Isabel. (Lucas 1, 39-56).\n\nMaría emprende un largo viaje por la montaña para servir a su prima. Al escuchar su saludo, el niño Juan el Bautista salta de gozo en el vientre de Isabel, quien exclama: '¡Bendita tú entre las mujeres y bendito el fruto de tu vientre!'." },
        { titulo: "El Nacimiento de Jesús", lectura: "Meditamos el nacimiento del Hijo de Dios en un portal de Belén. (Lucas 2, 1-20).\n\nJesús, el Rey del universo, nace en la más profunda pobreza y humildad en un pesebre, rodeado del amor de María y José, y es adorado por los pastores." },
        { titulo: "La Presentación en el Templo", lectura: "Meditamos la presentación del niño Jesús en el Templo de Jerusalén. (Lucas 2, 22-38).\n\nCumpliendo la ley de Moisés, María y José presentan a Jesús. El anciano Simeón lo toma en sus brazos reconociéndolo como 'la luz de las naciones' y profetiza que una espada atravesará el corazón de María." },
        { titulo: "El Niño perdido y hallado en el Templo", lectura: "Meditamos a Jesús perdido y hallado a los tres días en el Templo. (Lucas 2, 41-52).\n\nTras días de angustiosa búsqueda, María y José encuentran a Jesús a los doce años en el Templo, sentado entre los doctores de la ley, escuchándoles y haciéndoles preguntas." }
    ],
    dolorosos: [
        { titulo: "La Oración en el Huerto", lectura: "Meditamos la agonía de Jesús en el huerto de Getsemaní. (Mateo 22, 39-46).\n\nJesús experimenta una tristeza mortal ante el sufrimiento que le espera, llegando a sudar sangre. A pesar de la angustia, acepta totalmente la voluntad de su Padre: 'No se haga mi voluntad, sino la tuya'." },
        { titulo: "La Flagelación", lectura: "Meditamos la flagelación de nuestro Señor Jesucristo. (Juan 19, 1).\n\nJesús es atado a una columna por orden de Pilato y azotado con brutalidad. Sufre en su cuerpo purísimo el castigo terrible que merecían los pecados de toda la humanidad." },
        { titulo: "La Coronación de espinas", lectura: "Meditamos la coronación de espinas. (Marcos 15, 17-19).\n\nLos soldados romanos tejen una corona de espinas y la clavan sin piedad en la cabeza de Jesús. Le colocan un manto púrpura y se burlan de Él golpeándolo y diciéndole: '¡Salve, Rey de los judíos!'." },
        { titulo: "Jesús con la Cruz a cuestas", lectura: "Meditamos a Jesús cargando la cruz camino al Calvario. (Mateo 19, 16-17).\n\nCondenado a una muerte infame, Jesús carga con la pesada cruz sobre sus hombros heridos hacia el monte Calvario, cayendo varias veces por el peso aplastante de nuestros pecados." },
        { titulo: "La Crucifixión y Muerte", lectura: "Meditamos la crucifixión y muerte de Jesús. (Lucas 23, 33-46).\n\nJesús es clavado en la cruz entre dos ladrones. Tras tres horas de dolorosa agonía en la que perdona a sus verdugos y nos entrega a María como Madre, inclina la cabeza y entrega su espíritu." }
    ],
    gloriosos: [
        { titulo: "La Resurrección", lectura: "Meditamos la triunfante resurrección del Señor. (Mateo 28, 1-8).\n\nAl tercer día, Jesús resucita glorioso y victorioso de entre los muertos. La piedra del sepulcro es removida, venciendo para siempre el poder del pecado y de la muerte, dándonos la vida eterna." },
        { titulo: "La Ascensión", lectura: "Meditamos la ascensión de Jesús al cielo. (Marcos 24, 50-53).\n\nCuarenta días después de su resurrección, Jesús asciende por su propio poder al cielo en presencia de sus apóstoles y de su Madre, para sentarse a la derecha de Dios Padre." },
        { titulo: "La Venida del Espíritu Santo", lectura: "Meditamos el descenso del Espíritu Santo en Pentecostés. (Hechos 2, 1-4).\n\nReunidos en el cenáculo en oración junto a la Virgen María, el Espíritu Santo desciende en forma de lenguas de fuego sobre los apóstoles, llenándolos de sabiduría y valentía para predicar el Evangelio." },
        { titulo: "La Asunción de María al Cielo", lectura: "Meditamos la Asunción de la Virgen María en cuerpo y alma. (Cantar 2, 10-14).\n\nAl terminar el curso de su vida terrenal, la Virgen Inmaculada es elevada en cuerpo y alma a la gloria celestial por el poder de Dios, preservándola de la corrupción del sepulcro." },
        { titulo: "La Coronación de María como Reina", lectura: "Meditamos la coronación de María como Reina universal. (Apocalipsis 12, 1).\n\nMaría es recibida en el cielo y coronada por la Santísima Trinidad como Reina y Señora de todo lo creado, de los ángeles y de los hombres, abogada nuestra ante el trono de gracia." }
    ],
    luminosos: [
        { titulo: "El Bautismo en el Jordán", lectura: "Meditamos el Bautismo de Jesús en el río Jordán. (Mateo 3, 13-17).\n\nJesús es bautizado por Juan. En ese instante los cielos se abren, el Espíritu Santo desciende sobre Él en forma de paloma y se escucha la voz del Padre: 'Este es mi Hijo amado, en quien tengo mis complacencias'." },
        { titulo: "Las Bodas de Caná", lectura: "Meditamos la autorrevelación de Jesús en las bodas de Caná. (Juan 2, 1-12).\n\nAnte la falta de vino y por la tierna intercesión de la Virgen María que dice 'Hagan lo que Él les diga', Jesús realiza su primer milagro convirtiendo el agua en vino, manifestando así su gloria." },
        { titulo: "El Anuncio del Reino de Dios", lectura: "Meditamos el anuncio del Reino de Dios invitando a la conversión. (Marcos 1, 15).\n\nJesús recorre los pueblos predicando la llegada del Reino de Dios. Invita a todos a arrepentirse de sus pecados, a creer en el Evangelio y perdona a los pecadores con infinita misericordia." },
        { titulo: "La Transfiguración", lectura: "Meditamos la Transfiguración del Señor. (Lucas 9, 28-36).\n\nEn el monte Tabor, Jesús se transfigura ante Pedro, Santiago y Juan. Su rostro brilla como el sol y sus vestiduras se vuelven resplandecientes, mostrando un destello de su gloria divina para fortalecer su fe." },
        { titulo: "La Institución de la Eucaristía", lectura: "Meditamos la institución de la Sagrada Eucaristía. (Juan 13, 1).\n\nEn la Última Cena, sabiendo que había llegado su hora, Jesús nos entrega su Cuerpo y su Sangre bajo las especies del pan y del vino, instituyendo el sacerdocio y quedándose con nosotros para siempre." }
    ]
};

function getMisteriosHoy() {
    const day = new Date().getDay(); 
    if (day === 1 || day === 6) return { key: 'gozosos', title: 'Misterios Gozosos', list: misteriosData.gozosos };
    if (day === 2 || day === 5) return { key: 'dolorosos', title: 'Misterios Dolorosos', list: misteriosData.dolorosos };
    if (day === 4) return { key: 'luminosos', title: 'Misterios Luminosos', list: misteriosData.luminosos };
    return { key: 'gloriosos', title: 'Misterios Gloriosos', list: misteriosData.gloriosos }; 
}

// --- GENERADOR DE SECUENCIAS LÓGICAS ---
function generateSteps(devotionType) {
    let steps = [];
    
    if (devotionType === 'misericordia') {
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

    } else {
        const selectorVal = document.getElementById('mysterySelector') ? document.getElementById('mysterySelector').value : 'auto';
        let misteriosActuales;

        if (selectorVal === 'auto' || !selectorVal) {
            misteriosActuales = getMisteriosHoy();
        } else {
            const titleMap = { 'gozosos': 'Misterios Gozosos', 'dolorosos': 'Misterios Dolorosos', 'gloriosos': 'Misterios Gloriosos', 'luminosos': 'Misterios Luminosos' };
            misteriosActuales = { key: selectorVal, title: titleMap[selectorVal], list: misteriosData[selectorVal] };
        }

        steps.push({ physicalId: 0, loopId: 0, title: 'La Señal de la Cruz', badge: 'Inicio', text: 'Por la señal de la Santa Cruz, de nuestros enemigos, líbranos, Señor, Dios nuestro...' });
        steps.push({ physicalId: 1, loopId: 0, title: 'Padre Nuestro', badge: 'Inicio', text: 'Iniciamos rezando:\n\nPadre nuestro que estás en el cielo...', fullText: FULL_PADRE_NUESTRO });
        steps.push({ physicalId: 2, loopId: 0, title: '3 Ave Marías', badge: 'Inicio', text: 'Para aumentar nuestra Fe, Esperanza y Caridad:\n\nDios te salve María...', fullText: FULL_AVE_MARIA });
        steps.push({ physicalId: 3, loopId: 0, title: 'Gloria', badge: 'Inicio', text: 'Gloria al Padre, y al Hijo, y al Espíritu Santo...', fullText: FULL_GLORIA });

        for (let paso = 1; paso <= 5; paso++) {
            const misterioObj = misteriosActuales.list[paso - 1];
            
            // TEXTO DE MISTERIOS MODIFICADO CON ICONO NEGRO E INTERACTIVO
            steps.push({ 
                physicalId: 4, loopId: paso, title: `Misterio ${paso}: ${misteriosActuales.title}`, badge: `Misterio ${paso} de 5`, 
                text: `Meditamos:\n${misterioObj.titulo}.\n\n<span class="text-muted text-decoration-underline" style="font-size: 0.95rem; cursor: pointer;" data-bs-toggle="modal" data-bs-target="#fullPrayerModal">(Toca <i class="bi bi-book-half text-dark"></i> <strong>Leer</strong> para la meditación completa y el Padre Nuestro)</span>`, 
                fullText: `${misterioObj.lectura}\n\nOramos:\n${FULL_PADRE_NUESTRO}` 
            });
            for (let ave = 1; ave <= 10; ave++) {
                steps.push({ physicalId: 4 + ave, loopId: paso, title: `Ave María (${ave}/10)`, badge: `Misterio ${paso} de 5`, text: 'Dios te salve, María, llena eres de gracia, el Señor es contigo...', fullText: FULL_AVE_MARIA });
            }
        }
        
        steps.push({ physicalId: 4, loopId: 6, title: 'La Salve', badge: 'Cierre', text: 'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra...', fullText: FULL_SALVE });
        steps.push({ physicalId: 0, loopId: 7, title: 'Señal de la Cruz Final', badge: 'Despedida', text: 'Toca la cruz iluminada para terminar.\n\nEn el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.' });
    }
    return steps;
}

// Estado persistente
let currentDevotion = localStorage.getItem('selected_devotion') || 'misericordia';
let selectedMystery = localStorage.getItem('selected_mystery') || 'auto';

let logicalSteps = generateSteps(currentDevotion);
let currentStepIndex = 0;
let beadPositions = [];

// Elementos DOM
const rosaryContainer = document.getElementById('rosary-container');
const prayerCardContent = document.getElementById('prayer-card-content');
const prayerTitle = document.getElementById('prayer-title');
const prayerText = document.getElementById('prayer-text');
const stepBadge = document.getElementById('step-badge');
const badgeIcon = document.getElementById('badge-icon');
const mysterySelectorContainer = document.getElementById('mystery-selector-container');

const fabPrayer = document.getElementById('fab-prayer');
const fabPrayerMobile = document.getElementById('fab-prayer-mobile');
const btnInlineLeer = document.getElementById('btn-inline-leer');
const fullPrayerTitle = document.getElementById('fullPrayerTitle');
const fullPrayerText = document.getElementById('fullPrayerText');

const btnPrevFloat = document.getElementById('btn-prev-float');
const btnNextFloat = document.getElementById('btn-next-float');

let completionModal, settingsModal, sangreAguaModal;
let progressResetModal, progressConfirmModal;

// Variables de Progreso Independientes
let completedCountMisericordia = parseInt(localStorage.getItem('misericordia_count')) || 0;
let userGoalMisericordia = parseInt(localStorage.getItem('misericordia_goal')) || 9;
let nextAskMisericordia = parseInt(localStorage.getItem('misericordia_next_ask')) || userGoalMisericordia;

let completedCountRosario = parseInt(localStorage.getItem('rosario_count')) || 0;
let userGoalRosario = parseInt(localStorage.getItem('rosario_goal')) || 9;
let nextAskRosario = parseInt(localStorage.getItem('rosario_next_ask')) || userGoalRosario;

let runCompleted = false;

document.addEventListener("DOMContentLoaded", function() {
    
    // --- VALIDACIONES DE SEGURIDAD PARA MODALES (Evita crasheos de Bootstrap) ---
    const elCompletion = document.getElementById('completionModal');
    if (elCompletion) completionModal = new bootstrap.Modal(elCompletion);
    
    const elSettings = document.getElementById('settingsModal');
    if (elSettings) settingsModal = new bootstrap.Modal(elSettings);
    
    const elSangreAgua = document.getElementById('sangreAguaModal');
    if (elSangreAgua) sangreAguaModal = new bootstrap.Modal(elSangreAgua);
    
    const elProgressReset = document.getElementById('progressResetModal');
    if (elProgressReset) progressResetModal = new bootstrap.Modal(elProgressReset);
    
    const elProgressConfirm = document.getElementById('progressConfirmModal');
    if (elProgressConfirm) progressConfirmModal = new bootstrap.Modal(elProgressConfirm);
    
    // Restaurar selector de misterios si existe
    const mysterySelector = document.getElementById('mysterySelector');
    if(mysterySelector) {
        mysterySelector.value = selectedMystery;
    }

    // Restaurar selección visual en UI (validando elementos)
    if (currentDevotion === 'rosario') {
        const devRosario = document.getElementById('devRosario');
        if (devRosario) devRosario.checked = true;
        if(mysterySelectorContainer) mysterySelectorContainer.classList.remove('d-none');
    } else {
        const devMisericordia = document.getElementById('devMisericordia');
        if (devMisericordia) devMisericordia.checked = true;
        if(mysterySelectorContainer) mysterySelectorContainer.classList.add('d-none');
    }

    const modalIcon = document.getElementById('modal-icon');
    const btnModalClose = document.getElementById('btn-modal-close');
    if (currentDevotion === 'misericordia') {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-droplet-half text-primary"></i>';
        if(btnModalClose) btnModalClose.classList.replace('btn-primary-custom', 'btn-primary');
    } else {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>';
        if(btnModalClose) btnModalClose.classList.replace('btn-primary', 'btn-primary-custom');
    }

    // Recargar los pasos con la configuración restaurada
    logicalSteps = generateSteps(currentDevotion);

    // Inicializar progreso
    updateProgressUI();
    
    renderRosary();
    updateUI();
});

// --- SISTEMA DE PROGRESO INDEPENDIENTE ---
function updateProgressUI() {
    let currentCount = currentDevotion === 'misericordia' ? completedCountMisericordia : completedCountRosario;
    let currentGoal = currentDevotion === 'misericordia' ? userGoalMisericordia : userGoalRosario;

    const countElem = document.getElementById('completed-count');
    if(countElem) countElem.textContent = currentCount;
    
    const goalElem = document.getElementById('goal-selector');
    if(goalElem) goalElem.value = currentGoal;
    
    const progressPercent = Math.min((currentCount / currentGoal) * 100, 100);
    const progressBar = document.getElementById('goal-progress-bar');
    if(progressBar) {
        progressBar.style.width = `${progressPercent}%`;
        progressBar.textContent = `${Math.round(progressPercent)}%`;
        progressBar.setAttribute('aria-valuenow', progressPercent);
    }

    const titleElem = document.getElementById('progress-title');
    if(titleElem) titleElem.innerHTML = `<i class="bi bi-trophy text-warning me-1"></i> Progreso (${currentDevotion === 'misericordia' ? 'Divina Misericordia' : 'Santo Rosario'})`;
}

window.changeGoal = function() {
    const goalSelector = document.getElementById('goal-selector');
    if(!goalSelector) return;
    
    let newGoal = parseInt(goalSelector.value);
    if (currentDevotion === 'misericordia') {
        userGoalMisericordia = newGoal;
        nextAskMisericordia = newGoal; // Resetear la próxima pregunta al cambiar meta
        localStorage.setItem('misericordia_goal', newGoal);
        localStorage.setItem('misericordia_next_ask', newGoal);
    } else {
        userGoalRosario = newGoal;
        nextAskRosario = newGoal;
        localStorage.setItem('rosario_goal', newGoal);
        localStorage.setItem('rosario_next_ask', newGoal);
    }
    updateProgressUI();
};

window.hideSettingsModal = function() {
    if(settingsModal) settingsModal.hide();
};

window.changeDevotion = function() {
    const checkedDevotion = document.querySelector('input[name="devotion"]:checked');
    if(!checkedDevotion) return;
    
    currentDevotion = checkedDevotion.value;
    localStorage.setItem('selected_devotion', currentDevotion);
    
    const mysterySelector = document.getElementById('mysterySelector');
    if (mysterySelector) {
        localStorage.setItem('selected_mystery', mysterySelector.value);
    }
    
    if (currentDevotion === 'rosario') {
        if(mysterySelectorContainer) mysterySelectorContainer.classList.remove('d-none');
    } else {
        if(mysterySelectorContainer) mysterySelectorContainer.classList.add('d-none');
    }

    logicalSteps = generateSteps(currentDevotion);
    
    const modalIcon = document.getElementById('modal-icon');
    const btnModalClose = document.getElementById('btn-modal-close');
    
    if (currentDevotion === 'misericordia') {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-droplet-half text-primary"></i>';
        if(btnModalClose) btnModalClose.classList.replace('btn-primary-custom', 'btn-primary');
    } else {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>';
        if(btnModalClose) btnModalClose.classList.replace('btn-primary', 'btn-primary-custom');
    }

    updateProgressUI();
    resetDecenario();
};

function blendRGB(c1, c2, factor) {
    return [
        Math.round(c1[0] + (c2[0] - c1[0]) * factor),
        Math.round(c1[1] + (c2[1] - c1[1]) * factor),
        Math.round(c1[2] + (c2[2] - c1[2]) * factor)
    ];
}

function getBeadColors(physicalId, isMisericordia) {
    const r1 = [255, 179, 179], r2 = [255, 26, 26], r3 = [204, 0, 0], r4 = [102, 0, 0];
    
    if (!isMisericordia || physicalId < 5) {
        return { c1: r1.join(','), c2: r2.join(','), c3: r3.join(','), c4: r4.join(',') };
    } 
    
    const loopIndex = physicalId - 5; 
    const factor = loopIndex / 9; 
    const b1 = [179, 230, 255], b2 = [26, 179, 255], b3 = [0, 102, 204], b4 = [0, 51, 102];
    
    return {
        c1: blendRGB(r1, b1, factor).join(','),
        c2: blendRGB(r2, b2, factor).join(','),
        c3: blendRGB(r3, b3, factor).join(','),
        c4: blendRGB(r4, b4, factor).join(',')
    };
}

// --- CÁLCULO DE POSICIONES: CÍRCULO PERFECTO GARANTIZADO ---
function calculatePositions() {
    const pos = new Array(15);
    
    pos[0] = { x: 50, y: 95, type: 'cross' };   
    pos[1] = { x: 50, y: 83, type: 'small-bead' }; 
    pos[2] = { x: 50, y: 72, type: 'small-bead' }; 
    pos[3] = { x: 50, y: 61, type: 'small-bead' }; 
    pos[4] = { x: 50, y: 49, type: 'medal' };      

    const cx = 50, cy = 25, radiusX = 35, radiusY = 25; 
    const startAngle = Math.PI * 0.75; 
    const endAngle = Math.PI * 2.25;   
    
    for (let i = 0; i < 10; i++) {
        const angle = startAngle + (i / 9) * (endAngle - startAngle);
        pos[i + 5] = { 
            x: cx + radiusX * Math.cos(angle), 
            y: cy + radiusY * Math.sin(angle), 
            type: 'small-bead' 
        };
    }
    return pos;
}

function renderRosary() {
    if (!rosaryContainer) return;

    const floatPrev = document.getElementById('btn-prev-float');
    const floatNext = document.getElementById('btn-next-float');
    
    rosaryContainer.innerHTML = '';
    if(floatPrev) rosaryContainer.appendChild(floatPrev);
    if(floatNext) rosaryContainer.appendChild(floatNext);
    if(fabPrayerMobile) rosaryContainer.appendChild(fabPrayerMobile);
    
    beadPositions = calculatePositions();
    const isMisericordia = currentDevotion === 'misericordia';

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", "none"); 
    path.setAttribute("stroke", "#adb5bd");
    path.setAttribute("stroke-width", "1.2");
    path.setAttribute("stroke-dasharray", "2 1"); 

    let d = `M ${beadPositions[0].x} ${beadPositions[0].y} `; 
    for (let i = 1; i <= 4; i++) { d += `L ${beadPositions[i].x} ${beadPositions[i].y} `; } 
    
    d += `L ${beadPositions[5].x} ${beadPositions[5].y} `; 
    for (let i = 6; i <= 14; i++) { d += `L ${beadPositions[i].x} ${beadPositions[i].y} `; } 
    d += `L ${beadPositions[4].x} ${beadPositions[4].y} `; 

    path.setAttribute("d", d);
    svg.appendChild(path);
    rosaryContainer.appendChild(svg);

    beadPositions.forEach((pos, pId) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'bead-wrapper';
        wrapper.style.left = `${pos.x}%`;
        wrapper.style.top = `${pos.y}%`;
        wrapper.id = `wrapper-${pId}`;

        const btn = document.createElement('button');
        btn.className = `bead`;
        btn.onclick = () => handlePhysicalClick(pId);
        
        if (pos.type === 'cross') {
            btn.classList.add('realistic-cross');
            btn.innerHTML = `<svg viewBox="0 0 45 65" style="width:100%; height:100%;"><use href="#silver-cross-icon"></use></svg>`;
        } else if (pos.type === 'medal') {
            btn.classList.add('realistic-medal');
            btn.classList.add(isMisericordia ? 'medal-misericordia' : 'medal-rosario');
        } else {
            btn.classList.add('realistic-bead');
            const colors = getBeadColors(pId, isMisericordia);
            btn.style.setProperty('--b-c1', `rgb(${colors.c1})`);
            btn.style.setProperty('--b-c2', `rgb(${colors.c2})`);
            btn.style.setProperty('--b-c3', `rgb(${colors.c3})`);
            btn.style.setProperty('--b-c4', `rgb(${colors.c4})`);
        }

        wrapper.appendChild(btn);
        rosaryContainer.appendChild(wrapper);
    });
}

function updateUI() {
    if (!prayerCardContent || !logicalSteps.length) return;

    prayerCardContent.style.opacity = '0';
    const step = logicalSteps[currentStepIndex];

    setTimeout(() => {
        if(prayerTitle) prayerTitle.textContent = step.title;
        if(prayerText) prayerText.innerHTML = step.text; 
        if(stepBadge) stepBadge.textContent = step.badge;
        
        // Mostrar botón flotante y botón en línea si hay texto completo
        if (step.fullText) {
            if(fabPrayer) fabPrayer.classList.remove('prayer-btn-hidden');
            if(fabPrayerMobile) fabPrayerMobile.classList.remove('prayer-btn-hidden');
            if(btnInlineLeer) btnInlineLeer.classList.remove('d-none');
            
            if(fullPrayerTitle) fullPrayerTitle.textContent = step.title;
            if(fullPrayerText) fullPrayerText.textContent = step.fullText; 
        } else {
            if(fabPrayer) fabPrayer.classList.add('prayer-btn-hidden');
            if(fabPrayerMobile) fabPrayerMobile.classList.add('prayer-btn-hidden');
            if(btnInlineLeer) btnInlineLeer.classList.add('d-none');
        }
        
        if (badgeIcon) {
            if (currentDevotion === 'misericordia') {
                badgeIcon.className = 'bi bi-droplet-half text-primary me-1';
            } else {
                badgeIcon.className = 'bi bi-suit-heart-fill text-danger me-1';
            }
        }
        
        prayerCardContent.style.opacity = '1';
    }, 250);

    const activePhysicalId = step.physicalId;
    const currentLoop = step.loopId;
    
    const wrappers = document.querySelectorAll('.bead-wrapper');
    wrappers.forEach((wrapper, pId) => {
        wrapper.classList.remove('active', 'completed');
        
        if (pId === activePhysicalId) {
            wrapper.classList.add('active');
        } else {
            if (currentLoop === 0) {
                if (pId < activePhysicalId) wrapper.classList.add('completed');
            } else if (currentLoop >= 6) { 
                if (pId !== 4 && pId !== 0) wrapper.classList.add('completed');
            } else {
                if (pId < 5) {
                    wrapper.classList.add('completed'); 
                } else if (pId < activePhysicalId) {
                    wrapper.classList.add('completed'); 
                }
            }
        }
    });

    if(btnPrevFloat) btnPrevFloat.disabled = currentStepIndex === 0;

    if (btnNextFloat) {
        if (currentStepIndex === logicalSteps.length - 1) {
            btnNextFloat.innerHTML = '<i class="bi bi-check-lg"></i>';
            btnNextFloat.className = 'btn-float-nav nav-next bg-success text-white';
        } else {
            btnNextFloat.innerHTML = '<i class="bi bi-chevron-right"></i>';
            if (currentDevotion === 'misericordia') {
                btnNextFloat.className = 'btn-float-nav nav-next bg-primary text-white';
            } else {
                btnNextFloat.className = 'btn-float-nav nav-next text-white';
                btnNextFloat.style.backgroundColor = '#b91c1c';
            }
        }
    }
}

function handlePhysicalClick(pId) {
    const currentStep = logicalSteps[currentStepIndex];
    
    if (pId === currentStep.physicalId && currentStepIndex < logicalSteps.length - 1) {
        if (logicalSteps[currentStepIndex + 1].physicalId === pId) {
            handleNext();
            return;
        }
    }
    
    if (pId === 0 && currentStep.loopId === 7) {
        handleNext();
        return;
    }

    let targetLoop = currentStep.loopId;

    if (pId === 4) { 
        if (currentStep.loopId === 0) {
            targetLoop = 1; 
        } else if (currentStep.physicalId === 14) {
            targetLoop = currentStep.loopId < 5 ? currentStep.loopId + 1 : 6;
        }
    } else if (pId === 5 && currentStep.physicalId === 14 && currentStep.loopId < 5) {
        targetLoop = currentStep.loopId + 1;
    } else if (pId > 4) { 
        if (currentStep.loopId === 0 || currentStep.loopId >= 6) {
            targetLoop = 1; 
        }
    } else if (pId < 4) { 
        targetLoop = 0; 
    }

    let foundIndex = logicalSteps.findIndex(s => s.physicalId === pId && s.loopId === targetLoop);
    
    if (foundIndex !== -1) {
        currentStepIndex = foundIndex;
        updateUI();
    }
}

function handleNext() {
    if (currentStepIndex < logicalSteps.length - 1) {
        currentStepIndex++;
        updateUI();
        
        // Si llegamos al último paso, analizamos el progreso
        if (currentStepIndex === logicalSteps.length - 1 && !runCompleted) {
            runCompleted = true;
            checkAndPromptProgress();
        }
    } else {
        // En el último paso, abrimos modal final según corresponda
        if (currentDevotion === 'misericordia') {
            if(sangreAguaModal) sangreAguaModal.show();
        } else {
            if(completionModal) completionModal.show();
        }
    }
}

// --- LOGICA DE REINICIO DE PROGRESO ---
function checkAndPromptProgress() {
    let currentCount, currentGoal, nextAsk;

    if (currentDevotion === 'misericordia') {
        completedCountMisericordia++;
        localStorage.setItem('misericordia_count', completedCountMisericordia);
        currentCount = completedCountMisericordia;
        currentGoal = userGoalMisericordia;
        nextAsk = nextAskMisericordia;
    } else {
        completedCountRosario++;
        localStorage.setItem('rosario_count', completedCountRosario);
        currentCount = completedCountRosario;
        currentGoal = userGoalRosario;
        nextAsk = nextAskRosario;
    }
    
    updateProgressUI();

    // Comprobar si hemos alcanzado la cuota de pregunta (ej: meta 9, o +30 días si declinó antes)
    if (currentCount >= nextAsk) {
        if(progressResetModal) progressResetModal.show();
    }
}

// Botón: No, mantener contando
window.keepProgress = function() {
    if(progressResetModal) progressResetModal.hide();
    if(progressConfirmModal) progressConfirmModal.hide();
    
    // Suma 30 días a la próxima vez que se le preguntará
    if (currentDevotion === 'misericordia') {
        nextAskMisericordia = completedCountMisericordia + 30;
        localStorage.setItem('misericordia_next_ask', nextAskMisericordia);
    } else {
        nextAskRosario = completedCountRosario + 30;
        localStorage.setItem('rosario_next_ask', nextAskRosario);
    }
    
    // Continúa mostrando el modal final habitual
    showCompletion();
};

// Botón: Sí, reiniciar progreso (Abre confirmación)
window.confirmProgressReset = function() {
    if(progressResetModal) progressResetModal.hide();
    if(progressConfirmModal) progressConfirmModal.show();
};

// Botón final: Limpiar Todo
window.executeProgressReset = function() {
    if(progressConfirmModal) progressConfirmModal.hide();
    
    if (currentDevotion === 'misericordia') {
        completedCountMisericordia = 0;
        nextAskMisericordia = userGoalMisericordia;
        localStorage.setItem('misericordia_count', 0);
        localStorage.setItem('misericordia_next_ask', nextAskMisericordia);
    } else {
        completedCountRosario = 0;
        nextAskRosario = userGoalRosario;
        localStorage.setItem('rosario_count', 0);
        localStorage.setItem('rosario_next_ask', nextAskRosario);
    }
    
    updateProgressUI();
    showCompletion();
};

function handlePrev() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        updateUI();
    }
}

function resetDecenario() {
    currentStepIndex = 0;
    runCompleted = false;
    renderRosary();
    updateUI();
}

window.showCompletion = function() {
    if(sangreAguaModal) sangreAguaModal.hide();
    if(completionModal) completionModal.show();
};

if(btnNextFloat) btnNextFloat.addEventListener('click', handleNext);
if(btnPrevFloat) btnPrevFloat.addEventListener('click', handlePrev);

window.addEventListener('resize', () => {
    renderRosary();
    updateUI();
});