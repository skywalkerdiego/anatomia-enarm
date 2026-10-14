// Cards for the structures added in the complete body: nerves, the vessels of the limbs and the
// brain, muscles, female anatomy, glands and lymph nodes.
const q = (question, right, wrong, why) => ({ q: question, a: [right, ...wrong], ok: 0, why });

export const EXTRA = {
  "pared-abdominal": {
    name: "Pared abdominal y conducto inguinal",
    level: "Ligamento inguinal: de la espina ilíaca anterosuperior al tubérculo del pubis",
    sections: [
      ["Anatomía", ["Recto abdominal en su vaina; oblicuos externo e interno y transverso por fuera. La línea alba une las vainas en la línea media.", "Triángulo de Hesselbach: borde del recto, vasos epigástricos inferiores y ligamento inguinal."]],
      ["Correlación clínica ENARM", ["Hernia inguinal indirecta: sale lateral a los vasos epigástricos, por el anillo profundo; es la más frecuente en ambos sexos y en niños (conducto peritoneovaginal permeable).", "Hernia directa: medial a los vasos epigástricos, por el triángulo de Hesselbach; debilidad de la pared en el adulto mayor.", "Hernia femoral: bajo el ligamento inguinal, medial a la vena femoral; más frecuente en mujeres y la que más se estrangula.", "Hernia estrangulada: dolor, irreductible, datos de oclusión: cirugía urgente."]],
    ],
    pearl: "Indirecta = lateral a los vasos epigástricos. Directa = medial, por el triángulo de Hesselbach.",
    quiz: [q("Hernia que protruye medial a los vasos epigástricos inferiores:", "Inguinal directa", ["Inguinal indirecta", "Femoral", "Umbilical"], "Atraviesa el triángulo de Hesselbach por debilidad de la fascia transversalis."), q("Hernia de la región inguinal con mayor riesgo de estrangulación:", "Femoral", ["Inguinal directa", "Inguinal indirecta", "Epigástrica"], "El anillo femoral es estrecho y rígido; predomina en mujeres.")],
  },
  cara: {
    name: "Músculos de la cara y nervio facial",
    level: "Músculos de la expresión: VII par · masticadores: V3",
    sections: [
      ["Anatomía", ["Músculos de la expresión (orbicular de los ojos y de la boca, frontal, cigomáticos, buccinador, platisma): nervio facial.", "Músculos de la masticación (masetero, temporal, pterigoideos): rama mandibular del trigémino."]],
      ["Correlación clínica ENARM", ["Parálisis facial periférica (Bell): afecta toda la hemicara, incluida la frente; prednisona en las primeras 72 h.", "Parálisis facial central (EVC): respeta la frente porque la parte superior del núcleo recibe corteza de ambos lados.", "Ramsay Hunt: parálisis facial con vesículas en el conducto auditivo; aciclovir o valaciclovir más esteroide."]],
    ],
    pearl: "Si la frente se arruga, la lesión es central.",
    quiz: [q("Parálisis facial derecha que respeta la frente, con hemiparesia derecha:", "Lesión central del hemisferio izquierdo", ["Parálisis de Bell derecha", "Lesión del nervio facial derecho en el foramen estilomastoideo", "Síndrome de Ramsay Hunt"], "La porción superior del núcleo facial recibe fibras de ambos hemisferios.")],
  },
  "suelo-pelvico": {
    name: "Suelo pélvico",
    level: "Elevador del ano: pubococcígeo, puborrectal e iliococcígeo",
    sections: [
      ["Anatomía", ["El diafragma pélvico (elevador del ano y coccígeo) sostiene vejiga, útero y recto; lo inerva el pudendo y ramas de S3–S4.", "El puborrectal forma un cabestrillo alrededor del recto: el ángulo anorrectal mantiene la continencia."]],
      ["Correlación clínica ENARM", ["Incontinencia de esfuerzo: pérdida con la tos; hipermovilidad uretral tras partos vaginales; ejercicios de Kegel y cinta suburetral.", "Incontinencia de urgencia: hiperactividad del detrusor; antimuscarínicos o mirabegrón.", "Prolapso de órganos pélvicos: cistocele, rectocele, histerocele; clasificación POP-Q.", "Desgarros perineales de tercer y cuarto grado: afectan el esfínter anal; reparación inmediata."]],
    ],
    pearl: "Esfuerzo = sale con la tos. Urgencia = no llega al baño.",
    quiz: [q("Multípara de 52 años que pierde orina al toser y estornudar, sin urgencia:", "Incontinencia urinaria de esfuerzo", ["Incontinencia de urgencia", "Incontinencia por rebosamiento", "Fístula vesicovaginal"], "Se debe a la falta de soporte uretral; primero rehabilitación del suelo pélvico.")],
  },
  espalda: {
    name: "Músculos de la espalda",
    level: "Trapecio y dorsal ancho por fuera · erectores de la columna por dentro",
    sections: [
      ["Anatomía", ["Trapecio: nervio accesorio (XI); eleva y retrae la escápula. Dorsal ancho: nervio toracodorsal; extiende y rota hacia dentro el brazo.", "Erectores de la columna (iliocostal, longísimo, espinoso) y transversoespinosos mantienen la postura."]],
      ["Correlación clínica ENARM", ["Lumbalgia mecánica aguda: sin datos de alarma no requiere imagen; analgesia y mantenerse activo.", "Datos de alarma: fiebre, pérdida de peso, cáncer previo, déficit neurológico, retención urinaria o anestesia en silla de montar, trauma, edad mayor de 50 años.", "Lesión del nervio accesorio (cirugía del triángulo posterior del cuello): hombro caído y dificultad para elevar el brazo por encima de la cabeza."]],
    ],
    pearl: "Lumbalgia sin banderas rojas: no pidas imagen en las primeras 6 semanas.",
    quiz: [q("Lumbalgia de 5 días tras cargar peso, sin fiebre ni déficit neurológico. Conducta:", "Analgesia, mantenerse activo y vigilar; sin imagen", ["Resonancia magnética de inmediato", "Reposo absoluto por dos semanas", "Radiografía y tomografía"], "La mayoría se resuelve en semanas; la imagen se reserva para datos de alarma.")],
  },
  "pared-toracica": {
    name: "Pared torácica, pectorales y paquete intercostal",
    level: "Paquete intercostal: vena, arteria y nervio en el borde inferior de cada costilla",
    sections: [
      ["Anatomía", ["Pectoral mayor (nervios pectorales lateral y medial), pectoral menor y serrato anterior (nervio torácico largo).", "Arteria mamaria interna a 1–2 cm del borde esternal; es el injerto de elección en la revascularización coronaria.", "Intercostales externos (inspiración), internos e íntimos (espiración forzada)."]],
      ["Correlación clínica ENARM", ["Lesión del nervio torácico largo (mastectomía, disección axilar): escápula alada.", "Herpes zóster: dolor y vesículas siguiendo un dermatoma intercostal sin cruzar la línea media.", "Bloqueo intercostal y toracocentesis: siempre por el borde superior de la costilla."]],
    ],
    pearl: "Disección axilar + escápula alada = nervio torácico largo.",
    quiz: [q("Tras una disección axilar, la paciente presenta escápula alada. Nervio lesionado:", "Torácico largo", ["Toracodorsal", "Axilar", "Supraescapular"], "Inerva el serrato anterior, que fija la escápula a la pared torácica.")],
  },
  utero: {
    name: "Útero, cuello uterino y vagina",
    level: "Entre la vejiga y el recto · anteversoflexión",
    sections: [
      ["Anatomía", ["Fondo, cuerpo, istmo y cuello. Mide unos 7.5 × 5 × 2.5 cm en la mujer adulta; endometrio, miometrio y perimetrio.", "Arteria uterina (rama de la ilíaca interna): cruza por encima del uréter a 1.5–2 cm del cuello, «el agua pasa bajo el puente».", "Fondo de saco de Douglas (rectouterino): el punto más declive del peritoneo en la mujer."]],
      ["Correlación clínica ENARM", ["Miomatosis: tumor benigno más frecuente del útero; sangrado uterino anormal y anemia.", "Cáncer cervicouterino: VPH 16 y 18; tamizaje con citología o prueba de VPH; zona de transformación.", "Cáncer de endometrio: sangrado posmenopáusico; obesidad y estrógenos sin oposición; biopsia endometrial.", "Hemorragia posparto: atonía uterina la primera causa; masaje uterino y oxitocina."]],
    ],
    pearl: "El uréter pasa bajo la arteria uterina: es el riesgo de la histerectomía.",
    quiz: [
      q("Durante una histerectomía se liga la arteria uterina. Estructura en riesgo que pasa por debajo:", "Uréter", ["Nervio obturador", "Vena ilíaca externa", "Ligamento redondo"], "La arteria cruza por encima del uréter cerca del cuello uterino."),
      q("Posmenopáusica obesa con sangrado vaginal. Estudio inicial:", "Ultrasonido transvaginal y biopsia de endometrio", ["Citología cervical sola", "Tomografía abdominal", "Colposcopia"], "Grosor endometrial mayor de 4 mm obliga a biopsia para descartar cáncer de endometrio."),
    ],
  },
  ovarios: {
    name: "Ovarios y trompas uterinas",
    level: "Ovario en la fosa ovárica de la pared pélvica · trompa de 10–12 cm",
    sections: [
      ["Anatomía", ["Trompa: intersticial, istmo, ampolla e infundíbulo con fimbrias. La fecundación ocurre en la ampolla.", "Arteria ovárica: rama de la aorta abdominal, viaja en el ligamento suspensorio (infundibulopélvico). La vena ovárica derecha drena a la cava; la izquierda, a la renal izquierda."]],
      ["Correlación clínica ENARM", ["Embarazo ectópico: 95 % en la trompa, sobre todo en la ampolla. Amenorrea, dolor y sangrado; hCG positiva sin saco intrauterino. Roto e inestable: cirugía; estable y pequeño: metotrexato.", "Torsión anexial: dolor súbito con náusea, ovario aumentado; laparoscopia urgente para destorcer.", "Síndrome de ovario poliquístico: oligoovulación, hiperandrogenismo y ovarios poliquísticos (2 de 3, Rotterdam).", "Cáncer de ovario: el ginecológico más letal; CA-125; BRCA1/2."]],
    ],
    pearl: "Mujer en edad fértil con dolor abdominal: primero la prueba de embarazo.",
    quiz: [
      q("Amenorrea de 7 semanas, dolor en fosa ilíaca derecha, hipotensión y líquido libre. hCG positiva sin saco intrauterino:", "Embarazo ectópico roto: cirugía urgente", ["Aborto incompleto: legrado", "Quiste ovárico funcional: vigilancia", "Apendicitis: antibiótico"], "La inestabilidad hemodinámica contraindica el metotrexato."),
      q("Criterios de Rotterdam para síndrome de ovario poliquístico:", "Dos de tres: oligoanovulación, hiperandrogenismo y ovarios poliquísticos en el ultrasonido", ["Obesidad, acné e hirsutismo", "Los tres criterios obligatorios", "Testosterona alta y LH baja"], "Se excluyen antes otras causas de hiperandrogenismo."),
    ],
  },
  mama: {
    name: "Glándula mamaria",
    level: "Sobre el pectoral mayor, de la 2.ª a la 6.ª costilla · cuadrante superoexterno con cola axilar",
    sections: [
      ["Anatomía", ["15 a 20 lóbulos con sus conductos galactóforos que desembocan en el pezón; ligamentos de Cooper.", "Drenaje linfático: 75 % a la axila (niveles I, II y III según el pectoral menor); el resto a la cadena mamaria interna."]],
      ["Correlación clínica ENARM", ["Cáncer de mama: el cuadrante superoexterno es el más afectado; carcinoma ductal el más frecuente.", "Tamizaje con mastografía (en México, cada dos años de los 40 a los 69).", "Retracción de la piel o del pezón: tracción de los ligamentos de Cooper por el tumor.", "Fibroadenoma: nódulo móvil, bien delimitado, en mujeres jóvenes.", "Mastitis puerperal: S. aureus; seguir amamantando y dar antibiótico; absceso: drenaje."]],
    ],
    pearl: "Piel de naranja = obstrucción linfática por cáncer.",
    quiz: [q("Cuadrante donde se presenta con mayor frecuencia el cáncer de mama:", "Superoexterno", ["Superointerno", "Inferoexterno", "Retroareolar"], "Tiene más tejido glandular, incluida la cola axilar de Spence.")],
  },
  tiroides: {
    name: "Tiroides y paratiroides",
    level: "Istmo sobre los anillos traqueales 2–4 · lóbulos a los lados de la laringe",
    sections: [
      ["Anatomía", ["Irrigación: tiroideas superiores (carótida externa) e inferiores (tronco tirocervical).", "Nervio laríngeo recurrente en el surco traqueoesofágico, junto a la arteria tiroidea inferior. Cuatro paratiroides en la cara posterior."]],
      ["Correlación clínica ENARM", ["Hipotiroidismo primario: TSH alta y T4 libre baja; levotiroxina. La causa más frecuente en zonas con yodo suficiente es la tiroiditis de Hashimoto.", "Enfermedad de Graves: hipertiroidismo, bocio difuso, oftalmopatía y mixedema pretibial; anticuerpos contra el receptor de TSH.", "Nódulo tiroideo: TSH y ultrasonido; biopsia por aspiración según el riesgo ecográfico. El cáncer papilar es el más frecuente.", "Tras tiroidectomía: hipocalcemia (Chvostek, Trousseau) por daño paratiroideo y disfonía por lesión del recurrente."]],
    ],
    pearl: "Ronquera tras tiroidectomía = laríngeo recurrente. Hormigueo peribucal = hipocalcemia.",
    quiz: [q("Primer estudio ante un nódulo tiroideo palpable:", "TSH y ultrasonido de tiroides", ["Gammagrama con yodo radiactivo a todos", "Tomografía de cuello", "Tiroglobulina"], "Si la TSH está baja se hace gammagrama; si no, el ultrasonido decide la biopsia.")],
  },
  salivales: {
    name: "Glándulas salivales",
    level: "Parótida delante de la oreja · submandibular bajo la mandíbula · sublingual en el piso de la boca",
    sections: [
      ["Anatomía", ["El nervio facial atraviesa la parótida y se divide dentro de ella. El conducto de Stenon (parótida) desemboca frente al segundo molar superior; el de Wharton (submandibular), junto al frenillo lingual."]],
      ["Correlación clínica ENARM", ["Parotiditis epidémica (paperas): inflamación bilateral; complicaciones: orquitis, meningitis, pancreatitis.", "Sialolitiasis: más en la submandibular (saliva más espesa y conducto ascendente); dolor que aumenta al comer.", "Adenoma pleomorfo: tumor benigno más frecuente de la parótida; parotidectomía cuidando el facial.", "Síndrome de Sjögren: ojo y boca secos, crecimiento parotídeo; anti-Ro y anti-La."]],
    ],
    pearl: "Los cálculos prefieren la submandibular; los tumores, la parótida.",
    quiz: [q("Glándula salival más afectada por litiasis:", "Submandibular", ["Parótida", "Sublingual", "Glándulas salivales menores"], "Su saliva es más mucosa y alcalina, y el conducto de Wharton asciende contra la gravedad.")],
  },
  linfaticos: {
    name: "Ganglios linfáticos",
    level: "Cadenas cervicales, axilares, inguinales, mediastinales y abdominales",
    sections: [
      ["Anatomía", ["La linfa de la mitad izquierda del cuerpo y de ambas piernas va al conducto torácico, que desemboca en el ángulo venoso yugulosubclavio izquierdo.", "Ganglios axilares: niveles I (lateral al pectoral menor), II (detrás) y III (medial)."]],
      ["Correlación clínica ENARM", ["Ganglio de Virchow (supraclavicular izquierdo): metástasis de cáncer gástrico u otro abdominal.", "Adenopatía de alarma: mayor de 2 cm, dura, fija, indolora, supraclavicular o con síntomas B; biopsia excisional.", "Linfoma de Hodgkin: células de Reed-Sternberg; adenopatía cervical en adulto joven.", "Ganglio centinela: el primero que recibe la linfa del tumor; guía la estadificación en cáncer de mama y melanoma."]],
    ],
    pearl: "Supraclavicular izquierdo palpable: busca un cáncer abdominal.",
    quiz: [q("Adenopatía supraclavicular izquierda dura en un hombre con pérdida de peso y saciedad temprana:", "Ganglio de Virchow por cáncer gástrico", ["Linfadenitis reactiva", "Tuberculosis ganglionar primaria", "Quiste branquial"], "El conducto torácico drena el abdomen hacia el ángulo venoso izquierdo.")],
  },
  "art-cerebrales": {
    name: "Arterias cerebrales y polígono de Willis",
    level: "Carótidas internas y vertebrales → polígono de Willis en la base del cerebro",
    sections: [
      ["Anatomía", ["Circulación anterior: carótida interna → cerebral anterior y media. Posterior: vertebrales → basilar → cerebrales posteriores.", "Comunicantes anterior y posteriores cierran el polígono.", "La cerebral media pasa por la cisura de Silvio: segmentos M1 (lenticuloestriadas) y M2 (ramas corticales)."]],
      ["Correlación clínica ENARM", ["Aneurismas saculares: en la comunicante anterior el más frecuente; su rotura causa hemorragia subaracnoidea («el peor dolor de cabeza de mi vida»).", "Comunicante posterior: aneurisma que comprime el III par con midriasis.", "Hemorragia subaracnoidea: tomografía simple; si es negativa, punción lumbar (xantocromía). Nimodipino para el vasoespasmo.", "Territorios: cerebral media (cara y brazo, afasia o negligencia), anterior (pierna), posterior (hemianopsia)."]],
    ],
    pearl: "Cefalea en estallido + III par con midriasis = aneurisma de la comunicante posterior.",
    quiz: [q("Cefalea súbita «la peor de mi vida» con rigidez de nuca y tomografía con sangre en las cisternas. Fármaco para prevenir el vasoespasmo:", "Nimodipino", ["Nitroprusiato", "Ácido acetilsalicílico", "Heparina"], "El vasoespasmo aparece entre los días 3 y 14 y causa isquemia tardía.")],
  },
  "venas-cabeza": {
    name: "Venas de la cabeza y senos durales",
    level: "Seno sagital superior → confluencia → transversos → sigmoides → yugular interna",
    sections: [
      ["Anatomía", ["La vena facial comunica con el seno cavernoso a través de la oftálmica, sin válvulas: el «triángulo peligroso» de la cara.", "Dentro del seno cavernoso: carótida interna y VI par; en su pared: III, IV, V1 y V2."]],
      ["Correlación clínica ENARM", ["Trombosis del seno cavernoso: infección de la cara o los senos paranasales; proptosis, quemosis y oftalmoplejía.", "Trombosis venosa cerebral: cefalea, papiledema y crisis en mujeres con anticonceptivos, embarazo o puerperio; angiorresonancia venosa; anticoagular.", "Hematoma subdural: rotura de las venas puente hacia el seno sagital."]],
    ],
    pearl: "El VI par va dentro del seno cavernoso: es el primero en fallar.",
    quiz: [q("Puérpera con cefalea progresiva, papiledema y crisis convulsivas:", "Trombosis venosa cerebral", ["Migraña con aura", "Eclampsia sin hipertensión", "Hemorragia subaracnoidea"], "El puerperio es protrombótico; se confirma con angiorresonancia o angiotomografía venosa.")],
  },
  "arterias-miembros": {
    name: "Arterias de los miembros",
    level: "Subclavia → axilar → humeral → radial y cubital · ilíaca externa → femoral → poplítea → tibiales",
    sections: [
      ["Anatomía", ["Pulsos: radial, humeral en el pliegue del codo, femoral bajo el ligamento inguinal, poplíteo, tibial posterior detrás del maléolo medial y pedio.", "La arteria femoral en el triángulo femoral: de lateral a medial nervio, arteria, vena (NAV)."]],
      ["Correlación clínica ENARM", ["Isquemia arterial aguda: las 6 P (dolor, palidez, ausencia de pulso, poiquilotermia, parestesias, parálisis); embolia por fibrilación auricular; heparina y revascularización urgente.", "Enfermedad arterial periférica: claudicación intermitente; índice tobillo-brazo menor de 0.9.", "Fractura supracondílea: riesgo de lesión de la arteria humeral. Luxación de rodilla: lesión de la poplítea."]],
    ],
    pearl: "Índice tobillo-brazo < 0.9 = enfermedad arterial periférica.",
    quiz: [q("Paciente con fibrilación auricular, dolor súbito, palidez, frialdad y ausencia de pulso en la pierna izquierda:", "Isquemia arterial aguda por embolia: heparina y embolectomía urgente", ["Trombosis venosa profunda: anticoagulación oral", "Claudicación: cilostazol", "Celulitis: antibiótico"], "Es una urgencia vascular: la parálisis y la anestesia indican amenaza inmediata del miembro.")],
  },
  "venas-miembros": {
    name: "Venas de los miembros",
    level: "Safena mayor: delante del maléolo medial → cayado en la vena femoral",
    sections: [
      ["Anatomía", ["Sistema superficial (safenas, cefálica, basílica), profundo (acompaña a las arterias) y perforantes con válvulas que llevan la sangre de fuera hacia dentro.", "La safena mayor es el injerto venoso más usado en la revascularización coronaria."]],
      ["Correlación clínica ENARM", ["Trombosis venosa profunda: pierna aumentada de volumen y dolorosa; escala de Wells, dímero D y ultrasonido Doppler; anticoagulación.", "Insuficiencia venosa crónica: várices, edema, hiperpigmentación y úlcera en el maléolo medial; compresión.", "Venopunción: vena cubital media en el pliegue del codo."]],
    ],
    pearl: "Úlcera en el maléolo medial = venosa. En la punta de los dedos = arterial.",
    quiz: [q("Estudio de imagen inicial ante sospecha de trombosis venosa profunda:", "Ultrasonido Doppler con compresión", ["Flebografía", "Tomografía de abdomen", "Radiografía de la pierna"], "Es accesible, no invasivo y sensible para las venas proximales.")],
  },
  "pares-craneales": {
    name: "Pares craneales",
    level: "I y II del encéfalo · III–IV mesencéfalo · V–VIII puente · IX–XII bulbo",
    sections: [
      ["Anatomía", ["III: motor ocular común (músculos extraoculares y pupila). IV: oblicuo superior. VI: recto lateral.", "V: sensibilidad de la cara y masticación. VII: expresión facial, gusto anterior y lagrimeo. VIII: audición y equilibrio.", "IX: gusto posterior y reflejo nauseoso. X: paladar, laringe y vísceras. XI: esternocleidomastoideo y trapecio. XII: lengua."]],
      ["Correlación clínica ENARM", ["III par por compresión (aneurisma): pupila dilatada primero. Isquémico (diabetes): respeta la pupila.", "IV par: diplopía al bajar escaleras; inclina la cabeza al lado contrario.", "VI par: el primero en afectarse con hipertensión intracraneal.", "Neuralgia del trigémino: dolor lancinante en V2–V3; carbamazepina.", "XII par: la lengua se desvía hacia el lado de la lesión."]],
    ],
    pearl: "III par con pupila dilatada = compresión hasta demostrar lo contrario.",
    quiz: [q("Diabético con ptosis y ojo desviado hacia abajo y afuera, pupila normal:", "Mononeuropatía isquémica del III par", ["Aneurisma de la comunicante posterior", "Miastenia gravis", "Lesión del IV par"], "Las fibras pupilares van por fuera del nervio y se salvan en la isquemia.")],
  },
  facial: {
    name: "Nervio facial (VII)",
    level: "Sale por el foramen estilomastoideo · se divide dentro de la parótida",
    sections: [
      ["Anatomía", ["Ramas: temporal, cigomática, bucal, mandibular marginal y cervical.", "Además lleva el gusto de los dos tercios anteriores de la lengua (cuerda del tímpano), lagrimeo, salivación y el músculo del estribo."]],
      ["Correlación clínica ENARM", ["Parálisis de Bell: periférica e idiopática; toda la hemicara, hiperacusia y pérdida del gusto; prednisona y protección del ojo.", "Parálisis central: respeta la frente.", "Parotidectomía: riesgo de lesión del facial."]],
    ],
    pearl: "Bell: proteger la córnea, porque el ojo no cierra.",
    quiz: [q("Tratamiento de la parálisis de Bell en las primeras 72 horas:", "Prednisona y cuidado ocular", ["Solo aciclovir", "Descompresión quirúrgica inmediata", "Antiagregante plaquetario"], "El esteroide mejora la recuperación; el antiviral solo se agrega en casos graves.")],
  },
  vago: {
    name: "Nervio vago (X) y nervios laríngeos",
    level: "Sale por el agujero yugular · recurrente izquierdo bajo el cayado, derecho bajo la subclavia",
    sections: [
      ["Anatomía", ["Inerva paladar, faringe y laringe, y da el parasimpático de corazón, pulmones y tubo digestivo hasta el ángulo esplénico del colon.", "El laríngeo recurrente inerva todos los músculos intrínsecos de la laringe menos el cricotiroideo (laríngeo superior)."]],
      ["Correlación clínica ENARM", ["Lesión unilateral del recurrente: disfonía; bilateral: estridor y obstrucción de la vía aérea.", "Síncope vasovagal: bradicardia y vasodilatación por descarga vagal.", "Maniobra vagal en la taquicardia supraventricular estable."]],
    ],
    pearl: "Aneurisma del cayado o cáncer de pulmón izquierdo pueden causar ronquera por el recurrente izquierdo.",
    quiz: [q("Tras una tiroidectomía total la paciente tiene estridor y dificultad respiratoria inmediata. Causa probable:", "Lesión bilateral de los nervios laríngeos recurrentes", ["Hipocalcemia tardía", "Lesión del laríngeo superior", "Lesión del nervio frénico"], "Ambas cuerdas vocales quedan en posición paramediana y cierran la glotis.")],
  },
  "plexo-braquial": {
    name: "Plexo braquial",
    level: "Raíces C5–T1 → troncos → divisiones → fascículos → nervios terminales",
    sections: [
      ["Anatomía", ["Troncos superior (C5–C6), medio (C7) e inferior (C8–T1). Fascículos lateral, posterior y medial alrededor de la arteria axilar.", "Nervios: musculocutáneo, axilar, radial, mediano y cubital; además torácico largo, supraescapular y toracodorsal."]],
      ["Correlación clínica ENARM", ["Parálisis de Erb-Duchenne (C5–C6): distocia de hombros; brazo en aducción y rotación interna, «propina del mesero».", "Parálisis de Klumpke (C8–T1): mano en garra; puede asociarse a síndrome de Horner.", "Tumor de Pancoast: dolor del hombro, atrofia de la mano y Horner.", "Nervio axilar (luxación del hombro): debilidad del deltoides y anestesia sobre él."]],
    ],
    pearl: "Erb = arriba (C5–C6). Klumpke = abajo (C8–T1), garra y Horner.",
    quiz: [q("Recién nacido macrosómico con distocia de hombros; el brazo cuelga en aducción y rotación interna:", "Parálisis de Erb-Duchenne (C5–C6)", ["Parálisis de Klumpke", "Fractura de húmero", "Lesión del nervio radial"], "La tracción lateral del cuello lesiona el tronco superior.")],
  },
  "n-radial": {
    name: "Nervio radial",
    level: "Rodea el húmero por el surco radial · se divide en el codo",
    sections: [
      ["Anatomía", ["Extiende el codo (tríceps), la muñeca y los dedos, y supina. Sensibilidad del dorso de la mano del lado del pulgar."]],
      ["Correlación clínica ENARM", ["Fractura de la diáfisis humeral: mano caída.", "Parálisis del sábado por la noche o por muletas: compresión en la axila o el brazo.", "Nervio interóseo posterior: no puede extender los dedos pero sí la muñeca."]],
    ],
    pearl: "Mano caída = radial.",
    quiz: [q("Tras dormir con el brazo sobre el respaldo de una silla no puede extender la muñeca ni los dedos:", "Compresión del nervio radial", ["Síndrome del túnel del carpo", "Lesión del cubital en el codo", "Radiculopatía C8"], "La compresión en el surco radial produce mano caída con sensibilidad del dorso alterada.")],
  },
  "n-mediano": {
    name: "Nervio mediano",
    level: "Pasa por el túnel del carpo con los tendones flexores",
    sections: [
      ["Anatomía", ["Flexores del antebrazo (salvo el cubital anterior y la mitad del flexor profundo), músculos tenares y lumbricales 1 y 2. Sensibilidad palmar del pulgar al anular radial."]],
      ["Correlación clínica ENARM", ["Síndrome del túnel del carpo: parestesias nocturnas, Tinel y Phalen, atrofia tenar; asociado a embarazo, hipotiroidismo, diabetes y artritis reumatoide.", "Lesión alta: mano del predicador al intentar cerrar el puño.", "Fractura supracondílea: nervio interóseo anterior (no hace el «OK»)."]],
    ],
    pearl: "Embarazada con manos dormidas en la noche: túnel del carpo.",
    quiz: [q("Prueba que reproduce las parestesias al flexionar las muñecas un minuto:", "Phalen", ["Tinel", "Finkelstein", "Allen"], "Tinel es la percusión sobre el túnel; Finkelstein evalúa la tenosinovitis de De Quervain.")],
  },
  "n-cubital": {
    name: "Nervio cubital (ulnar)",
    level: "Detrás del epicóndilo medial · canal de Guyon en la muñeca",
    sections: [
      ["Anatomía", ["Músculos intrínsecos de la mano (interóseos, lumbricales 3 y 4, hipotenares, aductor del pulgar). Sensibilidad del meñique y la mitad cubital del anular."]],
      ["Correlación clínica ENARM", ["Lesión en el codo (fractura del epicóndilo medial, «hueso de la risa»): garra cubital.", "Signo de Froment: flexiona el pulgar para sujetar un papel porque falla el aductor.", "Compresión en el canal de Guyon: ciclistas."]],
    ],
    pearl: "Garra cubital: anular y meñique en garra.",
    quiz: [q("Debilidad para separar los dedos y anestesia del meñique tras fractura del epicóndilo medial:", "Lesión del nervio cubital", ["Lesión del mediano", "Lesión del radial", "Radiculopatía C6"], "El cubital inerva los interóseos, que abducen y aducen los dedos.")],
  },
  "nervios-mi": {
    name: "Nervios del miembro inferior",
    level: "Plexo lumbar (L1–L4): femoral y obturador · plexo sacro (L4–S3): ciático",
    sections: [
      ["Anatomía", ["Femoral: extiende la rodilla (cuádriceps) y da el safeno. Obturador: aductores.", "Ciático: sale bajo el piriforme y se divide en tibial (flexión plantar) y peroneo común (dorsiflexión y eversión).", "Pudendo: perineo y esfínter externo; bloqueo pudendo en el parto."]],
      ["Correlación clínica ENARM", ["Lesión del peroneo común (fractura del cuello del peroné, yeso apretado): pie caído y marcha en estepaje.", "Inyección intramuscular glútea: cuadrante superoexterno para no lesionar el ciático.", "Meralgia parestésica: compresión del cutáneo femoral lateral bajo el ligamento inguinal (obesidad, ropa ajustada).", "Lesión del nervio glúteo superior: signo de Trendelenburg."]],
    ],
    pearl: "Inyecciones glúteas siempre en el cuadrante superoexterno.",
    quiz: [q("Tras un yeso apretado bajo la rodilla el paciente no puede dorsiflexionar el pie:", "Lesión del nervio peroneo común", ["Lesión del tibial", "Lesión del femoral", "Radiculopatía S1"], "El peroneo común rodea el cuello del peroné, donde es muy superficial.")],
  },
  autonomo: {
    name: "Sistema nervioso autónomo",
    level: "Simpático toracolumbar (T1–L2) · parasimpático craneosacro",
    sections: [
      ["Anatomía", ["Cadena simpática a los lados de la columna; el ganglio estrellado (cervicotorácico) inerva la cabeza y el miembro superior.", "Parasimpático: pares III, VII, IX y X, y nervios esplácnicos pélvicos S2–S4."]],
      ["Correlación clínica ENARM", ["Síndrome de Horner: ptosis, miosis y anhidrosis por interrupción simpática (tumor de Pancoast, disección carotídea, Wallenberg).", "Intoxicación por organofosforados: crisis colinérgica (miosis, sialorrea, broncorrea, bradicardia); atropina y pralidoxima.", "Disreflexia autonómica en lesión medular por encima de T6: hipertensión súbita por un estímulo como una vejiga llena."]],
    ],
    pearl: "Ptosis + miosis + anhidrosis = Horner.",
    quiz: [q("Agricultor con miosis, sialorrea, broncorrea y bradicardia tras fumigar:", "Intoxicación por organofosforados: atropina", ["Intoxicación por opioides: naloxona", "Golpe de calor", "Intoxicación anticolinérgica"], "La inhibición de la acetilcolinesterasa produce exceso muscarínico y nicotínico.")],
  },
};
