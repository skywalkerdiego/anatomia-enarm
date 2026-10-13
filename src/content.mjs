// Contenido de estudio por pieza del modelo. Cada ficha: nivel, secciones y preguntas tipo ENARM.
export const SYSTEMS = [
  { id: "torax", name: "Tórax", pieces: ["corazon", "pulmon-der", "pulmon-izq", "traquea", "esofago", "aorta", "cavas", "diafragma"] },
  { id: "abdomen", name: "Abdomen", pieces: ["higado", "vesicula", "estomago", "duodeno", "pancreas", "bazo", "intestino", "colon"] },
  { id: "retro", name: "Retroperitoneo y pelvis", pieces: ["rinones", "vejiga", "pelvis"] },
  { id: "esqueleto", name: "Esqueleto y cuello", pieces: ["columna", "costillas", "cuello"] },
];

export const PIECES = {
  corazon: {
    name: "Corazón",
    short: "Corazón",
    level: "T5–T8 · ápex en 5.º EIC LMC izq.",
    sections: [
      ["Anatomía", ["Cara anterior (esternocostal): sobre todo ventrículo derecho. Borde derecho: aurícula derecha. Borde izquierdo y ápex: ventrículo izquierdo.", "La aurícula izquierda es la cámara más posterior y se apoya sobre el esófago: el ecocardiograma transesofágico la ve mejor.", "El tronco pulmonar (azul en el modelo: lleva sangre desoxigenada) sale del VD por delante y a la izquierda de la aorta."]],
      ["Irrigación coronaria", ["Coronaria derecha: AD, VD, cara inferior del VI y 1/3 posterior del septum. Irriga el nodo SA (~60%) y el nodo AV (~80–90%, dominancia derecha).", "Descendente anterior (línea roja sobre el surco interventricular): 2/3 anteriores del septum, cara anterior y ápex. Es la más ocluida en el IAM.", "Circunfleja (en el surco auriculoventricular, línea roja circular): cara lateral y posterior del VI."]],
      ["Inervación", ["Plexo cardiaco: simpático T1–T4 (↑ FC y contractilidad) y parasimpático vagal (↓ FC).", "El dolor isquémico se refiere por T1–T4: brazo izquierdo, cuello, mandíbula."]],
      ["Correlación clínica ENARM", ["IAM inferior (DII, DIII, aVF) → coronaria derecha; puede cursar con bradicardia o BAV.", "IAM anterior (V1–V4) → descendente anterior. Lateral (DI, aVL, V5–V6) → circunfleja.", "Taponamiento: tríada de Beck (hipotensión, ingurgitación yugular, ruidos velados) y pulso paradójico.", "Índice cardiotorácico normal en Rx PA: < 0.5."]],
    ],
    pearl: "Si el ST sube en DII, DIII y aVF, piensa en la coronaria derecha y vigila el nodo AV.",
    quiz: [
      { q: "IAM con elevación del ST en DII, DIII y aVF con bradicardia. ¿Arteria más probablemente ocluida?", a: ["Coronaria derecha", "Descendente anterior", "Circunfleja", "Tronco coronario izquierdo"], ok: 0, why: "La cara inferior depende de la coronaria derecha en ~80% (dominancia derecha), que también irriga el nodo AV: de ahí la bradicardia o el bloqueo." },
      { q: "¿Cuál es la cámara cardiaca más posterior, en contacto con el esófago?", a: ["Aurícula izquierda", "Ventrículo derecho", "Aurícula derecha", "Ventrículo izquierdo"], ok: 0, why: "La AI es posterior; su crecimiento (p. ej., estenosis mitral) puede comprimir el esófago y causar disfagia." },
      { q: "¿Qué cámara forma la mayor parte de la cara anterior del corazón?", a: ["Ventrículo derecho", "Ventrículo izquierdo", "Aurícula izquierda", "Aurícula derecha"], ok: 0, why: "La cara esternocostal es principalmente VD; por eso el VD es el más lesionado en heridas precordiales." },
    ],
  },
  "pulmon-der": {
    name: "Pulmón derecho",
    short: "Pulmón der.",
    level: "Ápex sobre la clavícula · base en la cúpula derecha",
    sections: [
      ["Anatomía", ["3 lóbulos (superior, medio, inferior), 2 fisuras: oblicua y horizontal (líneas sobre el modelo). 10 segmentos broncopulmonares.", "La fisura horizontal sigue la 4.ª costilla por delante.", "Bronquio principal derecho: más corto, ancho y vertical que el izquierdo."]],
      ["Irrigación", ["Funcional: arterias pulmonares (sangre desoxigenada). Nutricia: arterias bronquiales (de la aorta).", "Drenaje: venas pulmonares (dos por lado) a la aurícula izquierda."]],
      ["Correlación clínica ENARM", ["Cuerpos extraños y broncoaspiración van más a la derecha.", "Aspiración en decúbito supino: segmento posterior del lóbulo superior y superior del lóbulo inferior derechos (absceso pulmonar en alcohólicos).", "Toracocentesis: entrar por el borde superior de la costilla inferior; el paquete vena–arteria–nervio corre bajo cada costilla."]],
    ],
    pearl: "Derecho = más vertical: ahí caen los cacahuates y los tubos endotraqueales demasiado profundos.",
    quiz: [
      { q: "Niño de 3 años aspira un cacahuate. ¿A dónde es más probable que llegue?", a: ["Bronquio principal derecho", "Bronquio principal izquierdo", "Língula", "Igual a ambos lados"], ok: 0, why: "El bronquio derecho es más corto, ancho y vertical." },
      { q: "¿Cuántos lóbulos y fisuras tiene el pulmón derecho?", a: ["3 lóbulos y 2 fisuras", "2 lóbulos y 1 fisura", "3 lóbulos y 1 fisura", "2 lóbulos y 2 fisuras"], ok: 0, why: "Superior, medio e inferior, separados por las fisuras horizontal y oblicua." },
      { q: "En una toracocentesis, la aguja debe pasar:", a: ["Por el borde superior de la costilla inferior", "Por el borde inferior de la costilla superior", "Por cualquier punto del espacio intercostal", "Por debajo de la 12.ª costilla"], ok: 0, why: "El paquete intercostal (vena, arteria, nervio) corre por el surco del borde inferior de cada costilla." },
    ],
  },
  "pulmon-izq": {
    name: "Pulmón izquierdo",
    short: "Pulmón izq.",
    level: "Ápex sobre la clavícula · base en la cúpula izquierda",
    sections: [
      ["Anatomía", ["2 lóbulos (superior e inferior) y 1 fisura oblicua. La língula del lóbulo superior equivale al lóbulo medio derecho.", "Escotadura cardiaca: el corazón ocupa su borde anterior.", "Bronquio principal izquierdo: más largo, estrecho y horizontal; pasa bajo el cayado aórtico y por delante del esófago."]],
      ["Hilio", ["Izquierdo: la arteria pulmonar queda por encima del bronquio.", "Derecho: el bronquio del lóbulo superior queda por encima de la arteria (eparterial)."]],
      ["Correlación clínica ENARM", ["Neumotórax a tensión: desviación traqueal contralateral, hipotensión e hiperresonancia. Es un diagnóstico clínico: descomprimir sin esperar la Rx.", "ATLS 10.ª ed.: descompresión con aguja en el 4.º–5.º EIC por delante de la línea axilar media en adultos; 2.º EIC LMC en niños."]],
    ],
    pearl: "Língula = lóbulo medio del lado izquierdo.",
    quiz: [
      { q: "¿Qué estructura del pulmón izquierdo equivale al lóbulo medio derecho?", a: ["Língula", "Segmento apicoposterior", "Segmento superior del lóbulo inferior", "Escotadura cardiaca"], ok: 0, why: "La língula forma parte del lóbulo superior izquierdo y es su homóloga." },
      { q: "Neumotórax a tensión en un adulto. Según ATLS 10.ª ed., la descompresión con aguja se hace en:", a: ["4.º–5.º EIC anterior a la línea axilar media", "2.º EIC línea axilar media", "7.º EIC línea escapular", "6.º EIC línea paraesternal"], ok: 0, why: "La pared es más delgada en ese sitio, con mayor éxito que en el 2.º EIC en adultos." },
    ],
  },
  traquea: {
    name: "Tráquea y bronquios",
    short: "Tráquea",
    level: "C6 → carina en T4–T5",
    sections: [
      ["Anatomía", ["Inicia en C6 (cartílago cricoides) y se bifurca en T4–T5 (ángulo esternal de Louis) en la carina (esfera del modelo).", "16–20 cartílagos en C, abiertos hacia atrás (anillos del modelo); detrás va el esófago.", "El istmo tiroideo cubre los anillos 2–4."]],
      ["Correlación clínica ENARM", ["Intubación selectiva: un tubo demasiado profundo entra al bronquio derecho e hipoventila el pulmón izquierdo.", "La punta del tubo endotraqueal debe quedar 2–5 cm por encima de la carina.", "Vía aérea quirúrgica urgente en adultos: cricotiroidotomía en la membrana cricotiroidea."]],
    ],
    pearl: "Ángulo de Louis = T4–T5 = carina = inicio y fin del cayado aórtico.",
    quiz: [
      { q: "¿A qué nivel vertebral se bifurca la tráquea?", a: ["T4–T5", "C6", "T2", "T7"], ok: 0, why: "La carina está a la altura del ángulo esternal (T4–T5)." },
      { q: "Tras intubar, hay hipoventilación izquierda y ruidos a la derecha. ¿Dónde quedó el tubo?", a: ["Bronquio principal derecho", "Esófago", "Bronquio principal izquierdo", "Laringe"], ok: 0, why: "Por ser más vertical, el bronquio derecho recibe el tubo cuando se introduce de más; se retira hasta escuchar ambos campos." },
    ],
  },
  esofago: {
    name: "Esófago",
    short: "Esófago",
    level: "C6 → hiato T10 → cardias T11",
    sections: [
      ["Anatomía", ["Mide ~25 cm; va detrás de la tráquea y de la aurícula izquierda, cruza el diafragma por el hiato esofágico en T10 con los troncos vagales.", "Tres estrechamientos: cricofaríngeo (C6, el más estrecho), broncoaórtico (T4) y diafragmático (T10).", "Músculo: tercio superior estriado, medio mixto, inferior liso."]],
      ["Irrigación y drenaje", ["Arterial: tiroidea inferior (superior), ramas de la aorta (medio), gástrica izquierda (inferior).", "Las venas del tercio inferior unen la gástrica izquierda (porta) con la ácigos (sistémica): anastomosis portocava."]],
      ["Correlación clínica ENARM", ["Varices esofágicas en la hipertensión portal (cirrosis).", "Divertículo de Zenker: triángulo de Killian, sobre el cricofaríngeo; halitosis y regurgitación.", "Boerhaave: perforación distal posterolateral izquierda tras vómito intenso. Mallory-Weiss: desgarro de mucosa.", "Acalasia: pérdida del plexo mientérico; imagen en pico de pájaro."]],
    ],
    pearl: "I 8 10 EGGs AT 12: cava T8, esófago (y vagos) T10, aorta (y conducto torácico, ácigos) T12.",
    quiz: [
      { q: "Las varices esofágicas de la hipertensión portal se forman por la anastomosis entre:", a: ["Vena gástrica izquierda y vena ácigos", "Vena esplénica y vena renal izquierda", "Vena mesentérica inferior y venas rectales", "Vena porta y cava inferior de forma directa"], ok: 0, why: "La gástrica izquierda drena a la porta y la ácigos a la cava superior; con hipertensión portal el flujo se invierte por la submucosa esofágica." },
      { q: "El divertículo de Zenker se origina en:", a: ["El triángulo de Killian, sobre el cricofaríngeo", "El tercio medio por tracción", "El esófago epifrénico", "La unión gastroesofágica"], ok: 0, why: "Es un falso divertículo por pulsión en la pared posterior de la hipofaringe." },
    ],
  },
  aorta: {
    name: "Aorta y sus ramas",
    short: "Aorta",
    level: "Cayado T4 · hiato T12 · bifurcación L4",
    sections: [
      ["Trayecto", ["Ascendente → cayado (T4) con tronco braquiocefálico, carótida común izquierda y subclavia izquierda → descendente torácica → hiato aórtico (T12) → abdominal → bifurcación en ilíacas comunes (L4).", "El nervio laríngeo recurrente izquierdo rodea el cayado bajo el ligamento arterioso: un aneurisma del cayado puede dar disfonía."]],
      ["Ramas abdominales (de arriba abajo)", ["Tronco celiaco (T12): gástrica izquierda, hepática común y esplénica (esfera y tres ramas del modelo).", "Mesentérica superior (L1): pasa por delante de la 3.ª porción del duodeno.", "Renales (L1–L2): la derecha pasa por detrás de la cava inferior.", "Mesentérica inferior (L3), hacia el colon descendente y sigmoides."]],
      ["Correlación clínica ENARM", ["Disección: Stanford A (ascendente) → cirugía urgente; Stanford B (descendente) → manejo médico (control de FC y TA).", "Aneurisma de aorta abdominal, casi siempre infrarrenal: reparar con ≥ 5.5 cm o crecimiento rápido.", "Coartación: muescas costales (signo de Roesler) y signo del 3 en la Rx."]],
    ],
    pearl: "Celiaco T12 · AMS L1 · renales L1–L2 · AMI L3 · bifurcación L4.",
    quiz: [
      { q: "Disección aórtica que involucra la aorta ascendente:", a: ["Stanford A: cirugía urgente", "Stanford B: manejo médico", "DeBakey III: manejo médico", "Stanford B: cirugía electiva"], ok: 0, why: "Toda disección que afecta la ascendente es tipo A y su mortalidad sin cirugía es muy alta." },
      { q: "La vena renal izquierda puede comprimirse entre:", a: ["La aorta y la arteria mesentérica superior", "La aorta y la columna", "La cava y el duodeno", "La AMS y el páncreas"], ok: 0, why: "Síndrome del cascanueces: hematuria y varicocele izquierdo." },
      { q: "¿A qué nivel vertebral se bifurca la aorta abdominal?", a: ["L4", "L1", "T12", "S1"], ok: 0, why: "A la altura de L4, aproximadamente a nivel del ombligo y de las crestas ilíacas." },
    ],
  },
  cavas: {
    name: "Venas cavas y venas renales",
    short: "Venas cavas",
    level: "VCI: L5 → hiato T8 · VCS: 1.er cartílago costal",
    sections: [
      ["Anatomía", ["Cava superior: une las dos braquiocefálicas (la izquierda cruza por delante de las ramas del cayado) y desemboca en la AD; recibe la ácigos.", "Cava inferior: se forma en L5 a la derecha de la aorta, cruza el diafragma en T8 por el centro tendinoso y entra a la AD.", "Vena renal izquierda: larga, cruza por delante de la aorta; recibe la gonadal y la suprarrenal izquierdas."]],
      ["Correlación clínica ENARM", ["Síndrome de vena cava superior (cáncer de pulmón de células pequeñas, linfoma): edema en esclavina, ingurgitación yugular y circulación colateral.", "Varicocele izquierdo más frecuente: la gonadal izquierda drena en ángulo recto a la renal izquierda.", "Varicocele derecho aislado o de inicio súbito: descartar masa retroperitoneal o renal."]],
    ],
    pearl: "Azul en el modelo = sangre desoxigenada, por eso el tronco pulmonar también es azul.",
    quiz: [
      { q: "¿Por qué el varicocele es más frecuente del lado izquierdo?", a: ["La gonadal izquierda drena en ángulo recto a la renal izquierda", "La gonadal izquierda drena directo a la cava inferior", "La arteria testicular izquierda es más larga", "El testículo izquierdo está más alto"], ok: 0, why: "Mayor presión hidrostática y columna más larga; la derecha drena en ángulo agudo a la cava." },
      { q: "¿A nivel de qué vértebra atraviesa la cava inferior el diafragma?", a: ["T8", "T10", "T12", "L1"], ok: 0, why: "Hiato de la cava en el centro tendinoso, T8 (junto con ramas del frénico derecho)." },
    ],
  },
  diafragma: {
    name: "Diafragma",
    short: "Diafragma",
    level: "Cúpula derecha más alta · hiatos T8, T10, T12",
    sections: [
      ["Anatomía", ["Dos cúpulas (la derecha más alta por el hígado) y un centro tendinoso donde se apoya el corazón.", "Hiatos: cava T8 (centro tendinoso), esofágico T10 (pilar derecho), aórtico T12 (detrás de los pilares).", "Inervación motora: nervio frénico C3–C5."]],
      ["Correlación clínica ENARM", ["Hernia de Bochdalek: posterolateral izquierda, congénita, con hipoplasia pulmonar. Morgagni: anterior, retroesternal.", "Hernia hiatal por deslizamiento (tipo I): la más común en adultos.", "Irritación diafragmática → dolor referido al hombro (signo de Kehr en la rotura esplénica).", "Lesión del frénico: hemidiafragma elevado en la Rx."]],
    ],
    pearl: "C3, C4 y C5 mantienen vivo al diafragma.",
    quiz: [
      { q: "La hernia diafragmática congénita más frecuente es:", a: ["Bochdalek, posterolateral izquierda", "Morgagni, anterior derecha", "Hiatal por deslizamiento", "Paraesofágica"], ok: 0, why: "Bochdalek representa ~85–90% de las congénitas y se asocia a hipoplasia pulmonar." },
      { q: "Inervación motora del diafragma:", a: ["Nervio frénico (C3–C5)", "Nervios intercostales T7–T11", "Nervio vago", "Plexo braquial C5–T1"], ok: 0, why: "Los intercostales solo dan sensibilidad a la periferia del diafragma." },
    ],
  },
  higado: {
    name: "Hígado",
    short: "Hígado",
    level: "Cuadrante superior derecho, bajo la cúpula derecha",
    sections: [
      ["Anatomía", ["El órgano sólido más grande. Lóbulos anatómicos derecho e izquierdo separados por el ligamento falciforme (línea del modelo).", "Couinaud: 8 segmentos funcionales; la línea de Cantlie (vesícula–cava) separa los hígados funcionales.", "Tríada portal en el ligamento hepatoduodenal: colédoco (lateral), arteria hepática propia (medial) y vena porta (posterior)."]],
      ["Irrigación", ["Doble: vena porta (~75% del flujo) y arteria hepática (~25%).", "Drenaje: venas hepáticas → cava inferior, justo bajo el diafragma."]],
      ["Correlación clínica ENARM", ["Espacio de Morison (hepatorrenal): primera ventana del FAST para buscar líquido libre en el cuadrante superior derecho.", "Hipertensión portal: varices, ascitis, esplenomegalia y cabeza de medusa.", "Absceso hepático amebiano: lóbulo derecho, contenido en pasta de anchoas; tratamiento con metronidazol.", "Maniobra de Pringle: pinzar el ligamento hepatoduodenal para controlar el sangrado."]],
    ],
    pearl: "El hígado baja con la inspiración: por eso se palpa al pedir al paciente que inspire.",
    quiz: [
      { q: "En el FAST, ¿qué espacio se explora en la ventana del cuadrante superior derecho?", a: ["Espacio hepatorrenal de Morison", "Fondo de saco de Douglas", "Espacio esplenorrenal", "Pericardio"], ok: 0, why: "Es la zona más declive del abdomen superior en decúbito supino." },
      { q: "En el ligamento hepatoduodenal, la estructura más posterior es:", a: ["La vena porta", "El colédoco", "La arteria hepática propia", "La vena cava inferior"], ok: 0, why: "Colédoco lateral, arteria medial y porta por detrás de ambos." },
      { q: "Tratamiento de elección del absceso hepático amebiano no complicado:", a: ["Metronidazol", "Drenaje quirúrgico inmediato", "Albendazol", "Ceftriaxona sola"], ok: 0, why: "Responde a nitroimidazoles; el drenaje se reserva para riesgo de rotura o falta de respuesta." },
    ],
  },
  vesicula: {
    name: "Vesícula biliar",
    short: "Vesícula",
    level: "Fondo en el 9.º cartílago costal derecho",
    sections: [
      ["Anatomía", ["Fondo, cuerpo, infundíbulo (bolsa de Hartmann) y cuello. El cístico se une al hepático común para formar el colédoco.", "Arteria cística: rama de la hepática derecha, dentro del triángulo de Calot (cístico, hepático común y borde hepático).", "Punto de Murphy: reborde costal derecho en la línea medioclavicular."]],
      ["Correlación clínica ENARM", ["Colecistitis aguda: Murphy positivo; ultrasonido como estudio inicial; criterios de Tokio.", "Colangitis: tríada de Charcot (fiebre, ictericia, dolor en hipocondrio derecho); péntada de Reynolds si se agregan hipotensión y alteración del estado de alerta.", "Courvoisier-Terrier: vesícula palpable no dolorosa + ictericia → neoplasia periampular."]],
    ],
    pearl: "Charcot = colangitis. Reynolds = colangitis grave: drenaje biliar urgente.",
    quiz: [
      { q: "Fiebre, ictericia y dolor en hipocondrio derecho corresponden a:", a: ["Tríada de Charcot (colangitis)", "Péntada de Reynolds", "Signo de Murphy", "Signo de Courvoisier"], ok: 0, why: "La tríada de Charcot define clínicamente la colangitis aguda." },
      { q: "El triángulo de Calot contiene habitualmente:", a: ["La arteria cística", "La vena porta", "El colédoco distal", "La arteria gastroduodenal"], ok: 0, why: "Identificarla en el triángulo es clave en la colecistectomía (visión crítica de seguridad)." },
      { q: "Estudio de imagen inicial ante sospecha de colecistitis aguda:", a: ["Ultrasonido de hígado y vías biliares", "TAC contrastada", "CPRE", "Gammagrama HIDA en todos los casos"], ok: 0, why: "Accesible, sin radiación y con buena sensibilidad; el HIDA se reserva para casos dudosos." },
    ],
  },
  estomago: {
    name: "Estómago",
    short: "Estómago",
    level: "Cardias T11 · píloro L1 (plano transpilórico)",
    sections: [
      ["Anatomía", ["Cardias, fondo (esfera del modelo, bajo la cúpula izquierda), cuerpo, antro y píloro (anillo del modelo).", "Células parietales (HCl y factor intrínseco, fondo y cuerpo), principales (pepsinógeno) y G (gastrina, antro)."]],
      ["Irrigación", ["Curvatura menor: gástricas izquierda (tronco celiaco) y derecha.", "Curvatura mayor: gastroepiploicas derecha (gastroduodenal) e izquierda (esplénica). Fondo: gástricas cortas."]],
      ["Correlación clínica ENARM", ["Úlcera duodenal posterior: puede erosionar la arteria gastroduodenal y sangrar masivamente.", "H. pylori: principal causa de úlcera péptica; erradicar.", "Gastrectomía o anemia perniciosa → déficit de B12 por falta de factor intrínseco."]],
    ],
    pearl: "Ácido = parietales. Sin factor intrínseco no hay B12.",
    quiz: [
      { q: "Úlcera en la cara posterior del bulbo duodenal con sangrado masivo. Arteria afectada:", a: ["Gastroduodenal", "Gástrica izquierda", "Esplénica", "Mesentérica superior"], ok: 0, why: "La gastroduodenal corre detrás de la primera porción del duodeno." },
      { q: "Las células parietales secretan:", a: ["HCl y factor intrínseco", "Pepsinógeno", "Gastrina", "Somatostatina"], ok: 0, why: "Están en el fondo y el cuerpo; las G (gastrina) en el antro." },
    ],
  },
  duodeno: {
    name: "Duodeno",
    short: "Duodeno",
    level: "L1–L3 · ángulo de Treitz",
    sections: [
      ["Anatomía", ["~25 cm en forma de C alrededor de la cabeza del páncreas. Retroperitoneal salvo el bulbo.", "2.ª porción: ampolla de Vater (colédoco + Wirsung). 3.ª porción: cruza entre la aorta y la mesentérica superior.", "4.ª porción → ángulo de Treitz (ligamento suspensorio)."]],
      ["Correlación clínica ENARM", ["El ligamento de Treitz separa la hemorragia digestiva alta de la baja.", "Atresia duodenal: doble burbuja; asociada a síndrome de Down.", "Síndrome de la AMS (Wilkie): compresión de la 3.ª porción tras pérdida de peso."]],
    ],
    pearl: "Doble burbuja + Down = atresia duodenal.",
    quiz: [
      { q: "Recién nacido con síndrome de Down, vómitos biliares y Rx con doble burbuja:", a: ["Atresia duodenal", "Estenosis hipertrófica de píloro", "Enfermedad de Hirschsprung", "Atresia esofágica"], ok: 0, why: "La doble burbuja son el estómago y el duodeno proximal dilatados, sin aire distal." },
      { q: "¿Qué estructura separa la hemorragia digestiva alta de la baja?", a: ["Ligamento de Treitz", "Píloro", "Válvula ileocecal", "Ampolla de Vater"], ok: 0, why: "Proximal a Treitz = alta; distal = baja." },
    ],
  },
  pancreas: {
    name: "Páncreas",
    short: "Páncreas",
    level: "L1–L2 · retroperitoneal salvo la cola",
    sections: [
      ["Anatomía", ["Cabeza en el marco duodenal (esfera del modelo), cuello sobre la confluencia de la porta, cuerpo sobre la aorta y cola hacia el hilio esplénico.", "Conducto de Wirsung → ampolla de Vater con el colédoco; Santorini → papila menor.", "Irrigación: pancreatoduodenales (gastroduodenal y AMS) y ramas de la esplénica."]],
      ["Correlación clínica ENARM", ["Pancreatitis aguda: la litiasis biliar es la causa más frecuente; diagnóstico con 2 de 3 (dolor típico, lipasa o amilasa ≥ 3× el límite superior, imagen).", "Signos de Cullen (periumbilical) y Grey Turner (flancos): hemorragia retroperitoneal.", "Cáncer de cabeza de páncreas: ictericia indolora, pérdida de peso, vesícula palpable (Courvoisier)."]],
    ],
    pearl: "Dolor en cinturón + lipasa ≥ 3× = pancreatitis.",
    quiz: [
      { q: "Causa más frecuente de pancreatitis aguda:", a: ["Litiasis biliar", "Hipercalcemia", "Fármacos", "Traumatismo"], ok: 0, why: "Los cálculos que obstruyen la ampolla son la primera causa; el alcohol es la segunda." },
      { q: "Ictericia indolora, pérdida de peso y vesícula palpable no dolorosa sugieren:", a: ["Adenocarcinoma de cabeza de páncreas", "Coledocolitiasis", "Colecistitis aguda", "Hepatitis viral"], ok: 0, why: "Signo de Courvoisier-Terrier: obstrucción maligna y lenta del colédoco." },
    ],
  },
  bazo: {
    name: "Bazo",
    short: "Bazo",
    level: "Cuadrante superior izquierdo · costillas 9–11",
    sections: [
      ["Anatomía", ["Intraperitoneal, bajo la cúpula izquierda y detrás del estómago, entre las costillas 9 y 11.", "Ligamentos gastroesplénico (vasos gástricos cortos) y esplenorrenal (vasos esplénicos y cola del páncreas).", "Arteria esplénica: rama del tronco celiaco, tortuosa, por el borde superior del páncreas."]],
      ["Correlación clínica ENARM", ["Órgano sólido más lesionado en trauma cerrado de abdomen; signo de Kehr (dolor en hombro izquierdo).", "Tras esplenectomía: vacunar contra neumococo, meningococo y H. influenzae tipo b (riesgo de sepsis por encapsulados).", "Mononucleosis con esplenomegalia: evitar deportes de contacto."]],
    ],
    pearl: "1, 3, 5, 7, 9, 11: 1 × 3 × 5 pulgadas, 7 onzas, entre las costillas 9 y 11.",
    quiz: [
      { q: "Órgano sólido más frecuentemente lesionado en trauma abdominal cerrado:", a: ["Bazo", "Páncreas", "Riñón", "Vesícula"], ok: 0, why: "Es friable y está protegido solo por las costillas inferiores." },
      { q: "Tras una esplenectomía se debe vacunar contra:", a: ["Neumococo, meningococo y H. influenzae b", "Solo influenza", "Hepatitis B y tétanos", "VPH"], ok: 0, why: "Sin bazo se pierde la defensa contra bacterias encapsuladas." },
    ],
  },
  intestino: {
    name: "Intestino delgado",
    short: "Yeyuno-íleon",
    level: "Del ángulo de Treitz a la válvula ileocecal",
    sections: [
      ["Anatomía", ["~6 m. Yeyuno (proximal, pliegues circulares prominentes, vasos rectos largos) e íleon (distal, placas de Peyer, más arcadas).", "Irrigado por la mesentérica superior.", "Íleon terminal: absorbe B12 y sales biliares."]],
      ["Correlación clínica ENARM", ["Isquemia mesentérica aguda: dolor desproporcionado a la exploración; embolia de la AMS en fibrilación auricular.", "Divertículo de Meckel: regla de los 2; persistencia del conducto onfalomesentérico; sangrado indoloro; gammagrama con pertecnetato Tc-99m.", "Adherencias (bridas): primera causa de oclusión intestinal en adultos operados.", "Enfermedad de Crohn: íleon terminal."]],
    ],
    pearl: "Meckel: 2%, a 2 pies de la válvula, 2 pulgadas, 2 tipos de mucosa ectópica, antes de los 2 años.",
    quiz: [
      { q: "Dolor abdominal intenso desproporcionado a la exploración en un paciente con fibrilación auricular:", a: ["Isquemia mesentérica aguda por embolia de la AMS", "Pancreatitis aguda", "Apendicitis", "Diverticulitis"], ok: 0, why: "El émbolo suele alojarse en la AMS, distal al origen de la cólica media." },
      { q: "El divertículo de Meckel deriva de:", a: ["Conducto onfalomesentérico (vitelino)", "Uraco", "Conducto de Wolff", "Seno urogenital"], ok: 0, why: "Es un divertículo verdadero por persistencia del conducto vitelino." },
      { q: "La resección del íleon terminal produce deficiencia de:", a: ["Vitamina B12", "Hierro", "Ácido fólico", "Vitamina C"], ok: 0, why: "El complejo B12-factor intrínseco se absorbe en el íleon terminal." },
    ],
  },
  colon: {
    name: "Colon, ciego y apéndice",
    short: "Colon",
    level: "Ciego en fosa ilíaca derecha · sigmoides en la izquierda",
    sections: [
      ["Anatomía", ["Haustras (anillos del modelo), tenias y apéndices epiploicos. Ascendente y descendente retroperitoneales; transverso y sigmoides con meso.", "Apéndice: base en la confluencia de las tenias del ciego.", "AMS irriga hasta los 2/3 proximales del transverso; AMI el resto hasta el recto superior."]],
      ["Correlación clínica ENARM", ["Apendicitis: dolor periumbilical que migra a la fosa ilíaca derecha; McBurney, Rovsing, psoas y obturador; escala de Alvarado.", "Colitis isquémica en zonas limítrofes: ángulo esplénico (Griffiths) y unión rectosigmoidea (Sudeck).", "Vólvulo de sigmoides: adulto mayor estreñido, imagen en grano de café.", "Cáncer colorrectal: derecho → anemia ferropénica; izquierdo → cambio de hábito y obstrucción."]],
    ],
    pearl: "McBurney: unión del tercio externo con los dos tercios internos de la línea EIAS–ombligo (la esfera del modelo es la EIAS).",
    quiz: [
      { q: "El punto de McBurney se localiza:", a: ["En la unión del tercio externo con los 2/3 internos de la línea EIAS derecha–ombligo", "En el punto medio entre la EIAS y el ombligo", "Bajo el reborde costal derecho en la línea medioclavicular", "En la fosa ilíaca izquierda"], ok: 0, why: "Corresponde a la proyección habitual de la base apendicular." },
      { q: "Zona del colon más vulnerable a la colitis isquémica por ser territorio limítrofe:", a: ["Ángulo esplénico", "Ciego", "Colon ascendente", "Recto inferior"], ok: 0, why: "Es la frontera entre la AMS y la AMI (punto de Griffiths)." },
      { q: "Adulto mayor con distensión abdominal y Rx con imagen en grano de café:", a: ["Vólvulo de sigmoides", "Íleo biliar", "Apendicitis", "Megacolon tóxico"], ok: 0, why: "Manejo inicial: devolvulación endoscópica si no hay datos de isquemia." },
    ],
  },
  rinones: {
    name: "Riñones, suprarrenales y uréteres",
    short: "Riñones",
    level: "T12–L3 · el derecho más bajo",
    sections: [
      ["Anatomía", ["Retroperitoneales; el derecho más bajo por el hígado. Hilio de anterior a posterior: vena, arteria, pelvis.", "Suprarrenales (conos sobre los polos superiores): corteza glomerular (aldosterona), fascicular (cortisol), reticular (andrógenos); médula (catecolaminas).", "Uréteres: cruzan por delante de la bifurcación de la ilíaca común; en la mujer pasan bajo la arteria uterina."]],
      ["Correlación clínica ENARM", ["Estrechamientos ureterales: unión pieloureteral, cruce con los ilíacos y unión ureterovesical (sitio más común de impactación).", "Litiasis en adultos: TAC simple de abdomen y pelvis; en embarazadas y niños, ultrasonido.", "Riñón en herradura: su ascenso queda atrapado bajo la mesentérica inferior.", "Feocromocitoma: crisis de cefalea, sudoración y palpitaciones con hipertensión."]],
    ],
    pearl: "Sal, azúcar y sexo: glomerular, fascicular y reticular, de fuera hacia dentro.",
    quiz: [
      { q: "Sitio más frecuente de impactación de un lito ureteral:", a: ["Unión ureterovesical", "Unión pieloureteral", "Cruce con vasos ilíacos", "Cáliz menor"], ok: 0, why: "Es el punto más estrecho del uréter." },
      { q: "El riñón en herradura queda atrapado en su ascenso por:", a: ["Arteria mesentérica inferior", "Arteria mesentérica superior", "Tronco celiaco", "Arteria renal"], ok: 0, why: "El istmo que une los polos inferiores choca con la AMI." },
      { q: "Estudio de elección para confirmar litiasis urinaria en un adulto no embarazado:", a: ["TAC simple de abdomen y pelvis", "Urografía excretora", "Rx simple de abdomen", "Gammagrama renal"], ok: 0, why: "Máxima sensibilidad y especificidad, sin contraste." },
    ],
  },
  vejiga: {
    name: "Vejiga",
    short: "Vejiga",
    level: "Pelvis, detrás del pubis",
    sections: [
      ["Anatomía", ["Detrás de la sínfisis del pubis; trígono entre los orificios ureterales y uretral. Capacidad ~400–500 mL.", "Parasimpático S2–S4 (contrae el detrusor), simpático T10–L2 (relaja el detrusor y cierra el cuello), pudendo S2–S4 (esfínter externo)."]],
      ["Correlación clínica ENARM", ["Rotura vesical extraperitoneal (con fractura pélvica): sonda. Intraperitoneal (golpe con vejiga llena): cirugía. Diagnóstico por cistografía retrógrada.", "Hematuria macroscópica indolora en fumador: carcinoma urotelial hasta demostrar lo contrario."]],
    ],
    pearl: "Para orinar se necesita el parasimpático: \"pee = parasympathetic\".",
    quiz: [
      { q: "La contracción del detrusor durante la micción depende de:", a: ["Parasimpático S2–S4 (esplácnicos pélvicos)", "Simpático T10–L2", "Nervio pudendo", "Nervio obturador"], ok: 0, why: "El simpático favorece el llenado; el pudendo controla el esfínter externo voluntario." },
      { q: "Hematuria macroscópica indolora en un fumador de 65 años. Sospecha principal:", a: ["Carcinoma urotelial de vejiga", "Litiasis", "Cistitis bacteriana", "Hiperplasia prostática"], ok: 0, why: "El tabaquismo es su principal factor de riesgo; se estudia con cistoscopia y uro-TAC." },
    ],
  },
  pelvis: {
    name: "Pelvis ósea",
    short: "Pelvis",
    level: "Sacro, crestas ilíacas, estrecho superior",
    sections: [
      ["Anatomía", ["El anillo del modelo es el estrecho superior (línea terminal). Las esferas son las espinas ilíacas anterosuperiores (EIAS).", "La línea entre las crestas ilíacas (Tuffier) cruza L4."]],
      ["Correlación clínica ENARM", ["Fractura pélvica inestable: hemorragia retroperitoneal (plexo venoso presacro); colocar faja pélvica.", "Sangre en el meato uretral: no sondear; hacer uretrografía retrógrada."]],
    ],
    pearl: "Crestas ilíacas = L4: guía para la punción lumbar.",
    quiz: [
      { q: "Fractura pélvica con sangre en el meato uretral. Antes de colocar sonda Foley:", a: ["Uretrografía retrógrada", "Colocar la sonda de inmediato", "Cistoscopia", "TAC de cráneo"], ok: 0, why: "Sondear una uretra lesionada puede convertir una rotura parcial en completa." },
    ],
  },
  columna: {
    name: "Columna y niveles vertebrales",
    short: "Columna",
    level: "7 C · 12 T · 5 L · sacro",
    sections: [
      ["Niveles de referencia", ["C6: cricoides, inicio de tráquea y esófago.", "T4–T5: ángulo de Louis, carina, cayado aórtico.", "T8 cava · T10 esófago · T12 aorta y tronco celiaco.", "L1: AMS, píloro, fin de la médula (cono L1–L2 en adultos).", "L4: bifurcación aórtica y crestas ilíacas → punción lumbar en L3–L4 o L4–L5."]],
      ["Correlación clínica ENARM", ["Hernia discal L4–L5 → raíz L5: debilidad para la dorsiflexión del primer dedo.", "Hernia L5–S1 → raíz S1: reflejo aquíleo disminuido y debilidad de la flexión plantar.", "Síndrome de cola de caballo: anestesia en silla de montar y retención urinaria → resonancia y cirugía urgente."]],
    ],
    pearl: "La raíz afectada suele ser la del número inferior del espacio: L5–S1 → S1.",
    quiz: [
      { q: "La línea que une las crestas ilíacas (Tuffier) corresponde a:", a: ["L4 o el espacio L4–L5", "L1", "T12", "S1"], ok: 0, why: "Por eso la punción lumbar se hace en L3–L4 o L4–L5, bajo el cono medular." },
      { q: "Hernia discal posterolateral L5–S1. Raíz afectada:", a: ["S1", "L5", "L4", "S2"], ok: 0, why: "La hernia posterolateral comprime la raíz que sale por el agujero inferior." },
      { q: "Retención urinaria, anestesia en silla de montar y debilidad en piernas tras hernia masiva:", a: ["Síndrome de cola de caballo: cirugía urgente", "Lumbalgia mecánica", "Estenosis foraminal", "Espondilolistesis grado I"], ok: 0, why: "Es una urgencia neuroquirúrgica." },
    ],
  },
  costillas: {
    name: "Caja torácica",
    short: "Costillas",
    level: "12 pares · plastrón condroesternal retirado",
    sections: [
      ["Anatomía", ["Verdaderas 1–7 (al esternón), falsas 8–10, flotantes 11–12. En este modelo se retiró el plastrón condroesternal para ver los órganos.", "Paquete intercostal en el surco costal: vena, arteria y nervio (VAN) de arriba abajo."]],
      ["Correlación clínica ENARM", ["Tórax inestable: fracturas en 2 o más sitios de 2 o más costillas consecutivas → movimiento paradójico.", "Fractura de 1.ª o 2.ª costilla: trauma de alta energía; buscar lesión de grandes vasos.", "Fracturas de costillas 9–11: sospechar lesión de hígado o bazo."]],
    ],
    pearl: "VAN: vena arriba, nervio abajo; la aguja siempre sobre la costilla.",
    quiz: [
      { q: "Tórax inestable se define como:", a: ["Fracturas en 2 o más sitios de 2 o más costillas consecutivas", "Una sola costilla fracturada desplazada", "Fractura esternal aislada", "Fractura de la 1.ª costilla"], ok: 0, why: "El segmento libre se mueve en sentido paradójico con la respiración." },
      { q: "Fractura de costillas izquierdas 9–11 con hipotensión. Órgano más probablemente lesionado:", a: ["Bazo", "Riñón izquierdo", "Páncreas", "Corazón"], ok: 0, why: "El bazo queda justo bajo esas costillas." },
    ],
  },
  cuello: {
    name: "Corte transversal en C7",
    short: "Corte C7",
    level: "Placa grabada en la parte superior del modelo",
    sections: [
      ["Qué muestra la placa", ["Cuerpo vertebral y conducto medular, tráquea (doble círculo) y esófago detrás.", "Rojo: carótidas y subclavia; azul: venas yugulares/braquiocefálicas."]],
      ["Correlación clínica ENARM", ["Vaina carotídea: carótida común (medial), yugular interna (lateral) y nervio vago (posterior, entre ambas).", "Nervio laríngeo recurrente en el surco traqueoesofágico: su lesión en la tiroidectomía causa disfonía.", "El istmo tiroideo cubre los anillos traqueales 2–4."]],
    ],
    pearl: "Vaina carotídea: arteria por dentro, vena por fuera, vago atrás.",
    quiz: [
      { q: "Contenido de la vaina carotídea:", a: ["Carótida común, yugular interna y nervio vago", "Carótida, yugular externa y frénico", "Subclavia, vertebral e hipogloso", "Tráquea, esófago y recurrente"], ok: 0, why: "El vago va posterior, entre la arteria y la vena." },
      { q: "Disfonía después de una tiroidectomía sugiere lesión del:", a: ["Nervio laríngeo recurrente", "Nervio frénico", "Nervio hipogloso", "Nervio accesorio"], ok: 0, why: "Inerva todos los músculos intrínsecos de la laringe excepto el cricotiroideo." },
    ],
  },
};

