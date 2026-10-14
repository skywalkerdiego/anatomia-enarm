// Physiology played on the body. Each step has a title, a short text (HTML allowed for <b>), optional
// key facts and a scene: which structures show, what flows (`streak: [mm/s, strength]`, negative
// runs towards where the flow enters), what is tinted, where pins sit and where the camera looks.
// `slow` runs the clock in slow motion; `chart` shows the Wiggers diagram; `anim` runs a live animation.

const HEART = ["corazon", "valvulas", "cor-izq", "cor-da", "cor-cx", "cor-der", "venas-cardiacas"];
const GREAT = ["aorta", "art-pulmonar", "ven-pulmonares", "vcs", "vci"];
const TRUNKS = ["aorta", "vcs", "vci"];
const LUNGS = ["pulmon-der-sup", "pulmon-der-med", "pulmon-der-inf", "pulmon-izq-sup", "pulmon-izq-inf"];
const ARTERIES = ["aorta", "carotidas", "subclavias", "tronco-celiaco", "mesentericas", "art-renales", "art-iliacas"];
const VEINS = ["vcs", "vci", "yugulares", "ven-renales", "ven-iliacas"];
const GUT = ["esofago", "estomago", "duodeno", "yeyuno", "ileon", "colon", "apendice", "recto"];
const each = (ids, fx) => Object.fromEntries(ids.map((id) => [id, fx]));
const ghost = (ids, alpha) => Object.fromEntries(ids.map((id) => [id, alpha]));

