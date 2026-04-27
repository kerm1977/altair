// ==============================================================================
// ARCHIVO: www/js/index.js
// ROL: Controlador Principal, Interfaz UI y Lógica Global (LIMPIO DE DIBUJO)
// ==============================================================================

// --- CONSTANTES PARA ORACIONES COMPLETAS GLOBALES ---
const FULL_PADRE_NUESTRO = "Padre nuestro que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.";
const FULL_AVE_MARIA = "Dios te salve, María, llena eres de gracia, el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.";
const FULL_GLORIA = "Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.\n\nJaculatoria de Fátima:\nOh Jesús mío, perdona nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas, especialmente a las más necesitadas de tu infinita misericordia. Amén.";
const FULL_CREDO = "Creo en Dios Padre, Todopoderoso, Creador del cielo y de la tierra. Y en Jesucristo, su único Hijo, Nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó entre los muertos, subió a los cielos y está sentado a la derecha de Dios Padre, Todopoderoso. Desde allí vendrá a juzgar a vivos y a muertos. Creo en el Espíritu Santo, la Santa Iglesia Católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida perdurable. Amén.";
const FULL_SALVE = "Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh clementísima, oh piadosa, oh dulce siempre Virgen María! Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.";

// --- DELEGADOR DE SECUENCIAS LÓGICAS (LLAMA A LOS ARCHIVOS EXTERNOS) ---
function generateSteps(devotionType) {
    if (devotionType === 'misericordia' && typeof window.generarPasosMisericordia === 'function') {
        return window.generarPasosMisericordia();
    } else if (devotionType === 'rosario' && typeof window.generarPasosRosario === 'function') {
        return window.generarPasosRosario();
    } else if (devotionType === 'nino' && typeof window.generarPasosNino === 'function') {
        return window.generarPasosNino();
    }
    return [];
}

// Estado persistente
let currentDevotion = localStorage.getItem('selected_devotion') || 'misericordia';
window.currentDevotion = currentDevotion; // Exponer para dibujo_decenario.js
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

// Botones de la barra lateral de UI
const btnSidebarRead = document.getElementById('sidebar-btn-read');
const fullPrayerTitle = document.getElementById('fullPrayerTitle');
const fullPrayerText = document.getElementById('fullPrayerText');

const btnPrevFloat = document.getElementById('sidebar-btn-prev');
const btnNextFloat = document.getElementById('sidebar-btn-next');

let completionModal, settingsModal, sangreAguaModal;
let progressResetModal, progressConfirmModal;

// Variables de Progreso Independientes
let completedCountMisericordia = parseInt(localStorage.getItem('misericordia_count')) || 0;
let userGoalMisericordia = parseInt(localStorage.getItem('misericordia_goal')) || 9;
let nextAskMisericordia = parseInt(localStorage.getItem('misericordia_next_ask')) || userGoalMisericordia;

let completedCountRosario = parseInt(localStorage.getItem('rosario_count')) || 0;
let userGoalRosario = parseInt(localStorage.getItem('rosario_goal')) || 9;
let nextAskRosario = parseInt(localStorage.getItem('rosario_next_ask')) || userGoalRosario;

let completedCountNino = parseInt(localStorage.getItem('nino_count')) || 0;
let userGoalNino = parseInt(localStorage.getItem('nino_goal')) || 9;
let nextAskNino = parseInt(localStorage.getItem('nino_next_ask')) || userGoalNino;

let runCompleted = false;

document.addEventListener("DOMContentLoaded", function() {
    // Validaciones de modales
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
    
    const mysterySelector = document.getElementById('mysterySelector');
    if(mysterySelector) mysterySelector.value = selectedMystery;

    // UI visual inicial
    if (currentDevotion === 'rosario') {
        const devRosario = document.getElementById('devRosario');
        if (devRosario) devRosario.checked = true;
        if(mysterySelectorContainer) mysterySelectorContainer.classList.remove('d-none');
    } else if (currentDevotion === 'nino') {
        const devNino = document.getElementById('devNino');
        if (devNino) devNino.checked = true;
        if(mysterySelectorContainer) mysterySelectorContainer.classList.add('d-none');
    } else {
        const devMisericordia = document.getElementById('devMisericordia');
        if (devMisericordia) devMisericordia.checked = true;
        if(mysterySelectorContainer) mysterySelectorContainer.classList.add('d-none');
    }

    const modalIcon = document.getElementById('modal-icon');
    const btnModalClose = document.getElementById('btn-modal-close');
    
    if (currentDevotion === 'misericordia') {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-droplet-half text-primary"></i>';
        if(btnModalClose) btnModalClose.className = 'btn btn-primary w-100 py-2 fs-5';
    } else if (currentDevotion === 'rosario') {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>';
        if(btnModalClose) btnModalClose.className = 'btn btn-danger w-100 py-2 fs-5';
    } else {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-star-fill text-warning"></i>';
        if(btnModalClose) btnModalClose.className = 'btn btn-warning text-dark fw-bold w-100 py-2 fs-5';
    }

    logicalSteps = generateSteps(currentDevotion);
    updateProgressUI();
    if (typeof renderRosary === 'function') renderRosary();
    updateUI();
});

