// ==============================================================================
// ARCHIVO: www/js/devocion_rosario.js
// ROL: Motor de secuencia y base de datos para el Santo Rosario
// ==============================================================================

// --- BASE DE DATOS DE LOS MISTERIOS DEL ROSARIO ---
const misteriosData = {
    gozosos: [
        { titulo: "La Encarnación del Hijo de Dios", lectura: "«Al sexto mes el ángel Gabriel fue enviado por Dios a una ciudad de Galilea, llamada Nazaret, a una virgen desposada con un hombre llamado José, de la estirpe de David; el nombre de la virgen era María» <strong>(Lc 1,26-27)</strong>." },
        { titulo: "La Visitación de Nuestra Señora a su prima Santa Isabel", lectura: "«En aquellos días María se puso en camino y fue aprisa a la región montañosa, a una ciudad de Judá; entró en casa de Zacarías y saludó a Isabel. Y sucedió que, en cuanto Isabel oyó el saludo de María, saltó de gozo el niño en su seno, e Isabel quedó llena de Espíritu Santo; y exclamando a voz en grito, dijo: \"Bendita tú entre las mujeres y bendito el fruto de tu seno\"» <strong>(Lc 1, 39-42)</strong>." },
        { titulo: "El Nacimiento del Hijo de Dios en el portal de Belén", lectura: "«Sucedió que por aquellos días salió un edicto de César Augusto ordenando que se empadronase todo el mundo. Este primer empadronamiento tuvo lugar siendo Cirino gobernador de Siria. Iban todos a empadronarse, cada uno a su ciudad. Subió también José desde Galilea, de la ciudad de Nazaret, a Judea, a la ciudad de David, que se llama Belén, por ser él de la casa y familia de David, para empadronarse con María, su esposa, que estaba encinta. Y sucedió que, mientras ellos estaban allí, se le cumplieron los días del alumbramiento, y dio a luz a su hijo primogénito, le envolvió en pañales y le acostó en un pesebre, porque no tenían sitio en el alojamiento» <strong>(Lc 2,1-7)</strong>." },
        { titulo: "La presentación de Jesús en el Templo", lectura: "«Cuando se cumplieron los ocho días para circuncidarle, se le dio el nombre de Jesús, como lo había llamado el ángel antes de ser concebido en el seno. Cuando se cumplieron los días de la purificación de ellos, según la Ley de Moisés, llevaron a Jesús a Jerusalén para presentarle al Señor, como está escrito en la Ley del Señor: Todo varón primogénito será consagrado al Señor y para ofrecer en sacrificio un par de tórtolas o dos pichones, conforme a lo que se dice en la Ley del Señor» <strong>(Lc 2, 21-24)</strong>." },
        { titulo: "El Niño Jesús perdido y hallado en el Templo", lectura: "«Sus padres iban todos los años a Jerusalén a la fiesta de la Pascua. Cuando tuvo doce años, subieron ellos como de costumbre a la fiesta y, al volverse, pasados los días, el niño Jesús se quedó en Jerusalén, sin saberlo sus padres... Y sucedió que al cabo de tres días, le encontraron en el Templo sentado en medio de los maestros, escuchándoles y preguntándoles; todos los que le oían, estaban estupefactos por su inteligencia y sus respuestas» <strong>(Lc 2, 41-47)</strong>." }
    ],
    dolorosos: [
        { titulo: "La Oración en el Huerto", lectura: "«Entonces Jesús fue con ellos a un huerto, llamado Getsemaní, y dijo a sus discípulos: \"Sentaos aquí mientras voy a orar\". Y tomando consigo a Pedro y a los dos hijos de Zebedeo, comenzó a sentir tristeza y angustia. Entonces les dijo: \"Mi alma está triste hasta el punto de morir; quedaos aquí y velad conmigo\". Y adelantándose un poco, cayó rostro en tierra, y suplicaba así: \"Padre mío, si es posible, que pase de mí esta copa, pero no sea como yo quiero, sino como quieras tú\"» <strong>(Mt 26, 36-39)</strong>." },
        { titulo: "La Flagelación", lectura: "«Pilato puso en libertad a Barrabás; y a Jesús, después de haberlo hecho azotar, lo entregó para que fuera crucificado» <strong>(Mt 27, 26)</strong>." },
        { titulo: "La Coronación de espinas", lectura: "«Entonces los soldados del procurador llevaron consigo a Jesús al pretorio y reunieron alrededor de él a toda la cohorte. Lo desnudaron y le echaron encima un manto de púrpura y, trenzando una corona de espinas, se la pusieron sobre la cabeza, y en su mano derecha una caña, y doblando la rodilla delante de él, le hacían burla diciendo: \"Salve, Rey de los judíos\"». <strong>(Mt 27, 27-29)</strong>." },
        { titulo: "Jesús con la Cruz a cuestas", lectura: "«Y obligaron a uno que pasaba, a Simón de Cirene, que volvía del campo, el padre de Alejandro y de Rufo, a que llevara su cruz. Lo condujeron al lugar del Gólgota, que quiere decir de la \"Calavera\"» <strong>(Mc 15, 21-22)</strong>." },
        { titulo: "La Crucifixión y Muerte", lectura: "«Llegados al lugar llamado \"La Calavera\", le crucificaron allí a él y a los dos malhechores, uno a la derecha y otro a la izquierda. Jesús decía: \"Padre, perdónales, porque no saben lo que hacen\"... Era ya eso de mediodía cuando, al eclipsarse el sol, hubo oscuridad sobre toda la tierra hasta la media tarde. El velo del Santuario se rasgó por medio y Jesús, dando un fuerte grito dijo: \"Padre, en tus manos pongo mi espíritu\" y, dicho esto, expiró» <strong>(Lc 23, 33-46)</strong>." }
    ],
    gloriosos: [
        { titulo: "La resurrección del Hijo de Dios", lectura: "«El primer día de la semana, muy de mañana, fueron al sepulcro llevando los aromas que habían preparado. Pero encontraron que la piedra había sido retirada del sepulcro, y entraron, pero no hallaron el cuerpo del Señor Jesús. No sabían qué pensar de esto, cuando se presentaron ante ellas dos hombres con vestidos resplandecientes. Ellas, despavoridas, miraban al suelo, y ellos les dijeron: \"¿Por qué buscáis entre los muertos al que está vivo? No está aquí, ha resucitado\"» <strong>(Lc 24, 1-6)</strong>." },
        { titulo: "La Ascensión del Señor al cielo", lectura: "«El Señor Jesús, después de hablarles, ascendió al cielo y se sentó a la derecha de Dios» <strong>(Mc 16, 19)</strong>." },
        { titulo: "La venida del Espíritu Santo", lectura: "«Al llegar el día de Pentecostés, estaban todos reunidos en un mismo lugar. De repente vino del cielo un ruido como el de una ráfaga de viento impetuoso, que llenó toda la casa en la que se encontraban. Se les aparecieron unas lenguas como de fuego que se repartieron y se posaron sobre cada uno de ellos; quedaron todos llenos del Espíritu Santo y se pusieron a hablar en otras lenguas, según el Espíritu les concedía expresarse» <strong>(Hch 2, 1-4)</strong>." },
        { titulo: "La Asunción de María al cielo", lectura: "«Todas las generaciones me llamarán bienaventurada porque el Señor ha hecho obras grandes en mí» <strong>(Lc 1, 48-49)</strong>." },
        { titulo: "La coronación de María como Reina y Señora de todo lo creado", lectura: "«Una gran señal apareció en el cielo: una mujer, vestida de sol, con la luna bajo sus pies, y una corona de doce estrellas sobre su cabeza» <strong>(Ap 12, 1)</strong>." }
    ],
    luminosos: [
        { titulo: "El Bautismo en el Jordán", lectura: "«Bautizado Jesús, salió luego del agua; y en esto se abrieron los cielos y vio al Espíritu de Dios que bajaba en forma de paloma y venía sobre él. Y una voz que salía de los cielos decía: \"Este es mi Hijo amado, en quien me complazco\"». <strong>(Mt 3,16-17)</strong>." },
        { titulo: "Las bodas de Caná", lectura: "«Tres días después se celebraba una boda en Caná de Galilea y estaba allí la madre de Jesús. Fue invitado también a la boda Jesús con sus discípulos. Y, como faltara vino, porque se había acabado el vino de la boda, le dice a Jesús su madre: \"No tienen vino\". Jesús le responde: \"¿Qué tengo yo contigo, mujer? Todavía no ha llegado mi hora\". Dice su madre a los sirvientes: \"Haced lo que él os diga\"». <strong>(Jn 2, 1-5)</strong>." },
        { titulo: "El anuncio del Reino de Dios", lectura: "«El tiempo se ha cumplido y el Reino de Dios está cerca; convertíos y creed en el Evangelio». <strong>(Mc 1, 15)</strong>." },
        { titulo: "La Transfiguración", lectura: "«Seis días después, Jesús tomó consigo a Pedro, a Santiago y a su hermano Juan, y los llevó aparte, a un monte alto. Y se transfiguró delante de ellos: su rostro se puso brillante como el sol y sus vestidos se volvieron blancos como la luz» <strong>(Mt 17, 1-2)</strong>." },
        { titulo: "La institución de la Eucaristía", lectura: "«Mientras estaban comiendo, tomó Jesús pan y lo bendijo, lo partió y, dándoselo a sus discípulos, dijo: \"Tomad, comed, éste es mi cuerpo\"» <strong>(Mt 26, 26)</strong>." }
    ]
};