export const PROCESSES = [
  {
    id: "ciclo", title: "Ciclo cardiaco", blurb: "Un latido en cámara lenta, fase por fase.", hue: "#e5484d", glyph: "heart", monitor: true,
    vitals: { hr: 72 },
    base: { only: [...HEART, ...TRUNKS], focus: "corazon", zoom: 7.3, turn: -0.3 },
    steps: [
      {
        title: "Llenado ventricular", phase: "llenado", chart: true, slow: 0.3,
        text: "Las válvulas mitral y tricúspide están abiertas y la sangre cae de las aurículas a los ventrículos. <b>Tres cuartas partes del llenado son pasivas</b>: ocurren antes de que la aurícula se contraiga. Fíjate en el plano de las válvulas: sube mientras los ventrículos se relajan.",
        facts: [["70–80 %", "del llenado es pasivo"], ["120 mL", "volumen al final de la diástole"]],
        scene: { pins: [{ at: "@av", text: "Plano de las válvulas" }] },
      },
      {
        title: "Sístole auricular", phase: "auricular", chart: true, slow: 0.3,
        text: "La onda P dispara las aurículas, que empujan el último 20–30 %. Ese aporte se pierde en la fibrilación auricular. Si el ventrículo es rígido, ese golpe de sangre se oye como <b>S4</b>. La pared del corazón está translúcida para que veas las válvulas abiertas.",
        facts: [["20–30 %", "aporta la aurícula"], ["Onda P", "en el ECG"]],
        scene: { ghost: { corazon: 0.34 }, pins: [{ at: "valvulas#mitral valve", text: "Mitral" }, { at: "valvulas#tricuspid valve", text: "Tricúspide", side: "left" }] },
      },
      {
        title: "Contracción isovolumétrica", phase: "isovol", chart: true, slow: 0.25,
        text: "El QRS activa los ventrículos. La presión sube y <b>cierra la mitral y la tricúspide: es el primer ruido, S1</b>. Durante unas centésimas de segundo todas las válvulas están cerradas: la presión se dispara sin que cambie el volumen.",
        facts: [["S1", "cierre mitral y tricuspídeo"], ["0.05 s", "todas las válvulas cerradas"]],
        scene: { pins: [{ at: "@lv", text: "La presión sube" }] },
      },
      {
        title: "Eyección", phase: "eyeccion", chart: true, slow: 0.25,
        text: "Cuando la presión del ventrículo izquierdo supera los 80 mmHg de la aorta, la válvula aórtica se abre. El ventrículo se acorta, se estrecha y gira sobre su eje; expulsa unos 70 mL y la onda de pulso recorre las arterias.",
        facts: [["70 mL", "volumen sistólico"], ["55–70 %", "fracción de eyección"], ["120/80", "presión en la aorta"]],
        scene: { only: [...HEART, ...TRUNKS, "carotidas", "subclavias"], pins: [{ at: "aorta@0.03", text: "Válvula aórtica abierta" }] },
      },
      {
        title: "Relajación isovolumétrica", phase: "relajacion", chart: true, slow: 0.25,
        text: "El ventrículo se relaja y su presión cae por debajo de la aórtica: <b>cierran las válvulas aórtica y pulmonar, el segundo ruido, S2</b>. Coincide con el final de la onda T. Cuando la presión baja de la auricular, la mitral se abre y todo vuelve a empezar.",
        facts: [["S2", "cierre aórtico y pulmonar"], ["Onda T", "repolarización"]],
        scene: { only: [...HEART, ...TRUNKS, "art-pulmonar"], ghost: { "art-pulmonar": 0.5 }, pins: [{ at: "art-pulmonar@0.02", text: "Válvula pulmonar" }] },
      },
      {
        title: "El gasto cardiaco", chart: true, slow: 0.6,
        text: "Gasto cardiaco = frecuencia × volumen sistólico: unos 5 litros por minuto en reposo. El volumen sistólico depende de la <b>precarga</b> (cuánto se llena), la <b>poscarga</b> (contra qué presión expulsa) y la <b>contractilidad</b>. Enciende el sonido del monitor para oír S1 y S2.",
        facts: [["5 L/min", "gasto en reposo"], ["Frank-Starling", "más llenado, más fuerza"]],
      },
    ],
  },
  {
    id: "conduccion", title: "Conducción eléctrica", blurb: "Del nodo sinusal al QRS, sobre el corazón.", hue: "#f5a524", glyph: "flow", monitor: true,
    vitals: { hr: 68 },
    base: { only: [...HEART.filter((id) => id !== "valvulas"), ...TRUNKS], focus: "corazon", zoom: 7.5, turn: -0.35 },
    steps: [
      {
        title: "Nodo sinusal", anim: "conduccion", slow: 0.2,
        text: "El impulso nace en el nodo sinusal, donde la vena cava superior se une a la aurícula derecha. Es el marcapasos porque sus células se despolarizan solas más rápido que las demás.",
        facts: [["60–100/min", "frecuencia propia"], ["60 %", "lo irriga la coronaria derecha"]],
        scene: { pins: [{ at: "@sa", text: "Nodo sinusal", side: "left" }] },
      },
      {
        title: "Aurículas: la onda P", anim: "conduccion", slow: 0.2,
        text: "La onda dorada recorre las aurículas de derecha a izquierda. En el ECG es la onda P; después las aurículas se contraen y terminan de llenar los ventrículos.",
        facts: [["< 0.12 s", "duración de la onda P"]],
        scene: { pins: [{ at: "@sa", text: "Nodo sinusal", side: "left" }] },
      },
      {
        title: "Nodo AV: la pausa", anim: "conduccion", slow: 0.2,
        text: "El nodo auriculoventricular retrasa el impulso una décima de segundo. Esa pausa es el segmento PR y da tiempo a que los ventrículos se llenen. También filtra: en la fibrilación auricular impide que pasen 400 impulsos por minuto.",
        facts: [["0.12–0.20 s", "intervalo PR normal"], ["80–90 %", "lo irriga la coronaria derecha"]],
        scene: { pins: [{ at: "@av", text: "Nodo AV" }] },
      },
      {
        title: "His y Purkinje: el QRS", anim: "conduccion", slow: 0.2,
        text: "El haz de His se divide en dos ramas y la red de Purkinje activa los ventrículos en menos de 0.12 s: primero el septum, luego la punta y al final las bases. Por eso la contracción exprime la sangre hacia las válvulas de salida.",
        facts: [["< 0.12 s", "QRS normal"], ["Punta → base", "orden de activación"]],
        scene: { pins: [{ at: "@apex", text: "Punta del corazón" }] },
      },
      {
        title: "Repolarización: la onda T", anim: "conduccion", slow: 0.2,
        text: "Los ventrículos se recargan: es el segmento ST y la onda T (el resplandor azul). El intervalo QT mide toda la actividad eléctrica ventricular; si se alarga, hay riesgo de taquicardia helicoidal.",
        facts: [["QTc < 450 ms", "límite en hombres"], ["QTc < 460 ms", "límite en mujeres"]],
      },
      {
        title: "Cuando la conducción falla", slow: 0.5,
        vitals: { rhythm: "bav3", hr: 38, sys: 98, dia: 56 },
        text: "<b>Primer grado:</b> PR mayor de 0.20 s; todas las P conducen. <b>Mobitz I:</b> el PR se alarga hasta que una P no conduce. <b>Mobitz II:</b> una P no conduce sin aviso; necesita marcapasos. <b>Tercer grado</b>, el del monitor: las P y los QRS van cada uno por su lado.",
        facts: [["Mobitz II y 3.er grado", "marcapasos"], ["Atropina", "primera línea si hay síntomas"]],
      },
    ],
  },
  {
    id: "circulacion", title: "Circulación", blurb: "El viaje de la sangre: mayor, menor y porta.", hue: "#3e63dd", glyph: "turn", monitor: true,
    base: { only: [...HEART.filter((id) => id !== "valvulas"), ...GREAT, ...ARTERIES, ...VEINS, "porta", ...LUNGS, "higado", "rinon-der", "rinon-izq", "bazo"], ghost: { ...ghost(LUNGS, 0.3), higado: 0.45 }, focus: [0, 0, 1170], zoom: 3.6, turn: -0.2 },
    steps: [
      {
        title: "Retorno venoso",
        text: "La sangre que ya dejó su oxígeno en los tejidos regresa por las venas cavas a la aurícula derecha. Las venas guardan dos tercios de toda la sangre: son el reservorio del que el corazón echa mano.",
        facts: [["65 %", "de la sangre está en las venas"], ["2–8 mmHg", "presión venosa central"]],
        scene: { fx: each(VEINS, { streak: [-170, 0.6] }), pins: [{ at: "vcs", text: "Cava superior", side: "left" }, { at: "vci@0.5", text: "Cava inferior", side: "left" }] },
      },
      {
        title: "Al pulmón por la arteria pulmonar",
        text: "El ventrículo derecho la impulsa por la arteria pulmonar: la única arteria que lleva sangre pobre en oxígeno, por eso es azul. Trabaja a baja presión, una sexta parte de la del lado izquierdo.",
        facts: [["25/10 mmHg", "presión pulmonar"], ["5 L/min", "igual que el lado izquierdo"]],
        scene: { focus: [0, 0, 1260], zoom: 4.9, fx: { "art-pulmonar": { streak: [230, 0.65] } }, pins: [{ at: "art-pulmonar@0.1", text: "Tronco pulmonar" }] },
      },
      {
        title: "Hematosis y regreso",
        text: "En los capilares que envuelven a los alvéolos la sangre suelta CO₂ y toma O₂ en un cuarto de segundo. Vuelve roja a la aurícula izquierda por las venas pulmonares.",
        facts: [["0.25 s", "basta para oxigenarla"], ["4", "venas pulmonares"]],
        scene: { focus: [0, 0, 1260], zoom: 4.9, fx: { "ven-pulmonares": { streak: [-190, 0.65] }, ...each(LUNGS, { tint: ["oxigenada", 0.16] }) }, pins: [{ at: "@la", text: "Aurícula izquierda" }] },
      },
      {
        title: "La aorta reparte",
        text: "El ventrículo izquierdo expulsa a la aorta a 120/80 mmHg. Del cayado salen las ramas de la cabeza y los brazos; de la aorta abdominal, el tronco celiaco, las mesentéricas, las renales y las ilíacas.",
        facts: [["20–25 %", "va a los riñones"], ["15 %", "al cerebro"], ["5 %", "a las coronarias"]],
        scene: { zoom: 3.1, focus: [0, 0, 1150], fx: each(ARTERIES, { streak: [300, 0.5] }), pins: [{ at: "aorta@0.13", text: "Cayado (T4)" }, { at: "tronco-celiaco", text: "Tronco celiaco (T12)" }, { at: "art-renales", text: "Renales (L1–L2)", side: "left" }, { at: "aorta@0.98", text: "Bifurcación (L4)" }] },
      },
      {
        title: "Las coronarias se llenan en diástole",
        text: "El corazón se irriga a sí mismo cuando se relaja: en sístole el músculo aprieta sus propios vasos. Por eso la taquicardia, que acorta la diástole, puede causar isquemia.",
        facts: [["Diástole", "momento del flujo coronario"], ["70–80 %", "del O₂ lo extrae el miocardio"]],
        scene: { only: [...HEART.filter((id) => id !== "valvulas"), ...TRUNKS], ghost: {}, focus: "corazon", zoom: 7.5, fx: each(["cor-izq", "cor-da", "cor-cx", "cor-der"], { streak: [110, 0.7] }), pins: [{ at: "cor-da@0.5/anterior interventricular branch of left coronary artery, nsn", text: "Descendente anterior" }, { at: "cor-der@0.5/trunk of right coronary artery", text: "Coronaria derecha", side: "left" }] },
      },
      {
        title: "El sistema porta",
        text: "La sangre del intestino y del bazo no vuelve directo al corazón: pasa antes por el hígado por la vena porta. Son dos redes capilares en serie. Aquí ocurre el metabolismo de primer paso de lo que tragas.",
        facts: [["75 %", "del flujo hepático llega por la porta"], ["Primer paso", "el hígado filtra antes que nadie"]],
        scene: { ghost: { higado: 0.4 }, focus: "porta", zoom: 5.4, fx: { porta: { streak: [-90, 0.7] } }, pins: [{ at: "porta@0.1", text: "Hacia la porta" }, { at: "bazo", text: "Bazo" }] },
      },
    ],
  },
  {
    id: "respiracion", title: "Respiración", blurb: "Diafragma, aire, alvéolos y quién manda.", hue: "#22a8c9", glyph: "body", monitor: true,
    vitals: { rr: 12, depth: 1.5 },
    base: { only: [...LUNGS, "traquea", "bronquios", "diafragma", "laringe", "costillas", "cartilagos", "esternon"], ghost: ghost(["costillas", "cartilagos", "esternon"], 0.24), focus: [0, 0, 1265], zoom: 4.2, turn: -0.25 },
    steps: [
      {
        title: "Inspiración",
        text: "El diafragma se contrae y sus cúpulas bajan; las costillas suben y se abren. El tórax crece, la presión dentro de los alvéolos cae por debajo de la atmosférica y el aire entra. Es trabajo muscular.",
        facts: [["C3–C5", "nervio frénico"], ["500 mL", "volumen corriente"], ["−1 cmH₂O", "presión alveolar"]],
        scene: { pins: [{ at: "diafragma", text: "Diafragma" }] },
      },
      {
        title: "Espiración",
        text: "En reposo es pasiva: el diafragma se relaja y la elasticidad del pulmón lo regresa a su tamaño. Solo al toser o en el ejercicio empujan los músculos abdominales. En el asma y la EPOC lo difícil es sacar el aire: mira cómo se alarga la salida.",
        facts: [["Pasiva", "en reposo"], ["FEV1/FVC < 0.70", "obstrucción"]],
        vitals: { pattern: "obstructivo", rr: 12, depth: 1.5 },
      },
      {
        title: "El árbol bronquial",
        text: "La tráquea se divide en la carina, a la altura de T4–T5. Hasta los bronquiolos terminales solo se conduce aire: es el espacio muerto anatómico. El bronquio derecho es más corto, ancho y vertical: ahí caen los cuerpos extraños.",
        facts: [["150 mL", "espacio muerto anatómico"], ["23", "generaciones de vías aéreas"]],
        scene: { ghost: { ...ghost(["costillas", "cartilagos", "esternon"], 0.12), ...ghost(LUNGS, 0.22) }, fx: { traquea: { streak: [170, 0.6] }, bronquios: { streak: [170, 0.6] } }, pins: [{ at: "bronquios@0.03", text: "Carina" }] },
      },
      {
        title: "Intercambio de gases",
        text: "Cada alvéolo está envuelto en capilares. El O₂ pasa a la sangre y el CO₂ sale por difusión, a través de una membrana de media micra. La sangre llega azul por la arteria pulmonar y sale roja por las venas pulmonares.",
        facts: [["80–100 mmHg", "PaO₂"], ["35–45 mmHg", "PaCO₂"], ["0.5 µm", "membrana alveolocapilar"]],
        scene: { only: [...LUNGS, "traquea", "bronquios", "art-pulmonar", "ven-pulmonares", "corazon"], ghost: ghost(LUNGS, 0.26), fx: { "art-pulmonar": { streak: [200, 0.6] }, "ven-pulmonares": { streak: [-170, 0.6] } }, pins: [{ at: "art-pulmonar@0.5", text: "Llega sin oxígeno" }, { at: "ven-pulmonares@0.4", text: "Sale oxigenada", side: "left" }] },
      },
      {
        title: "Ventilación y perfusión",
        text: "De pie, las bases reciben más aire y mucha más sangre que los vértices. Si un alvéolo se perfunde pero no se ventila hay <b>cortocircuito</b> (neumonía, atelectasia). Si se ventila pero no se perfunde hay <b>espacio muerto</b> (tromboembolia).",
        facts: [["V/Q ≈ 3", "en los vértices"], ["V/Q ≈ 0.6", "en las bases"]],
        scene: { only: [...LUNGS, "traquea", "bronquios"], ghost: {}, fx: { ...each(["pulmon-der-inf", "pulmon-izq-inf"], { tint: ["desoxigenada", 0.3] }), ...each(["pulmon-der-sup", "pulmon-izq-sup"], { tint: ["aire", 0.34] }) }, pins: [{ at: "pulmon-der-sup", text: "Más aire que sangre", side: "left" }, { at: "pulmon-izq-inf", text: "Más sangre que aire" }] },
      },
      {
        title: "Quién marca el ritmo",
        text: "El centro respiratorio está en el bulbo. Los quimiorreceptores centrales responden al CO₂, por el pH del líquido cefalorraquídeo; los del cuerpo carotídeo, a la falta de oxígeno cuando la PaO₂ baja de 60 mmHg.",
        facts: [["CO₂", "estímulo principal"], ["PaO₂ < 60", "despierta al cuerpo carotídeo"]],
        scene: { only: [...LUNGS, "traquea", "bronquios", "diafragma", "tronco", "cerebelo", "carotidas", "aorta", "laringe"], ghost: ghost(LUNGS, 0.5), focus: [0, 0, 1400], zoom: 3.9, pins: [{ at: "tronco", text: "Centro respiratorio" }, { at: "carotidas@0.95", text: "Cuerpo carotídeo", side: "left" }] },
      },
    ],
  },
  {
    id: "digestion", title: "Digestión", blurb: "Sigue un bocado desde el esófago hasta el colon.", hue: "#e08a3c", glyph: "pin", monitor: false,
    base: { only: [...GUT, "higado", "vesicula", "pancreas"], ghost: { higado: 0.5 }, focus: [0, 0, 1090], zoom: 4.2, turn: -0.1 },
    steps: [
      {
        title: "Deglución y esófago", anim: "bolo", bolo: [0, 262, 5],
        text: "Al tragar, una onda peristáltica lleva el bolo por el esófago en unos ocho segundos y el esfínter esofágico inferior se relaja para dejarlo pasar. Si no se relaja es acalasia; si queda flojo, reflujo.",
        facts: [["25 cm", "longitud del esófago"], ["T10", "hiato esofágico"]],
        scene: { focus: "esofago", zoom: 4.8, ghost: { higado: 0.25 } },
      },
      {
        title: "Estómago", anim: "bolo", bolo: [258, 426, 7],
        text: "El estómago guarda, mezcla y tritura. Las células parietales secretan ácido clorhídrico y factor intrínseco; las principales, pepsinógeno. La gastrina, la histamina y el vago estimulan el ácido.",
        facts: [["pH 1–2", "jugo gástrico"], ["2–4 h", "vaciamiento de una comida"]],
        scene: { focus: "estomago", zoom: 5.8, ghost: { higado: 0.25 }, fx: { estomago: { wave: [16, 120, 2.6, 1] } } },
      },
      {
        title: "Duodeno: bilis y jugo pancreático", anim: "bolo", bolo: [406, 610, 7],
        text: "La grasa y los aminoácidos liberan colecistocinina: la vesícula se contrae y el páncreas vierte sus enzimas. El ácido libera secretina y el páncreas responde con bicarbonato. Todo entra por la ampolla de Vater.",
        facts: [["CCK", "contrae la vesícula"], ["Secretina", "bicarbonato pancreático"]],
        scene: { focus: "duodeno", zoom: 6.1, ghost: { higado: 0.3, estomago: 0.3 }, fx: { vesicula: { tint: ["bilis", 0.45] }, pancreas: { tint: ["alimento", 0.3] } }, pins: [{ at: "vesicula", text: "Bilis", side: "left" }, { at: "pancreas", text: "Enzimas y bicarbonato" }] },
      },
      {
        title: "Yeyuno e íleon: absorción", anim: "bolo", bolo: [580, 1105, 12],
        text: "Seis metros de pliegues y vellosidades absorben casi todo. <b>Hierro en el duodeno, folato en el yeyuno, vitamina B12 y sales biliares en el íleon terminal.</b>",
        facts: [["9 L al día", "líquido que entra al intestino"], ["3–5 h", "tránsito del intestino delgado"]],
        scene: { focus: [0, -20, 1010], zoom: 5.1, only: [...GUT], pins: [{ at: "yeyuno", text: "Yeyuno: folato" }, { at: "ileon", text: "Íleon: B12", side: "left" }] },
      },
      {
        title: "Hígado: el primer paso",
        text: "Lo absorbido viaja por la vena porta al hígado antes de llegar al resto del cuerpo. Las grasas van por otro camino: entran a los linfáticos como quilomicrones.",
        facts: [["1.5 kg", "peso del hígado"], ["Bilis", "0.5–1 L al día"]],
        scene: { only: [...GUT, "higado", "vesicula", "pancreas", "porta", "bazo"], ghost: { estomago: 0.35 }, focus: "higado", zoom: 5.1, fx: { porta: { streak: [-90, 0.7] } }, pins: [{ at: "porta@0.1", text: "Vena porta" }] },
      },
      {
        title: "Colon", anim: "bolo", bolo: [1112, 1850, 14],
        text: "El colon recupera agua y electrolitos y aloja a la microbiota. Lo que llega líquido al ciego sale formado: de litro y medio que entra, se pierden unos 100 mL.",
        facts: [["12–48 h", "tránsito del colon"], ["Ángulo esplénico", "frontera entre mesentéricas"]],
        scene: { only: [...GUT], ghost: { yeyuno: 0.3, ileon: 0.3 }, focus: "colon", zoom: 4.4, pins: [{ at: "colon@0.02", text: "Ciego", side: "left" }, { at: "colon@0.5", text: "Ángulo esplénico" }] },
      },
    ],
  },
  {
    id: "orina", title: "Formación de orina", blurb: "Del filtrado glomerular a la micción.", hue: "#c9a227", glyph: "info", monitor: false,
    base: { only: ["rinon-der", "rinon-izq", "suprarrenales", "ureteres", "vejiga", "prostata", "aorta", "art-renales", "vci", "ven-renales", "art-iliacas", "ven-iliacas"], focus: [0, 0, 1010], zoom: 4.2, turn: -0.15 },
    steps: [
      {
        title: "Los riñones filtran el plasma",
        text: "Reciben la quinta parte del gasto cardiaco y filtran unos 125 mL de plasma por minuto: 180 litros al día, de los que se orina menos de 1 %.",
        facts: [["20–25 %", "del gasto cardiaco"], ["125 mL/min", "filtrado glomerular"], ["180 L al día", "filtrado"]],
        scene: { fx: { "art-renales": { streak: [200, 0.7] }, "ven-renales": { streak: [-150, 0.6] } }, pins: [{ at: "art-renales", text: "Arterias renales" }] },
      },
      {
        title: "La nefrona, tramo por tramo",
        text: "<b>Glomérulo:</b> filtra por presión. <b>Túbulo proximal:</b> recupera dos tercios del sodio y el agua y toda la glucosa. <b>Asa de Henle:</b> concentra la médula; ahí actúa la furosemida. <b>Túbulo distal:</b> sitio de las tiazidas. <b>Colector:</b> la aldosterona ahorra sodio y la ADH abre canales de agua.",
        facts: [["1 millón", "de nefronas por riñón"], ["180 mg/dL", "umbral renal de la glucosa"]],
        scene: { focus: "rinon-izq", zoom: 7.5, select: "rinon-izq" },
      },
      {
        title: "Uréteres", anim: "orina",
        text: "La orina baja por ondas peristálticas, no por gravedad. Hay tres sitios estrechos donde se atoran los cálculos: la unión con la pelvis renal, el cruce sobre los vasos ilíacos y la entrada a la vejiga, que es el más estrecho.",
        facts: [["25–30 cm", "longitud"], ["1–5 por minuto", "ondas peristálticas"]],
        scene: { fx: { ureteres: { tint: ["orina", 0.4] } }, pins: [{ at: "ureteres@0.04/left ureter", text: "Unión pieloureteral" }, { at: "ureteres@0.62/left ureter", text: "Cruce ilíaco" }, { at: "ureteres@0.97/left ureter", text: "Entrada a la vejiga" }] },
      },
      {
        title: "Vejiga y micción",
        text: "La vejiga se llena a baja presión hasta unos 400 mL. Para vaciarla, el parasimpático sacro contrae el detrusor y los esfínteres se relajan. El simpático hace lo contrario: guarda.",
        facts: [["400–500 mL", "capacidad"], ["S2–S4", "reflejo de la micción"]],
        scene: { focus: "vejiga", zoom: 6.8, fx: { vejiga: { swell: 4.5, tint: ["orina", 0.35] } }, pins: [{ at: "vejiga", text: "Detrusor" }] },
      },
      {
        title: "Quién regula",
        text: "Si baja la perfusión renal, la renina activa a la angiotensina II, que cierra la arteriola de salida, y a la aldosterona. Las prostaglandinas mantienen abierta la de entrada. Por eso un antiinflamatorio junto con un IECA y un diurético puede desplomar el filtrado.",
        facts: [["Renina", "la libera el aparato yuxtaglomerular"], ["Aldosterona", "corteza suprarrenal"]],
        scene: { fx: { suprarrenales: { tint: ["electrico", 0.55] } }, pins: [{ at: "suprarrenales", text: "Aldosterona" }] },
      },
    ],
  },
  {
    id: "ciclo-menstrual", model: "mujer", title: "Ciclo menstrual", blurb: "Ovario, endometrio y hormonas en 28 días.", hue: "#d6409f", glyph: "flow", monitor: false,
    base: { only: ["utero", "ovarios", "trompas", "vagina", "vejiga", "recto", "pelvis", "sacro", "vasos-gonadales", "art-iliacas", "ven-iliacas"], ghost: { pelvis: 0.18, sacro: 0.18, vejiga: 0.5, recto: 0.5 }, focus: "utero", zoom: 9, turn: -0.35, pitch: 0.3 },
    steps: [
      {
        title: "Menstruación (días 1–5)",
        text: "Al caer la progesterona, la capa funcional del endometrio se descama y sangra. Al mismo tiempo sube la <b>FSH</b> y recluta una cohorte de folículos en los ovarios.",
        facts: [["28 ± 7 días", "duración normal del ciclo"], ["2–7 días", "sangrado normal"]],
        scene: { fx: { utero: { tint: ["sangre", 0.42] }, vagina: { tint: ["sangre", 0.3] } }, pins: [{ at: "utero#body of uterus", text: "Endometrio que se descama" }] },
      },
      {
        title: "Fase folicular (días 6–13)",
        text: "Un folículo se vuelve dominante y fabrica <b>estradiol</b>. El estrógeno hace crecer el endometrio (fase proliferativa) y vuelve el moco cervical claro y elástico, fácil de atravesar.",
        facts: [["Estradiol", "lo produce el folículo dominante"], ["Proliferativo", "endometrio en esta fase"]],
        scene: { fx: { ovarios: { spot: ["ovarios#right ovary", 11, "alimento", 0.95] }, utero: { swell: 1.2 } }, pins: [{ at: "ovarios#right ovary", text: "Folículo dominante" }] },
      },
      {
        title: "Ovulación (día 14)",
        text: "El estradiol alto dispara el <b>pico de LH</b>; 24 a 36 horas después el folículo se rompe. Las fimbrias barren el ovocito hacia la trompa, y la fecundación ocurre en la <b>ampolla</b>.",
        facts: [["Pico de LH", "24–36 h antes"], ["Ampolla", "sitio de la fecundación"]],
        scene: { fx: { ovarios: { spot: ["ovarios#right ovary", 14, "electrico", 1] }, trompas: { tint: ["electrico", 0.12] } }, pins: [{ at: "ovarios#right ovary", text: "Ovocito liberado", side: "left" }, { at: "trompas#left uterine tube", text: "Ampolla de la trompa" }] },
      },
      {
        title: "Fase lútea (días 15–28)",
        text: "Lo que queda del folículo se vuelve <b>cuerpo lúteo</b> y produce progesterona: el endometrio se vuelve secretor, listo para recibir un embrión, y la temperatura basal sube medio grado.",
        facts: [["14 días", "fase lútea casi fija"], ["Progesterona", "endometrio secretor"]],
        scene: { fx: { ovarios: { spot: ["ovarios#right ovary", 12, "calculo", 0.95] }, utero: { swell: 2, tint: ["inflamado", 0.12] } }, pins: [{ at: "ovarios#right ovary", text: "Cuerpo lúteo" }] },
      },
      {
        title: "Si hay embarazo",
        text: "El blastocisto se implanta 6 a 7 días después de la fecundación, casi siempre en el fondo uterino. La <b>hCG</b> del trofoblasto mantiene vivo al cuerpo lúteo hasta que la placenta toma el relevo, hacia las 10 semanas.",
        facts: [["Día 6–7", "implantación"], ["hCG", "se duplica cada 48 h al inicio"]],
        scene: { fx: { utero: { swell: 2, spot: ["utero#body of uterus", 12, "alimento", 0.8] } }, pins: [{ at: "utero#body of uterus", text: "Implantación" }] },
      },
      {
        title: "Para el examen",
        text: "Sin ovulación no hay cuerpo lúteo ni progesterona: el estrógeno sin oposición engruesa el endometrio y sangra de forma irregular (síndrome de ovario poliquístico). Los anticonceptivos combinados evitan el pico de LH. El sangrado uterino anormal se clasifica con PALM-COEIN.",
        facts: [["PALM-COEIN", "causas de sangrado anormal"], ["Sin progesterona", "riesgo de hiperplasia endometrial"]],
      },
    ],
  },
];
