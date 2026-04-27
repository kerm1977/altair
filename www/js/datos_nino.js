// ==============================================================================
// ARCHIVO: www/js/datos_nino.js
// ROL: Estructura de datos interactiva COMPLETA para el Rosario del Niño Jesús
// ==============================================================================

const TEXTO_PADRE_NUESTRO = "Padre nuestro que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.";
const TEXTO_AVE_MARIA = "Dios te salve, María, llena eres de gracia, el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.";
const TEXTO_GLORIA = "Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.";
const TEXTO_JACULATORIA = "V// Niñito Jesús que naciste en Belén.\nR// Bendice esta casa y a nosotros también.";

function construirMisterioNino(titulo, cita) {
    let pasos = [];
    pasos.push({ titulo: titulo, texto: cita });
    pasos.push({ titulo: "Padre Nuestro", texto: TEXTO_PADRE_NUESTRO });
    for(let i = 1; i <= 10; i++) {
        pasos.push({ titulo: `Ave María (${i}/10)`, texto: TEXTO_AVE_MARIA });
    }
    pasos.push({ titulo: "Gloria", texto: TEXTO_GLORIA });
    pasos.push({ titulo: "Jaculatoria", texto: TEXTO_JACULATORIA });
    return pasos;
}

const PASOS_ROSARIO_NINO = [
    // --- RITOS INICIALES ---
    {
        titulo: "Ritos Iniciales",
        texto: "En el nombre del Padre, y del Hijo y del Espíritu Santo. Amén.\n\n¡Oh Dios, que has instruido los corazones de tus fieles con la luz del Espíritu Santo!, concédenos que sintamos rectamente con el mismo Espíritu y gocemos siempre de su divino consuelo.\n\nPor Jesucristo Nuestro Señor. Amén.\n\nV// Ave María Purísima.\nR// Sin pecado concebida."
    },
    {
        titulo: "Acto de Contrición",
        texto: "Reconocemos ante el Señor nuestros pecados diciendo:\n\nYo confieso ante Dios Todopoderoso, y ante ustedes hermanos que he pecado mucho de pensamiento, palabra, obra y omisión. Por mi culpa, por mi culpa, por mi gran culpa. Por eso ruego a Santa María siempre Virgen, a los ángeles, a los santos y a ustedes hermanos, que intercedan por mí ante Dios, Nuestro Señor. Amén."
    },
    {
        titulo: "La Kalenda de Navidad",
        texto: "Escuchemos con gozo, la Kalenda de Navidad, un himno antiguo que resume en la noche de Navidad, la historia de nuestra salvación.\n\nOs anuncio una nueva de gozo:\nHabían pasado millones de años después la creación, cuando en un principio creó Dios el cielo y la tierra;\ny miles de años después del diluvio;\nhacia el año 2015 después del nacimiento de Abrahán, hacia el año 1510 después de Moisés y de la salida del pueblo israelita de Egipto; hacia el año 1032 después de la unción de David, en la semana 65 según la profecía de Daniel.\n\nEn la olimpiada 194, en el año 752 de la fundación de Roma, en el año 42 del imperio de Octavio Augusto; con todo el orbe pacificado, Hace ahora 202 años: JESÚCRISTO, HIJO DEL PADRE, DEL DIOS ETERNO, queriendo santificar el mundo con su venida, concebido por obra del Espíritu Santo, y pasado los nueve meses de la concepción, nació en Belén de Judá de la Virgen María, hecho hombre."
    },
    {
        titulo: "Profesión de Fe (Credo)",
        texto: "Somos cristianos, y como tales profesamos una fe única en la Santísima Trinidad. Por ello decimos.\n\nCreo en Dios, Padre Todopoderoso, Creador del cielo y de la tierra.\n\nCreo en Jesucristo, su único Hijo, Nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso.\n\nDesde allí ha de venir a juzgar a vivos y muertos.\n\nCreo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén."
    },
    {
        titulo: "Himno del Gloria",
        texto: "Con todos los santos del Cielo, con todos los coros celestiales, juntos hacemos el Himno del Gloria.\n\nGloria a Dios en el cielo, y en la tierra paz a los hombres que ama el Señor.\n\nPor tu inmensa gloria te alabamos, te bendecimos, te adoramos, te glorificamos, te damos gracias, Señor Dios, Rey celestial, Dios Padre todopoderoso Señor, Hijo único, Jesucristo.\n\nSeñor Dios, Cordero de Dios, Hijo del Padre; tú que quitas el pecado del mundo, ten piedad de nosotros tú que quitas el pecado del mundo, atiende nuestra súplica; tú que estás sentado a la derecha del Padre, ten piedad de nosotros; porque sólo tú eres Santo, sólo tú Señor, sólo tú Altísimo, Jesucristo, con el Espíritu Santo en la gloria de Dios Padre.\nAmén."
    },
    {
        titulo: "Evangelio (San Lucas 2, 15-20)",
        texto: "Escuchemos atentos el texto del Evangelio de San Lucas 2, 15-20.\n\nCuando los ángeles los dejaron para volver al cielo, los pastores se dijeron unos a otros: \"Vayamos hasta Belén, para ver eso que el Señor nos ha anunciado\".\n\nSe fueron, pues, a toda prisa y encontraron a María, a José y al niño, recostado en el pesebre. Después de verlo, contaron lo que se les había dicho de aquel niño, y cuantos los oían quedaban maravillados.\n\nMaría, por su parte, guardaba todas estas cosas y las meditaba en su corazón. Los pastores se volvieron a sus campos, alabando y glorificando a Dios por todo cuanto habían visto y oído, según lo que se les había anunciado. Palabra del Señor. Gloria a ti, Señor Jesús."
    },
    {
        titulo: "Ofrecimiento del Santo Rosario",
        texto: "Santísima Trinidad, te ofrezco este Santo Rosario para honra tuya, para el bien de las almas, por los cristianos perseguidos, los moribundos y todos aquellos que necesitan consuelo en estos momentos. Además, pongo ante tus manos providentes las intenciones de esta familia..."
    },
    
    // --- LOS 5 MISTERIOS GENERADOS DINÁMICAMENTE ---
    ...construirMisterioNino("PRIMER MISTERIO GOZOSO: LA ENCARNACIÓN DEL HIJO DE DIOS", "«Al sexto mes el ángel Gabriel fue enviado por Dios a una ciudad de Galilea, llamada Nazaret, a una virgen desposada con un hombre llamado José, de la estirpe de David; el nombre de la virgen era María»\n(Lc 1,26-27)."),
    ...construirMisterioNino("SEGUNDO MISTERIO GOZOSO: LA VISITACIÓN DE NUESTRA SEÑORA A SU PRIMA SANTA ISABEL", "«En aquellos días María se puso en camino y fue aprisa a la región montañosa, a una ciudad de Judá; entró en casa de Zacarías y saludó a Isabel. Y sucedió que, en cuanto Isabel oyó el saludo de María, saltó de gozo el niño en su seno, e Isabel quedó llena de Espíritu Santo; y exclamando a voz en grito, dijo: \"Bendita tú entre las mujeres y bendito el fruto de tu seno\"»\n(Lc 1, 39-42)"),
    ...construirMisterioNino("TERCER MISTERIO GOZOSO: EL NACIMIENTO DEL HIJO DE DIOS EN EL PORTAL DE BELÉN", "«Sucedió que por aquellos días salió un edicto de César Augusto ordenando que se empadronase todo el mundo. Este primer empadronamiento tuvo lugar siendo Cirino gobernador de Siria. Iban todos a empadronarse, cada uno a su ciudad. Subió también José desde Galilea, de la ciudad de Nazaret, a Judea, a la ciudad de David, que se llama Belén, por ser él de la casa y familia de David, para empadronarse con María, su esposa, que estaba encinta. Y sucedió que, mientras ellos estaban allí, se le cumplieron los días del alumbramiento, y dio a luz a su hijo primogénito, le envolvió en pañales y le acostó en un pesebre, porque no tenían sitio en el alojamiento»\n(Lc 2,1-7)."),
    ...construirMisterioNino("CUARTO MISTERIO GOZOSO: LA PRESENTACIÓN DE JESÚS EN EL TEMPLO", "«Cuando se cumplieron los ocho días para circuncidarle, se le dio el nombre de Jesús, como lo había llamado el ángel antes de ser concebido en el seno. Cuando se cumplieron los días de la purificación de ellos, según la Ley de Moisés, llevaron a Jesús a Jerusalén para presentarle al Señor, como está escrito en la Ley del Señor: Todo varón primogénito será consagrado al Señor y para ofrecer en sacrificio un par de tórtolas o dos pichones, conforme a lo que se dice en la Ley del Señor»\n(Lc 2, 21-24)."),
    ...construirMisterioNino("QUINTO MISTERIO GOZOSO: EL NIÑO JESÚS PERDIDO Y HALLADO EN EL TEMPLO", "«Sus padres iban todos los años a Jerusalén a la fiesta de la Pascua. Cuando tuvo doce años, subieron ellos como de costumbre a la fiesta y, al volverse, pasados los días, el niño Jesús se quedó en Jerusalén, sin saberlo sus padres... Y sucedió que, al cabo de tres días, le encontraron en el Templo sentado en medio de los maestros, escuchándolos y preguntándoles; todos los que le oían, estaban estupefactos por su inteligencia y sus respuestas»\n(Lc 2, 41-47)"),

    // --- TRES AVEMARÍAS CANTADAS ---
    {
        titulo: "Tres Avemarías (Canto 1/3)",
        texto: "A adorar al Niño,\ncorramos pastores,\nque está en el Portal,\nllevémosle flores (bis).\n\n" + TEXTO_AVE_MARIA
    },
    {
        titulo: "Tres Avemarías (Canto 2/3)",
        texto: "Una palomita\nanunció a María,\nQue en su seno santo\nél encarnaría.\nQue está en el portal,\nllevémosle flores (bis).\n\n" + TEXTO_AVE_MARIA
    },
    {
        titulo: "Tres Avemarías (Canto 3/3)",
        texto: "Alabo el misterio\nde la Trinidad,\nQue son tres personas\ny es un Dios no más.\nQue está en el portal,\nllevémosle flores (bis).\n\n" + TEXTO_AVE_MARIA
    },
    {
        titulo: "Gloria al Padre",
        texto: "V// Gloria al Padre, al Hijo y al Espíritu Santo.\n\nR// Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén."
    },
    
    // --- SALVE ---
    {
        titulo: "La Salve",
        texto: "Gracias te damos Soberana Princesa por los favores que recibimos de sus santísimas manos. Para alabar tu intercesión en este momento te homenajeamos con esta Salve.\n\nDios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra.\n\nDios te salve. A Ti clamamos los desterrados hijos de Eva, a Ti suspiramos, gimiendo y llorando en este valle de lágrimas.\n\nEa, pues, Señora Abogada Nuestra, vuelve a nosotros tus ojos misericordiosos, y después de este destierro, muéstranos a Jesús, fruto bendito de tu vientre. Oh, clemente, oh piadosa, oh dulce Virgen María.\n\nV// Ruega por nosotros, Santa Madre de Dios,\n\nR// para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén"
    },

    // --- LETANÍAS COMPLETAS ---
    {
        titulo: "Letanías de la Virgen (Peticiones)",
        texto: "Señor, ten piedad.\nCristo, ten piedad.\nSeñor, ten piedad.\nCristo, óyenos.\nCristo, escúchanos.\n\nDios, Padre celestial, ten piedad de nosotros.\nDios, Hijo, Redentor del mundo, ten piedad de nosotros.\nDios, Espíritu Santo, ten piedad de nosotros.\nSantísima Trinidad, un solo Dios, ten piedad de nosotros."
    },
    {
        titulo: "Letanías de la Virgen (Invocaciones)",
        texto: "Santa María, ruega por nosotros.\nSanta Madre de Dios,\nSanta Virgen de las Vírgenes,\nMadre de Cristo,\nMadre de la Iglesia,\nMadre de la misericordia,\nMadre de la divina gracia,\nMadre de la esperanza,\nMadre purísima,\nMadre castísima,\nMadre siempre virgen,\nMadre inmaculada,\nMadre amable,\nMadre admirable,\nMadre del buen consejo,\nMadre del Creador,\nMadre del Salvador,\nVirgen prudentísima,\nVirgen digna de veneración,\nVirgen digna de alabanza,\nVirgen poderosa,\nVirgen clemente,\nVirgen fiel,\nEspejo de justicia,\nTrono de la sabiduría,\nCausa de nuestra alegría,\nVaso espiritual,\nVaso digno de honor,\nVaso de insigne devoción,\nRosa mística,\nTorre de David,\nTorre de marfil,\nCasa de oro,\nArca de la Alianza,\nPuerta del cielo,\nEstrella de la mañana,\nSalud de los enfermos,\nRefugio de los pecadores,\nConsuelo de los migrantes,\nConsoladora de los afligidos,\nAuxilio de los cristianos,\nReina de los Ángeles,\nReina de los Patriarcas,\nReina de los Profetas,\nReina de los Apóstoles,\nReina de los Mártires,\nReina de los Confesores,\nReina de las Vírgenes,\nReina de todos los Santos,\nReina concebida sin pecado original,\nReina asunta a los Cielos,\nReina del Santísimo Rosario,\nReina de la familia,\nReina de la paz."
    },
    {
        titulo: "Letanías de la Virgen (Cierre)",
        texto: "Cordero de Dios, que quitas el pecado del mundo, perdónanos, Señor.\nCordero de Dios, que quitas el pecado del mundo, escúchanos, Señor.\nCordero de Dios, que quitas el pecado del mundo, ten misericordia de nosotros.\n\nV// Ruega por nosotros, Santa Madre de Dios,\nR// para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén"
    },

    // --- CANTOS Y ORACIÓN FINAL ---
    {
        titulo: "Canto: Naciste Niño en Belén",
        texto: "NACISTE NIÑO EN BELÉN\npara remedio y consuelo. (2)\n\nPor pañales unas pajas\ny por cuna el duro suelo. (2)\n\nTitiritando de frío\nel supremo rey del cielo. (2)\n\nQue ha nacido por librarnos\ndel enemigo infernal. (2)\n\nPara librar a los hombres\ndel eterno cautiverio. (2)\n\nLos tres reyes del Oriente\nvinieron en compañía. (2)\n\nY guiados por una estrella\nque al mundo resplandecía. (2)\n\nEl uno le ofrece incienso\ncomo su rey celestial. (2)\n\nEl otro, como le ofrece,\nel oro rico metal. (2)\n\nY el otro le ofrece mirra\ncomo al hombre mortal. (2)\n\nOfrezcámosle nosotros\nnuestro corazón filial. (2)\n\nOh, dulcísima María,\nalumbrad mi entendimiento. (2)\n\nPara alabar al Señor\nen su santo nacimiento. (2)\n\nAlabado sea el Santísimo\nSacramento del altar. (6)"
    },
    {
        titulo: "Canto: Alabado del Niño",
        texto: "ALABADO DEL NIÑO\n\nAlabado el dulce Nombre\nde Jesús en el portal. (2)\n\nY María que es concebida\nsin pecado original. (2)\n\nAlabemos a la reina\nde la corte celestial. (2)\n\nAve María, gracia plena,\nsalve Dios este lugar. (2)\n\nJesús, María y José\nnos libren de todo mal. (2)\n\nGloria al Padre, gloria al Hijo,\ngloria al Espíritu Santo. (2)\n\nY Dios por todos los siglos\ny de los siglos, amén. (2)"
    },
    {
        titulo: "Oración Final",
        texto: "ORACIÓN\n\nTe rogamos nos concedas, Señor Dios nuestro, gozar de continua salud de alma y cuerpo, y por la gloriosa intercesión de la bienaventurada siempre Virgen María, vernos libres de las tristezas de la vida presente y disfrutar de las alegrías eternas. Por Cristo nuestro Señor. Amén.\n\nV// Ruega por nosotros, Santa Madre de Dios,\nR// para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén\n\nEn el nombre del Padre, del Hijo y del Espíritu Santo. Amén."
    }
];

// Exportamos los datos globalmente para que index.js pueda cargarlos
window.PASOS_ROSARIO_NINO = PASOS_ROSARIO_NINO;