// --- SISTEMA DE PROGRESO INDEPENDIENTE ---
function updateProgressUI() {
    let currentCount = currentDevotion === 'misericordia' ? completedCountMisericordia : (currentDevotion === 'rosario' ? completedCountRosario : completedCountNino);
    let currentGoal = currentDevotion === 'misericordia' ? userGoalMisericordia : (currentDevotion === 'rosario' ? userGoalRosario : userGoalNino);

    let progressTitleName = "Santo Rosario";
    if (currentDevotion === 'misericordia') progressTitleName = "Divina Misericordia";
    if (currentDevotion === 'nino') progressTitleName = "Niño Jesús";

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
    if(titleElem) titleElem.innerHTML = `<i class="bi bi-trophy text-warning me-1"></i> Progreso (${progressTitleName})`;
}

window.changeGoal = function() {
    const goalSelector = document.getElementById('goal-selector');
    if(!goalSelector) return;
    
    let newGoal = parseInt(goalSelector.value);
    
    if (currentDevotion === 'misericordia') {
        userGoalMisericordia = newGoal;
        nextAskMisericordia = newGoal; 
        localStorage.setItem('misericordia_goal', newGoal);
        localStorage.setItem('misericordia_next_ask', newGoal);
    } else if (currentDevotion === 'rosario') {
        userGoalRosario = newGoal;
        nextAskRosario = newGoal;
        localStorage.setItem('rosario_goal', newGoal);
        localStorage.setItem('rosario_next_ask', newGoal);
    } else {
        userGoalNino = newGoal;
        nextAskNino = newGoal;
        localStorage.setItem('nino_goal', newGoal);
        localStorage.setItem('nino_next_ask', newGoal);
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
    window.currentDevotion = currentDevotion; // Actualizar para dibujo_decenario.js
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
        if(btnModalClose) btnModalClose.className = 'btn btn-primary w-100 py-2 fs-5';
    } else if (currentDevotion === 'rosario') {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>';
        if(btnModalClose) btnModalClose.className = 'btn btn-danger w-100 py-2 fs-5';
    } else {
        if(modalIcon) modalIcon.innerHTML = '<i class="bi bi-star-fill text-warning"></i>';
        if(btnModalClose) btnModalClose.className = 'btn btn-warning text-dark fw-bold w-100 py-2 fs-5';
    }

    updateProgressUI();
    resetDecenario();
};