window.getMisteriosHoy = function() {
    const day = new Date().getDay(); 
    if (day === 1 || day === 6) return { key: 'gozosos', title: 'Misterios Gozosos', list: misteriosData.gozosos };
    if (day === 2 || day === 5) return { key: 'dolorosos', title: 'Misterios Dolorosos', list: misteriosData.dolorosos };
    if (day === 4) return { key: 'luminosos', title: 'Misterios Luminosos', list: misteriosData.luminosos };
    return { key: 'gloriosos', title: 'Misterios Gloriosos', list: misteriosData.gloriosos }; 
};

window.generarPasosRosario = function() {
    let steps = [];
    const btnLeerHTML = '<br><br><span class="text-primary fw-bold" style="font-size: 1.1rem; cursor: pointer; text-decoration: underline;" data-bs-toggle="modal" data-bs-target="#fullPrayerModal">Leer <i class="bi bi-book-half text-dark"></i></span>';

    const selectorVal = document.getElementById('mysterySelector') ? document.getElementById('mysterySelector').value : 'auto';
    let misteriosActuales;

    if (selectorVal === 'auto' || !selectorVal) {
        misteriosActuales = window.getMisteriosHoy();
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
        
        steps.push({ 
            physicalId: 4, loopId: paso, title: `Misterio ${paso}: ${misteriosActuales.title}`, badge: `Misterio ${paso} de 5`, 
            text: `Meditamos:\n${misterioObj.titulo}.${btnLeerHTML}`, 
            fullText: `${misterioObj.lectura}\n\nOremos:\n${FULL_PADRE_NUESTRO}` 
        });
        for (let ave = 1; ave <= 10; ave++) {
            steps.push({ physicalId: 4 + ave, loopId: paso, title: `Ave María (${ave}/10)`, badge: `Misterio ${paso} de 5`, text: 'Dios te salve, María, llena eres de gracia, el Señor es contigo...', fullText: FULL_AVE_MARIA });
        }
    }
    
    steps.push({ physicalId: 4, loopId: 6, title: 'La Salve', badge: 'Cierre', text: 'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra...', fullText: FULL_SALVE });
    steps.push({ physicalId: 0, loopId: 7, title: 'Señal de la Cruz Final', badge: 'Despedida', text: 'Toca la cruz iluminada para terminar.\n\nEn el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.' });

    return steps;
};