// Ritmos del monitor: criterio electrocardiográfico y manejo inicial (ACLS / guías vigentes).
export const RHYTHMS = [
  { id: "sinusal", name: "Ritmo sinusal", rate: "72 lpm", text: "Onda P antes de cada QRS, PR 120–200 ms, QRS < 120 ms, FC 60–100 lpm." },
  { id: "taqui", name: "Taquicardia sinusal", rate: "125 lpm", text: "Ritmo sinusal > 100 lpm. Tratar la causa: fiebre, dolor, hipovolemia, anemia, hipertiroidismo." },
  { id: "bradi", name: "Bradicardia sinusal", rate: "45 lpm", text: "Sinusal < 60 lpm. Si es sintomática: atropina 1 mg IV cada 3–5 min (máx. 3 mg); si no responde, marcapasos transcutáneo o dopamina/adrenalina." },
  { id: "fa", name: "Fibrilación auricular", rate: "≈ 110 lpm, irregular", text: "Irregularmente irregular, sin ondas P. Inestable → cardioversión sincronizada. Estable → control de frecuencia (betabloqueador) y anticoagular según CHA₂DS₂-VASc." },
  { id: "flutter", name: "Flutter auricular 2:1", rate: "150 lpm", text: "Ondas F en dientes de sierra a ~300/min (mejor en DII, DIII, aVF), conducción 2:1. Sospecharlo ante FC regular de 150." },
  { id: "bav3", name: "BAV de tercer grado", rate: "P 80 · QRS 38", text: "Disociación AV: P y QRS sin relación, escape ancho y lento. Tratamiento: marcapasos (transcutáneo de inicio, luego definitivo)." },
  { id: "tv", name: "Taquicardia ventricular", rate: "180 lpm", text: "QRS ancho (> 120 ms), regular, monomórfica. Con pulso inestable → cardioversión sincronizada; estable → amiodarona. Sin pulso → desfibrilación." },
  { id: "fv", name: "Fibrilación ventricular", rate: "sin pulso", text: "Actividad caótica sin QRS identificables: paro cardiaco. RCP de alta calidad y desfibrilación inmediata (ritmo desfibrilable)." },
];