function updateUI() {
    if (!prayerCardContent || !logicalSteps.length) return;

    prayerCardContent.style.opacity = '0';
    const step = logicalSteps[currentStepIndex];

    setTimeout(() => {
        if(prayerTitle) prayerTitle.textContent = step.title;
        if(prayerText) prayerText.innerHTML = step.text; 
        if(stepBadge) stepBadge.textContent = step.badge;
        
        if (step.fullText) {
            if(btnSidebarRead) btnSidebarRead.classList.remove('prayer-btn-hidden', 'd-none');
            if(fullPrayerTitle) fullPrayerTitle.textContent = step.title;
            if(fullPrayerText) fullPrayerText.innerHTML = step.fullText.replace(/\n/g, '<br>'); 
        } else {
            if(btnSidebarRead) btnSidebarRead.classList.add('prayer-btn-hidden', 'd-none');
        }
        
        if (badgeIcon) {
            if (currentDevotion === 'misericordia') badgeIcon.className = 'bi bi-droplet-half text-primary me-1';
            else if (currentDevotion === 'rosario') badgeIcon.className = 'bi bi-suit-heart-fill text-danger me-1';
            else badgeIcon.className = 'bi bi-star-fill text-warning me-1';
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
            } else if (currentDevotion === 'nino' && currentLoop === 6) {
                if (pId > activePhysicalId || pId > 3) wrapper.classList.add('completed');
            } else if (currentDevotion === 'nino' && currentLoop === 7) {
                if (pId !== 4 && pId !== 0) wrapper.classList.add('completed');
            } else if (currentDevotion === 'nino' && currentLoop >= 8) {
                if (pId !== 0) wrapper.classList.add('completed');
            } else if (currentDevotion !== 'nino' && currentLoop >= 6) { 
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
            btnNextFloat.className = 'btn rounded-circle shadow action-btn mb-3 bg-success text-white';
        } else {
            btnNextFloat.innerHTML = '<i class="bi bi-chevron-right"></i>';
            if (currentDevotion === 'misericordia') {
                btnNextFloat.className = 'btn rounded-circle shadow action-btn mb-3 bg-primary text-white';
            } else if (currentDevotion === 'rosario') {
                btnNextFloat.className = 'btn rounded-circle shadow action-btn mb-3 bg-danger text-white';
            } else {
                btnNextFloat.className = 'btn rounded-circle shadow action-btn mb-3 bg-warning text-dark';
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
    if (pId === 0 && currentStep.physicalId === 0) {
        handleNext();
        return;
    }

    let targetLoop = currentStep.loopId;

    if (pId === 4) { 
        if (currentStep.loopId === 0) {
            targetLoop = 1; 
        } else if (currentStep.physicalId === 14) {
            targetLoop = currentStep.loopId < 5 ? currentStep.loopId + 1 : 6;
        } else if (currentDevotion === 'nino' && currentStep.loopId === 6) {
            targetLoop = 7;
        }
    } else if (pId === 5 && currentStep.physicalId === 14 && currentStep.loopId < 5) {
        targetLoop = currentStep.loopId + 1;
    } else if (currentDevotion === 'nino' && pId === 3 && currentStep.loopId >= 5) {
        targetLoop = 6;
    } else if (currentDevotion === 'nino' && pId === 0 && currentStep.loopId >= 7) {
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

window.handlePhysicalClick = handlePhysicalClick; // Exponer para dibujo_decenario.js

function handleNext() {
    if (currentStepIndex < logicalSteps.length - 1) {
        currentStepIndex++;
        updateUI();
        
        if (currentStepIndex === logicalSteps.length - 1 && !runCompleted) {
            runCompleted = true;
            checkAndPromptProgress();
        }
    } else {
        if (currentDevotion === 'misericordia') {
            if(sangreAguaModal) sangreAguaModal.show();
        } else {
            if(completionModal) completionModal.show();
        }
    }
}

function checkAndPromptProgress() {
    let currentCount, currentGoal, nextAsk;

    if (currentDevotion === 'misericordia') {
        completedCountMisericordia++;
        localStorage.setItem('misericordia_count', completedCountMisericordia);
        currentCount = completedCountMisericordia;
        currentGoal = userGoalMisericordia;
        nextAsk = nextAskMisericordia;
    } else if (currentDevotion === 'rosario') {
        completedCountRosario++;
        localStorage.setItem('rosario_count', completedCountRosario);
        currentCount = completedCountRosario;
        currentGoal = userGoalRosario;
        nextAsk = nextAskRosario;
    } else {
        completedCountNino++;
        localStorage.setItem('nino_count', completedCountNino);
        currentCount = completedCountNino;
        currentGoal = userGoalNino;
        nextAsk = nextAskNino;
    }
    
    updateProgressUI();

    if (currentCount >= nextAsk) {
        if(progressResetModal) progressResetModal.show();
    }
}

window.keepProgress = function() {
    if(progressResetModal) progressResetModal.hide();
    if(progressConfirmModal) progressConfirmModal.hide();
    
    if (currentDevotion === 'misericordia') {
        nextAskMisericordia = completedCountMisericordia + 30;
        localStorage.setItem('misericordia_next_ask', nextAskMisericordia);
    } else if (currentDevotion === 'rosario') {
        nextAskRosario = completedCountRosario + 30;
        localStorage.setItem('rosario_next_ask', nextAskRosario);
    } else {
        nextAskNino = completedCountNino + 30;
        localStorage.setItem('nino_next_ask', nextAskNino);
    }
    
    showCompletion();
};

window.confirmProgressReset = function() {
    if(progressResetModal) progressResetModal.hide();
    if(progressConfirmModal) progressConfirmModal.show();
};

window.executeProgressReset = function() {
    if(progressConfirmModal) progressConfirmModal.hide();
    
    if (currentDevotion === 'misericordia') {
        completedCountMisericordia = 0;
        nextAskMisericordia = userGoalMisericordia;
        localStorage.setItem('misericordia_count', 0);
        localStorage.setItem('misericordia_next_ask', nextAskMisericordia);
    } else if (currentDevotion === 'rosario') {
        completedCountRosario = 0;
        nextAskRosario = userGoalRosario;
        localStorage.setItem('rosario_count', 0);
        localStorage.setItem('rosario_next_ask', nextAskRosario);
    } else {
        completedCountNino = 0;
        nextAskNino = userGoalNino;
        localStorage.setItem('nino_count', 0);
        localStorage.setItem('nino_next_ask', nextAskNino);
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

window.resetDecenario = function() {
    currentStepIndex = 0;
    runCompleted = false;
    if (typeof renderRosary === 'function') renderRosary();
    updateUI();
}

window.showCompletion = function() {
    if(sangreAguaModal) sangreAguaModal.hide();
    if(completionModal) completionModal.show();
};

if(btnNextFloat) btnNextFloat.addEventListener('click', handleNext);
if(btnPrevFloat) btnPrevFloat.addEventListener('click', handlePrev);

window.addEventListener('resize', () => {
    if (typeof renderRosary === 'function') renderRosary();
    updateUI();
});