// ==============================================================================
// ARCHIVO: www/js/devocion_nino.js
// ROL: Motor de secuencia para el Rezo del Niño Jesús
// ==============================================================================

window.generarPasosNino = function() {
    let steps = [];
    
    // TEXTO EXACTO DE ENLACE DE LECTURA REDUCIDO A TEXTO+ICONO
    const btnLeerHTML = '<br><br><span class="text-primary fw-bold" style="font-size: 1.1rem; cursor: pointer; text-decoration: underline;" data-bs-toggle="modal" data-bs-target="#fullPrayerModal">Leer <i class="bi bi-book-half text-dark"></i></span>';

    // 1. LA CRUZ
    steps.push({ physicalId: 0, loopId: 0, title: 'Oremos', badge: 'Inicio',
        text: 'En el nombre del Padre, y del Hijo y del Espíritu Santo. Amén.' + btnLeerHTML,
        fullText: '¡Oh Dios, que has instruido los corazones de tus fieles con la luz del Espíritu Santo!, concédenos que sintamos rectamente con el mismo Espíritu y gocemos siempre de su divino consuelo.\nPor Jesucristo Nuestro Señor.\nAmén.'
    });

    // 2. BOLITA 1
    steps.push({ physicalId: 1, loopId: 0, title: 'Acto de Contrición', badge: 'Inicio',
        text: 'Rezador: Ave María Purísima.<br>Responde: Sin pecado concebida.<br><br>Reconocemos ante el Señor nuestros pecados diciendo:' + btnLeerHTML,
        fullText: 'Yo confieso ante Dios Todopoderoso, y ante ustedes hermanos que he pecado mucho de pensamiento, palabra, obra y omisión.\nPor mi culpa, por mi culpa, por mi gran culpa.\nPor eso ruego a Santa María siempre Virgen, a los ángeles, a los santos y a ustedes hermanos, que intercedan por mí ante Dios, Nuestro Señor. Amén.'
    });

    // 3. BOLITA 2
    steps.push({ physicalId: 2, loopId: 0, title: 'Profesión de Fe', badge: 'Inicio',
        text: 'Somos cristianos, y como tales profesamos una fe única en la Santísima Trinidad. Por ello decimos...' + btnLeerHTML,
        fullText: 'Creo en Dios, Padre Todopoderoso, Creador del cielo y de la tierra.\nCreo en Jesucristo, su único Hijo, Nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso.\nDesde allí ha de venir a juzgar a vivos y muertos.\nCreo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.'
    });

    // 4. BOLITA 3
    steps.push({ physicalId: 3, loopId: 0, title: 'El Gloria y Evangelio', badge: 'Inicio',
        text: 'Cantar o Recitar el Himno del Gloria.' + btnLeerHTML,
        fullText: 'Gloria a Dios en el cielo, y en la tierra paz a los hombres que ama el Señor.\n\nPor tu inmensa gloria te alabamos, te bendecimos, te adoramos, te glorificamos, te damos gracias, Señor Dios, Rey celestial, Dios Padre todopoderoso Señor, Hijo único, Jesucristo.\nSeñor Dios, Cordero de Dios, Hijo del Padre; tú que quitas el pecado del mundo, ten piedad de nosotros; tú que quitas el pecado del mundo, atiende nuestra súplica; tú que estás sentado a la derecha del Padre, ten piedad de nosotros; porque sólo tú eres Santo, sólo tú Señor, sólo tú Altísimo, Jesucristo, con el Espíritu Santo en la gloria de Dios Padre. Amén.\n\nEvangelio de San Lucas 2, 15-20.\nCuando los ángeles los dejaron para volver al cielo, los pastores se dijeron unos a otros: “Vayamos hasta Belén, para ver eso que el Señor nos ha anunciado”.\nSe fueron, pues, a toda prisa y encontraron a María, a José y al niño, recostado en el pesebre. Después de verlo, contaron lo que se les había dicho de aquel niño, y cuantos los oían quedaban maravillados.\nMaría, por su parte, guardaba todas estas cosas y las meditaba en su corazón. Los pastores se volvieron a sus campos, alabando y glorificando a Dios por todo cuanto habían visto y oído, según lo que se les había anunciado. Palabra del Señor. Gloria a ti, Señor Jesús.\n\nComentario sobre el Evangelio.\n\nOfrecimiento del Santo Rosario\nSantísima Trinidad, te ofrezco este Santo Rosario para honra tuya, para el bien de las almas, por los cristianos perseguidos, los moribundos y todos aquellos que necesitan consuelo en estos momentos. Además, pongo ante tus manos providentes las intenciones de esta familia…'
    });

    // 5. LOS MISTERIOS GOZOSOS
    const misteriosNino = [
        { t: "Primer Misterio Gozoso: La Encarnación del Hijo de Dios", c: "«Al sexto mes el ángel Gabriel fue enviado por Dios a una ciudad de Galilea, llamada Nazaret, a una virgen desposada con un hombre llamado José, de la estirpe de David; el nombre de la virgen era María»\n(Lc 1,26-27)." },
        { t: "Segundo Misterio Gozoso: La Visitación de Nuestra Señora a su prima Santa Isabel", c: "«En aquellos días María se puso en camino y fue aprisa a la región montañosa, a una ciudad de Judá; entró en casa de Zacarías y saludó a Isabel. Y sucedió que, en cuanto Isabel oyó el saludo de María, saltó de gozo el niño en su seno, e Isabel quedó llena de Espíritu Santo; y exclamando a voz en grito, dijo: “Bendita tú entre las mujeres y bendito el fruto de tu seno”»\n(Lc 1, 39-42)" },
        { t: "Tercer Misterio Gozoso: El Nacimiento del Hijo de Dios en el portal de Belén", c: "«Sucedió que por aquellos días salió un edicto de César Augusto ordenando que se empadronase todo el mundo. Este primer empadronamiento tuvo lugar siendo Cirino gobernador de Siria. Iban todos a empadronarse, cada uno a su ciudad. Subió también José desde Galilea, de la ciudad de Nazaret, a Judea, a la ciudad de David, que se llama Belén, por ser él de la casa y familia de David, para empadronarse con María, su esposa, que estaba encinta. Y sucedió que, mientras ellos estaban allí, se le cumplieron los días del alumbramiento, y dio a luz a su hijo primogénito, le envolvió en pañales y le acostó en un pesebre, porque no tenían sitio en el alojamiento»\n(Lc 2,1-7)." },
        { t: "Cuarto Misterio Gozoso: La presentación de Jesús en el Templo", c: "«Cuando se cumplieron los ocho días para circuncidarle, se le dio el nombre de Jesús, como lo había llamado el ángel antes de ser concebido en el seno. Cuando se cumplieron los días de la purificación de ellos, según la Ley de Moisés, llevaron a Jesús a Jerusalén para presentarle al Señor, como está escrito en la Ley del Señor: Todo varón primogénito será consagrado al Señor y para ofrecer en sacrificio un par de tórtolas o dos pichones, conforme a lo que se dice en la Ley del Señor»\n(Lc 2, 21-24)." },
        { t: "Quinto Misterio Gozoso: El Niño Jesús perdido y hallado en el Templo", c: "«Sus padres iban todos los años a Jerusalén a la fiesta de la Pascua. Cuando tuvo doce años, subieron ellos como de costumbre a la fiesta y, al volverse, pasados los días, el niño Jesús se quedó en Jerusalén, sin saberlo sus padres… Y sucedió que, al cabo de tres días, le encontraron en el Templo sentado en medio de los maestros, escuchándolos y preguntándoles; todos los que le oían, estaban estupefactos por su inteligencia y sus respuestas»\n(Lc 2, 41-47)" }
    ];

    for (let i = 0; i < 5; i++) {
        steps.push({ physicalId: 4, loopId: i+1, title: `Misterio ${i+1}`, badge: `Misterio ${i+1} de 5`,
            text: `Gloria al Padre.<br><br>Rezador: Niñito Jesús que naciste en Belén.<br>Responde: Bendice este hogar y a nosotros también.<br><br>Misterio ${i+1}<br><br><strong>${misteriosNino[i].t}</strong>` + btnLeerHTML,
            fullText: `${misteriosNino[i].c}\n\nOramos:\n${FULL_PADRE_NUESTRO}`
        });
        for (let ave = 1; ave <= 10; ave++) {
            steps.push({ physicalId: 4 + ave, loopId: i+1, title: `Ave María (${ave}/10)`, badge: `Misterio ${i+1} de 5`,
                text: `Ave María (${ave}/10)<br><br>Dios te salve María llena eres de Gracia....` + btnLeerHTML,
                fullText: FULL_AVE_MARIA
            });
        }
    }

    // 6. CIERRES Y CANTOS
    for (let j = 1; j <= 3; j++) {
        steps.push({ physicalId: 4 - j, loopId: 6, title: `Dios te Salve (${j}/3)`, badge: 'Cierre',
            text: 'Dios Te Salve María llena eres de Gracia...' + btnLeerHTML,
            fullText: `Oremos......\n${FULL_PADRE_NUESTRO}\n\nRezador: Gloria al Padre, al Hijo y al Espíritu Santo.\nResponde: Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.`
        });
    }

    steps.push({ physicalId: 4, loopId: 7, title: 'La Salve', badge: 'Cierre',
        text: 'Salve' + btnLeerHTML,
        fullText: `Gracias te damos Soberana Princesa por los favores que recibimos de sus santísimas manos. Para alabar tu intercesión en este momento te homenajeamos con esta Salve.\n\n${FULL_SALVE}\n\nRezador: Ruega por nosotros, Santa Madre de Dios,\nResponde: para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.`
    });

    steps.push({ physicalId: 0, loopId: 8, title: 'Letanías de la Virgen', badge: 'Cierre',
        text: 'LETANÍAS DE LA VIRGEN' + btnLeerHTML,
        fullText: 'Señor, ten piedad\nCristo, ten piedad\nSeñor, ten piedad.\nCristo, óyenos.\nCristo, escúchanos.\nDios, Padre celestial, ten piedad de nosotros.\nDios, Hijo, Redentor del mundo,\nDios, Espíritu Santo,\nSantísima Trinidad, un solo Dios,\n\nSanta María, ruega por nosotros.\nSanta Madre de Dios,\nSanta Virgen de las Vírgenes,\nMadre de Cristo,\nMadre de la Iglesia,\nMadre de la misericordia,\nMadre de la divina gracia,\nMadre de la esperanza,\nMadre purísima,\nMadre castísima,\nMadre siempre virgen,\nMadre inmaculada,\nMadre amable,\nMadre admirable,\nMadre del buen consejo,\nMadre del Creador,\nMadre del Salvador,\nVirgen prudentísima,\nVirgen digna de veneración,\nVirgen digna de alabanza,\nVirgen poderosa,\nVirgen clemente,\nVirgen fiel,\nEspejo de justicia,\nTrono de la sabiduría,\nCausa de nuestra alegría,\nVaso espiritual,\nVaso digno de honor,\nVaso de insigne devoción,\nRosa mística,\nTorre de David,\nTorre de marfil,\nCasa de oro,\nArca de la Alianza,\nPuerta del cielo,\nEstrella de la mañana,\nSalud de los enfermos,\nRefugio de los pecadores,\nConsuelo de los migrantes,\nConsoladora de los afligidos,\nAuxilio de los cristianos,\nReina de los Ángeles,\nReina de los Patriarcas,\nReina de los Profetas,\nReina de los Apóstoles,\nReina de los Mártires,\nReina de los Confesores,\nReina de las Vírgenes,\nReina de todos los Santos,\nReina concebida sin pecado original,\nReina asunta a los Cielos,\nReina del Santísimo Rosario,\nReina de la familia,\nReina de la paz.\n\nCordero de Dios, que quitas el pecado del mundo, perdónanos, Señor.\nCordero de Dios, que quitas el pecado del mundo, escúchanos, Señor.\nCordero de Dios, que quitas el pecado del mundo, ten misericordia de nosotros.\n\nRezador: Ruega por nosotros, Santa Madre de Dios,\nResponde: para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.'
    });

    steps.push({ physicalId: 0, loopId: 9, title: 'Canto Final', badge: 'Cierre',
        text: 'Si hay coro o musica pueden cantar el alabado sino omitir pasando con el botón' + btnLeerHTML,
        fullText: 'Alabado del Niño\nNACISTE NIÑO EN BELÉN\npara remedio y consuelo. (2)\nPor pañales unas pajas\ny por cuna el duro suelo. (2)\nTitiritando de frío\nel supremo rey del cielo. (2)\nQue ha nacido por librarnos\ndel enemigo infernal. (2)\nPara librar a los hombres\ndel eterno cautiverio. (2)\nLos tres reyes del Oriente\nvinieron en compañía. (2)\nY guiados por una estrella\nque al mundo resplandecía. (2)\nEl uno le ofrece incienso\ncomo su rey celestial. (2)\nEl otro, como le ofrece,\nel oro rico metal. (2)\nY el otro le ofrece mirra\ncomo al hombre mortal. (2)\nOfrezcámosle nosotros\nnuestro corazón filial. (2)\nOh, dulcísima María,\nalumbrad mi entendimiento. (2)\nPara alabar al Señor\nen su santo nacimiento. (2)\nAlabado sea el Santísimo\nSacramento del altar. (6)\n\nAlabado el dulce Nombre\nde Jesús en el portal. (2)\nY María que es concebida\nsin pecado original. (2)\nAlabemos a la reina\nde la corte celestial. (2)\nAve María, gracia plena,\nsalve Dios este lugar. (2)\nJesús, María y José\nnos libren de todo mal. (2)\nGloria al Padre, gloria al Hijo,\ngloria al Espíritu Santo. (2)\nY Dios por todos los siglos\ny de los siglos, amén. (2)'
    });

    steps.push({ physicalId: 0, loopId: 10, title: 'Oración Final', badge: 'Despedida',
        text: 'ORACIÓN FINAL' + btnLeerHTML,
        fullText: 'Te rogamos nos concedas, Señor Dios nuestro, gozar de continua salud de alma y cuerpo, y por la gloriosa intercesión de la bienaventurada siempre Virgen María, vernos libres de las tristezas de la vida presente y disfrutar de las alegrías eternas. Por Cristo nuestro Señor. Amén.\n\nRezador: Ruega por nosotros, Santa Madre de Dios,\nResponde: para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.'
    });

    steps.push({ physicalId: 0, loopId: 11, title: 'Despedida', badge: 'Despedida',
        text: 'Toca la cruz y sale:<br><br>En el nombre del Padre, del Hijo y del Espíritu Santo. Amén.'
    });

    return steps;
};