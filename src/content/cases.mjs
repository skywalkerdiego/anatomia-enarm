// Clinical cases. A case has a vignette (`intro`) and a chain of `nodes`:
//   a question   { q, options, ok, why, lead?, vitals?, after?: { scene, vitals } }
//   a frame      { title, text, facts?, scene, vitals? }   — what the disease is doing, shown on the body
// Scenes use the same vocabulary as the processes. The first option listed is never assumed
// correct: `ok` is its index, and the page shuffles the options.

const HEART = ["corazon", "cor-izq", "cor-da", "cor-cx", "cor-der", "venas-cardiacas"];
const GREAT = ["aorta", "art-pulmonar", "ven-pulmonares", "vcs", "vci"];
const LUNGS = ["pulmon-der-sup", "pulmon-der-med", "pulmon-der-inf", "pulmon-izq-sup", "pulmon-izq-inf"];
const CAGE = ["costillas", "cartilagos", "esternon"];
const CORTEX = ["lob-frontal", "giro-precentral", "giro-poscentral", "lob-parietal", "lob-temporal", "insula"];
const each = (ids, fx) => Object.fromEntries(ids.map((id) => [id, fx]));
const ghost = (ids, alpha) => Object.fromEntries(ids.map((id) => [id, alpha]));
const MCA = [54, 4, 1592];

export const CASES = [
  {
    id: "iam", title: "Dolor torácico opresivo", area: "Cardiología", hue: "#e5484d", glyph: "heart", level: 2, organs: ["coronarias", "corazon"],
    patient: "Hombre de 58 años · diabético, hipertenso y fumador",
    base: { only: [...HEART, "aorta", "vcs", "vci"], focus: "corazon", zoom: 7.1, turn: -0.6 },
    intro: {
      text: "Llega a urgencias con dolor retroesternal opresivo de 40 minutos, irradiado a la mandíbula, con sudoración fría y náusea. El electrocardiograma muestra elevación del ST en DII, DIII y aVF.",
      exam: ["Pálido y diaforético", "Ruidos cardiacos rítmicos, sin soplos", "Campos pulmonares limpios"],
      vitals: { hr: 54, sys: 98, dia: 60, rr: 20, spo2: 95, st: 0.34 },
    },
    nodes: [
      { q: "¿Qué arteria está ocluida con mayor probabilidad?", options: ["Coronaria derecha", "Descendente anterior", "Circunfleja", "Tronco coronario izquierdo"], ok: 0, why: "La cara inferior depende de la coronaria derecha en más de 80 % de las personas. Esa arteria también irriga los nodos sinusal y AV: por eso está bradicárdico." },
      {
        title: "Qué está pasando",
        text: "Una placa de ateroma se rompió dentro de la coronaria derecha y sobre ella se formó un trombo que <b>tapó la arteria</b>. Más allá del trombo ya no hay flujo: la pared inferior del ventrículo deja de contraerse en segundos y empieza a morir en unos 20 minutos. La mancha oscura es el músculo en isquemia.",
        facts: [["20 min", "empieza la necrosis"], ["Tiempo = músculo", "cada minuto cuenta"]],
        scene: { fx: { "cor-der": { cut: "cor-der@0.45/trunk of right coronary artery" }, corazon: { spot: ["@inferior", 54, "isquemia", 0.9] } }, pins: [{ at: "cor-der@0.45/trunk of right coronary artery", text: "Trombo", tone: "bad" }, { at: "@inferior", text: "Músculo en isquemia", side: "left" }], contract: 0.75 },
      },
      { q: "El hospital tiene sala de hemodinamia disponible. ¿Cómo lo reperfundes?", options: ["Fibrinólisis inmediata aunque la sala esté libre", "Intervención coronaria percutánea primaria, con meta puerta-balón de 90 minutos o menos", "Esperar las troponinas para confirmar", "Prueba de esfuerzo cuando ceda el dolor"], ok: 1, why: "Con elevación del ST el diagnóstico es electrocardiográfico: no se esperan biomarcadores. La angioplastia primaria es la mejor reperfusión si puede hacerse a tiempo; la fibrinólisis queda para cuando no se alcanza en 120 minutos." },
      { q: "Tiene presión de 98/60, ingurgitación yugular y pulmones limpios. Antes de dar nitroglicerina, ¿qué haces?", options: ["Nitroglicerina sublingual: es parte del manejo habitual", "Furosemida, por la ingurgitación yugular", "Tomo derivaciones derechas (V4R): si hay infarto del ventrículo derecho evito los nitratos y doy líquidos", "Morfina y betabloqueador intravenoso"], ok: 2, why: "El infarto inferior alcanza al ventrículo derecho en un tercio de los casos. Ese ventrículo depende de la precarga: los nitratos, los diuréticos y la morfina pueden hundir la presión." },
      {
        title: "Reperfusión",
        text: "El balón abre la arteria y se coloca un stent. La sangre vuelve a pasar, el ST baja y el dolor cede. El músculo que estaba aturdido pero vivo recupera su movimiento en días.",
        facts: [["Aspirina + inhibidor P2Y12", "doble antiagregación"], ["Estatina de alta intensidad", "desde el ingreso"]],
        scene: { fx: { corazon: { spot: ["@inferior", 24, "isquemia", 0.3] } }, pins: [{ at: "cor-der@0.45/trunk of right coronary artery", text: "Stent", tone: "good" }] },
        vitals: { hr: 70, sys: 116, dia: 72, st: 0.03, spo2: 97 },
      },
    ],
    pearls: ["DII, DIII y aVF: coronaria derecha. V1–V4: descendente anterior. DI, aVL, V5–V6: circunfleja.", "Con elevación del ST se reperfunde sin esperar troponinas.", "Infarto inferior con hipotensión y pulmones limpios: piensa en el ventrículo derecho y evita los nitratos."],
  },
  {
    id: "neumotorax", title: "Motociclista que no puede respirar", area: "Urgencias", hue: "#22a8c9", glyph: "body", level: 1, organs: ["pulmon-izq", "pulmon-der", "costillas"],
    patient: "Hombre de 24 años · accidente en motocicleta",
    base: { only: [...LUNGS, "traquea", "corazon", "aorta", "vcs", "vci", "diafragma", ...CAGE], ghost: ghost(CAGE, 0.2), focus: [0, 0, 1265], zoom: 4.2, turn: -0.1 },
    intro: {
      text: "Lo trae la ambulancia con dificultad respiratoria intensa y dolor en el lado derecho del tórax. Está agitado y cada vez respira peor.",
      exam: ["Ingurgitación yugular", "Tráquea desviada hacia la izquierda", "Hemitórax derecho hiperresonante y sin ruidos respiratorios"],
      vitals: { hr: 132, sys: 82, dia: 50, rr: 34, spo2: 84, depth: 0.6, perf: 0.6 },
      scene: { lungs: { der: 0.5 } },
    },
    nodes: [
      { q: "¿Cuál es el diagnóstico?", options: ["Taponamiento cardiaco", "Hemotórax masivo derecho", "Neumotórax a tensión derecho", "Tórax inestable"], ok: 2, why: "Hiperresonancia sin ruidos respiratorios, tráquea desviada al lado contrario e ingurgitación yugular. El hemotórax es mate a la percusión; en el taponamiento los ruidos respiratorios se conservan." },
      {
        title: "Qué está pasando",
        text: "La pleura rota funciona como una válvula: en cada inspiración entra aire al espacio pleural y no puede salir. La presión <b>colapsa el pulmón derecho</b> y empuja el corazón y la tráquea hacia la izquierda. Las venas cavas se acodan, la sangre no regresa al corazón y la presión se desploma: es un choque obstructivo.",
        facts: [["Choque obstructivo", "no llega sangre al corazón"], ["Clínico", "el diagnóstico no espera imagen"]],
        scene: { lungs: { der: 0.92 }, fx: { ...each(["corazon", "aorta", "vcs", "vci"], { push: [24, 0, 0] }), traquea: { push: [15, 0, 0] } }, pins: [{ at: "pulmon-der-med", text: "Pulmón colapsado", tone: "bad", side: "left" }, { at: "traquea", text: "Tráquea desviada" }, { at: "vci@0.08", text: "Cava acodada" }] },
        vitals: { hr: 142, sys: 70, dia: 44, spo2: 80, perf: 0.45 },
      },
      { q: "¿Qué sigue?", options: ["Radiografía portátil de tórax para confirmar", "Descompresión inmediata, sin esperar estudios", "Tomografía de tórax", "Intubación y ventilación con presión positiva"], ok: 1, why: "Esperar una imagen puede costarle la vida, y la presión positiva sin descomprimir mete más aire al espacio pleural." },
      {
        q: "En un adulto, ¿dónde descomprimes según ATLS, 10.ª edición?", options: ["Segundo espacio intercostal, línea axilar posterior", "Séptimo espacio intercostal, línea escapular", "Subxifoideo", "Quinto espacio intercostal, por delante de la línea axilar media"], ok: 3,
        why: "En adultos la pared es más delgada en el 4.º–5.º espacio, por delante de la línea axilar media. El 2.º espacio en la línea medioclavicular se conserva para niños. Después se coloca una sonda pleural en ese mismo sitio.",
        after: { scene: { lungs: { der: 0.12 }, pins: [{ at: "pulmon-der-inf", text: "Sonda pleural", tone: "good", side: "left" }] }, vitals: { hr: 104, sys: 114, dia: 70, rr: 22, spo2: 95, perf: 1, depth: 1 } },
      },
    ],
    pearls: ["Neumotórax a tensión: se trata con lo que encuentras en la exploración, no con la radiografía.", "Adulto: 4.º–5.º espacio intercostal, por delante de la línea axilar media. Niño: 2.º espacio, línea medioclavicular.", "La aguja o el dedo solo ganan tiempo: el tratamiento definitivo es la sonda pleural."],
  },
  {
    id: "tep", title: "Disnea súbita tras una cirugía", area: "Neumología", hue: "#3e63dd", glyph: "flow", level: 2, organs: ["pulmonar", "cavas"],
    patient: "Hombre de 62 años · prótesis de rodilla hace 8 días",
    base: { only: [...LUNGS, "corazon", ...GREAT, "ven-iliacas", "ven-renales"], ghost: ghost(LUNGS, 0.3), focus: [0, 0, 1130], zoom: 3.2, turn: -0.2 },
    intro: {
      text: "Mientras caminaba en casa empezó con falta de aire súbita y dolor en el costado izquierdo que aumenta al respirar. No se ha puesto la heparina que le indicaron.",
      exam: ["Pierna izquierda aumentada de volumen y dolorosa", "Campos pulmonares sin estertores", "Segundo ruido pulmonar reforzado"],
      labs: [["Taquicardia sinusal", "electrocardiograma"], ["Normal", "radiografía de tórax"]],
      vitals: { hr: 118, sys: 108, dia: 68, rr: 26, spo2: 89 },
    },
    nodes: [
      { q: "La escala de Wells indica probabilidad alta de tromboembolia pulmonar. ¿Qué estudio pides?", options: ["Dímero D", "Angiotomografía pulmonar", "Ecocardiograma y, si es normal, alta", "Repetir la radiografía en 6 horas"], ok: 1, why: "Con probabilidad alta el dímero D no descarta nada: se va directo a la imagen. La radiografía normal en un paciente con disnea e hipoxemia es, de hecho, un dato a favor." },
      {
        title: "Qué está pasando",
        text: "Un trombo formado en las venas profundas de la pierna se soltó, subió por la vena cava inferior, cruzó el corazón derecho y <b>se atoró en la arteria pulmonar</b>. Esa parte del pulmón sigue recibiendo aire pero no sangre: es espacio muerto. El ventrículo derecho, de pared delgada, se dilata contra el obstáculo.",
        facts: [["Virchow", "estasis, daño endotelial, hipercoagulabilidad"], ["Espacio muerto", "ventila pero no perfunde"]],
        scene: { fx: { "ven-iliacas": { streak: [-150, 0.65] }, vci: { streak: [-170, 0.65] }, "art-pulmonar": { cut: "art-pulmonar@0.42" }, "pulmon-izq-inf": { tint: ["cianosis", 0.55] }, "pulmon-der-inf": { tint: ["cianosis", 0.4] } }, pins: [{ at: "art-pulmonar@0.42", text: "Trombo", tone: "bad" }, { at: "ven-iliacas", text: "Viene de las venas de la pierna", side: "left" }, { at: "pulmon-izq-inf", text: "Aire sin sangre" }] },
      },
      { q: "La angiotomografía confirma el trombo. Está estable, con presión de 108/68. ¿Tratamiento?", options: ["Anticoagulación", "Trombólisis sistémica", "Filtro de vena cava como primera línea", "Antiagregantes plaquetarios"], ok: 0, why: "La anticoagulación impide que el trombo crezca mientras el organismo lo disuelve. El filtro se reserva para cuando anticoagular está contraindicado." },
      {
        lead: "Una hora después la presión cae a 78/50 y no responde a líquidos.", vitals: { hr: 132, sys: 78, dia: 50, spo2: 85, perf: 0.5 },
        q: "¿Qué cambia?", options: ["Aumento la dosis de heparina", "Solo inicio vasopresores", "Espero a que la anticoagulación haga efecto", "Trombólisis sistémica: ahora es una tromboembolia de alto riesgo"], ok: 3,
        why: "La hipotensión sostenida define el alto riesgo. En ese grupo la trombólisis reduce la mortalidad; si está contraindicada, se considera la embolectomía.",
        after: { scene: { fx: { "art-pulmonar": { streak: [200, 0.5] } }, pins: [{ at: "art-pulmonar@0.42", text: "Arteria abierta", tone: "good" }] }, vitals: { hr: 98, sys: 112, dia: 70, rr: 20, spo2: 94, perf: 1 } },
      },
    ],
    pearls: ["Probabilidad alta: imagen. Probabilidad baja o intermedia: dímero D.", "El hallazgo más frecuente en el electrocardiograma es la taquicardia sinusal.", "Estable: anticoagular. Hipotensión sostenida: trombolizar."],
  },
  {
    id: "neumonia", title: "Fiebre y tos con esputo herrumbroso", area: "Neumología", hue: "#30a46c", glyph: "body", level: 1, organs: ["pulmon-der", "pulmon-izq"],
    patient: "Hombre de 67 años · diabético",
    base: { only: [...LUNGS, "traquea", "bronquios", "diafragma"], focus: [-40, 0, 1250], zoom: 4.8, turn: -0.4 },
    intro: {
      text: "Tres días con fiebre, escalofríos, tos con esputo color óxido y dolor en el costado derecho al respirar.",
      exam: ["Estertores crepitantes y soplo tubario en la base derecha", "Matidez a la percusión en la base derecha", "Orientado, sin confusión"],
      labs: [["52 mg/dL", "urea"], ["16 200", "leucocitos"]],
      vitals: { hr: 108, sys: 112, dia: 70, rr: 26, spo2: 90, temp: 39.1 },
    },
    nodes: [
      { q: "¿Cuál es el agente más frecuente de la neumonía adquirida en la comunidad?", options: ["Mycoplasma pneumoniae", "Staphylococcus aureus", "Pseudomonas aeruginosa", "Streptococcus pneumoniae"], ok: 3, why: "El neumococo es el primero en todos los grupos de adultos. El inicio brusco, el esputo herrumbroso y la consolidación lobar son su cuadro clásico." },
      {
        title: "Qué está pasando",
        text: "Los alvéolos del lóbulo inferior derecho se llenaron de exudado y neutrófilos: es la <b>consolidación</b>. Ese lóbulo sigue recibiendo sangre pero ya no tiene aire, así que la sangre pasa sin oxigenarse: un cortocircuito. Por eso la saturación baja y mejora poco con oxígeno.",
        facts: [["Cortocircuito", "perfunde pero no ventila"], ["Broncograma aéreo", "bronquios con aire entre alvéolos llenos"]],
        scene: { fx: { "pulmon-der-inf": { tint: ["consolidado", 0.78] } }, pins: [{ at: "pulmon-der-inf", text: "Consolidación", tone: "bad" }] },
      },
      { q: "Tiene 67 años y urea elevada; no está confundido, respira 26 veces por minuto y su presión es de 112/70. CURB-65 de 2. ¿Dónde lo tratas?", options: ["En casa, con cita en una semana", "Hospitalizado", "En terapia intensiva", "En observación dos horas y alta"], ok: 1, why: "CURB-65 da un punto por confusión, urea alta, frecuencia respiratoria de 30 o más, presión baja y edad de 65 o más. Con 2 puntos se hospitaliza; con 3 o más se valora terapia intensiva." },
      {
        q: "¿Qué esquema empírico inicias en hospitalización general?", options: ["Betalactámico más macrólido, o una fluoroquinolona respiratoria sola", "Amoxicilina oral sola", "Vancomicina más meropenem", "Oseltamivir solo"], ok: 0,
        why: "Hay que cubrir neumococo y gérmenes atípicos. La cobertura contra Pseudomonas o estafilococo resistente solo se añade si hay factores de riesgo.",
        after: { scene: { fx: { "pulmon-der-inf": { tint: ["consolidado", 0.3] } }, pins: [{ at: "pulmon-der-inf", text: "Se resuelve en semanas", tone: "good" }] }, vitals: { hr: 88, rr: 18, spo2: 95, temp: 37.2 } },
      },
    ],
    pearls: ["Neumococo: el agente más frecuente a cualquier edad adulta.", "CURB-65: 0–1 ambulatorio, 2 hospital, 3 o más valorar terapia intensiva.", "La radiografía tarda semanas en limpiarse; la mejoría se mide en el paciente."],
  },
  {
    id: "apendicitis", title: "Dolor que migró a la fosa ilíaca derecha", area: "Cirugía", hue: "#e08a3c", glyph: "pin", level: 1, organs: ["colon", "intestino"],
    patient: "Hombre de 19 años · previamente sano",
    base: { only: ["colon", "apendice", "ileon", "yeyuno", "recto", "pelvis", "sacro", "col-lumbar"], ghost: { ...ghost(["pelvis", "sacro", "col-lumbar"], 0.24), yeyuno: 0.4, ileon: 0.55 }, focus: "apendice", zoom: 5.6, turn: -0.45 },
    intro: {
      text: "Ayer empezó con dolor alrededor del ombligo, sin ganas de comer y con náusea. Hoy el dolor está en la parte baja derecha del abdomen y le duele al caminar.",
      exam: ["Dolor en el punto de McBurney con rebote", "Signo de Rovsing positivo", "Signo del psoas positivo"],
      labs: [["13 800", "leucocitos"], ["82 %", "neutrófilos"]],
      vitals: { hr: 98, sys: 118, dia: 74, rr: 18, spo2: 98, temp: 38 },
    },
    nodes: [
      { q: "¿Por qué el dolor empezó en el ombligo y después se fue a la fosa ilíaca derecha?", options: ["Porque el apéndice se desplaza al inflamarse", "Primero es dolor visceral referido a T10; después se inflama el peritoneo parietal y el dolor se localiza", "Por irritación del nervio frénico", "Porque es un dolor de la pared muscular"], ok: 1, why: "El apéndice comparte inervación con el intestino medio, que refiere al dermatoma T10. Cuando la inflamación toca el peritoneo parietal, que tiene inervación somática, el dolor se vuelve preciso." },
      {
        title: "Qué está pasando",
        text: "Algo tapa la luz del apéndice: un fecalito en el adulto, tejido linfoide en el joven. El moco se acumula, la pared se distiende y las bacterias proliferan. La presión corta primero el drenaje venoso y después el riego arterial: <b>isquemia, necrosis y perforación</b> en uno a tres días.",
        facts: [["24–72 h", "hasta la perforación"], ["Alvarado ≥ 7", "alta probabilidad"]],
        scene: { fx: { apendice: { tint: ["inflamado", 0.88], swell: 2.8 }, colon: { spot: ["apendice", 36, "inflamado", 0.5] } }, pins: [{ at: "apendice", text: "Apéndice inflamado", tone: "bad", side: "left" }, { at: "T10", text: "T10: el dolor referido al ombligo" }] },
      },
      { q: "Su puntaje de Alvarado es de 9. ¿Qué sigue?", options: ["Tomografía en todos los casos antes de decidir", "Antibiótico oral y revisión en 48 horas", "Colonoscopia", "Apendicectomía, de preferencia laparoscópica, con antibiótico profiláctico"], ok: 3, why: "Con cuadro típico y Alvarado alto la cirugía no se retrasa. La imagen es para los casos dudosos: ultrasonido en niños y embarazadas, tomografía en adultos." },
      {
        q: "En la cirugía el apéndice está perforado y hay pus libre. ¿Qué cambia?", options: ["Nada: el manejo es igual", "Los antibióticos dejan de ser profilácticos y continúan como tratamiento", "Se deja el apéndice y se cierra", "Se hace una colostomía"], ok: 1,
        why: "En la apendicitis no complicada basta una dosis antes de la incisión. En la complicada se continúan hasta que cede la respuesta inflamatoria, por lo general de 3 a 5 días.",
        after: { scene: { fx: {}, hide: ["apendice"], pins: [{ at: "colon@0.02", text: "Muñón apendicular", tone: "good", side: "left" }] }, vitals: { hr: 82, temp: 37.1 } },
      },
    ],
    pearls: ["Secuencia de Murphy: dolor, después náusea o vómito, después fiebre.", "McBurney: unión del tercio externo con los dos tercios internos de la línea de la espina ilíaca al ombligo.", "Niños y embarazadas: ultrasonido antes que tomografía."],
  },
  {
    id: "colangitis", title: "Fiebre, ictericia y dolor", area: "Cirugía", hue: "#5f9150", glyph: "info", level: 2, organs: ["vesicula", "higado"],
    patient: "Hombre de 45 años · cólicos biliares previos",
    base: { only: ["higado", "vesicula", "duodeno", "pancreas", "estomago"], ghost: { higado: 0.5, estomago: 0.3 }, focus: "vesicula", zoom: 5.8, turn: -0.3 },
    intro: {
      text: "Desde ayer tiene dolor en el hipocondrio derecho, fiebre con escalofríos y la piel amarilla. La orina es oscura.",
      exam: ["Ictericia de piel y escleras", "Dolor a la palpación del hipocondrio derecho", "Temperatura de 39.2 °C"],
      labs: [["6.8 mg/dL", "bilirrubina total, directa"], ["412 U/L", "fosfatasa alcalina"], ["17 500", "leucocitos"]],
      vitals: { hr: 112, sys: 96, dia: 58, rr: 22, spo2: 96, temp: 39.2 },
    },
    nodes: [
      { q: "Fiebre, ictericia y dolor en el hipocondrio derecho. ¿Qué tríada es y qué indica?", options: ["Tríada de Beck: taponamiento cardiaco", "Tríada de Virchow: trombosis", "Tríada de Charcot: colangitis aguda", "Tríada de Whipple: hipoglucemia"], ok: 2, why: "La tríada de Charcot es la presentación clásica de la infección de la vía biliar obstruida." },
      {
        title: "Qué está pasando",
        text: "Un cálculo salió de la vesícula y se atoró en el colédoco. La bilis ya no puede bajar al duodeno: se estanca, se infecta con bacterias del intestino y la presión la empuja hacia la sangre. Por eso hay <b>fiebre, ictericia y dolor</b>. La bilirrubina que sube es la directa.",
        facts: [["E. coli y Klebsiella", "gérmenes habituales"], ["Bilirrubina directa", "patrón obstructivo"]],
        scene: { fx: { vesicula: { tint: ["bilis", 0.45], swell: 2 }, higado: { tint: ["bilis", 0.42] } }, pins: [{ at: "mid:vesicula,duodeno@0.4", text: "Cálculo en el colédoco", tone: "bad" }, { at: "higado", text: "Bilis estancada", side: "left" }] },
      },
      { q: "¿Cuál es el primer estudio de imagen?", options: ["Ultrasonido de hígado y vías biliares", "Tomografía contrastada", "Colangiorresonancia en todos los casos", "Radiografía simple de abdomen"], ok: 0, why: "El ultrasonido muestra la dilatación de la vía biliar y los cálculos de la vesícula. La colangiorresonancia se usa cuando persiste la duda." },
      { q: "¿Cuál es el tratamiento?", options: ["Colecistectomía de urgencia como primer paso", "Solo antibióticos durante dos semanas", "Líquidos, antibióticos y drenaje de la vía biliar por CPRE", "Vigilar y repetir los laboratorios"], ok: 2, why: "El antibiótico no basta mientras la vía siga obstruida. El drenaje endoscópico es el tratamiento; la vesícula se opera después, cuando cede la infección." },
      {
        lead: "Mientras se prepara la CPRE, la presión baja a 80/50 y el paciente deja de reconocer a su familia.", vitals: { hr: 128, sys: 80, dia: 50, perf: 0.6 },
        q: "¿Qué significa?", options: ["Encefalopatía hepática: lactulosa", "Efecto de los analgésicos", "Síndrome hepatorrenal", "Péntada de Reynolds: colangitis grave, el drenaje es urgente"], ok: 3,
        why: "Charcot más hipotensión y alteración del estado de alerta es la péntada de Reynolds: sepsis de origen biliar. El drenaje no puede esperar.",
        after: { scene: { fx: { higado: { tint: ["bilis", 0.12] } }, pins: [{ at: "mid:vesicula,duodeno@0.4", text: "Vía biliar drenada", tone: "good" }] }, vitals: { hr: 92, sys: 112, dia: 68, temp: 37.6, perf: 1 } },
      },
    ],
    pearls: ["Charcot: fiebre, ictericia y dolor. Reynolds: Charcot más hipotensión y confusión.", "Colangitis: antibiótico y drenaje. Sin drenaje no hay curación.", "Colecistitis: Murphy positivo, sin ictericia importante. Colangitis: ictericia y fiebre."],
  },
  {
    id: "pancreatitis", title: "Dolor en barra que va a la espalda", area: "Gastroenterología", hue: "#c9a227", glyph: "info", level: 2, organs: ["pancreas", "vesicula"],
    patient: "Hombre de 41 años · litiasis vesicular conocida",
    base: { only: ["pancreas", "duodeno", "vesicula", "higado", "estomago", "bazo"], ghost: { higado: 0.4, estomago: 0.28 }, focus: "pancreas", zoom: 5.6, turn: -0.1 },
    intro: {
      text: "Después de una comida abundante empezó con dolor intenso en el epigastrio, en barra, que se va a la espalda y mejora un poco al inclinarse hacia delante. Ha vomitado varias veces.",
      exam: ["Abdomen doloroso en el epigastrio, sin rigidez", "Mucosas secas", "Ruidos intestinales disminuidos"],
      labs: [["1 450 U/L", "lipasa (normal hasta 160)"], ["Cálculos en la vesícula", "ultrasonido"]],
      vitals: { hr: 116, sys: 100, dia: 62, rr: 22, spo2: 96, temp: 37.9 },
    },
    nodes: [
      { q: "¿Cómo se hace el diagnóstico de pancreatitis aguda?", options: ["Con lipasa elevada en cualquier cifra", "Con tomografía obligatoria al ingreso", "Con dos de tres: dolor típico, lipasa o amilasa al triple del límite e imagen compatible", "Con amilasa y lipasa elevadas a la vez"], ok: 2, why: "Este paciente ya cumple dos criterios: no necesita tomografía para el diagnóstico. La tomografía se reserva para la duda o para buscar complicaciones después de 72 horas." },
      {
        title: "Qué está pasando",
        text: "Un cálculo se atoró en la ampolla de Vater y bloqueó la salida del páncreas. Las enzimas, que deberían activarse en el duodeno, se activan dentro de la glándula y <b>empiezan a digerirla</b>. El páncreas se inflama y el líquido se fuga de los vasos al retroperitoneo: por eso llega deshidratado y taquicárdico.",
        facts: [["Litiasis biliar", "primera causa"], ["Alcohol", "segunda causa"]],
        scene: { fx: { pancreas: { tint: ["inflamado", 0.72], swell: 3.4 } }, pins: [{ at: "pancreas", text: "Autodigestión" }, { at: "mid:vesicula,duodeno@0.4", text: "Cálculo en la ampolla", tone: "bad", side: "left" }] },
      },
      { q: "¿Cuál es el manejo inicial?", options: ["Ayuno prolongado y antibiótico profiláctico", "Líquidos intravenosos guiados por metas, analgesia y reiniciar la vía oral en cuanto la tolere", "Cirugía de urgencia", "CPRE en las primeras 24 horas a todos"], ok: 1, why: "No se dan antibióticos profilácticos. La CPRE urgente solo está indicada si además hay colangitis. Alimentar pronto reduce las complicaciones." },
      {
        q: "Evoluciona bien: fue una pancreatitis leve de origen biliar. ¿Cuándo se opera la vesícula?", options: ["En el mismo internamiento, antes del alta", "En seis meses", "Nunca, si no vuelve a tener síntomas", "Solo si la pancreatitis se repite"], ok: 0,
        why: "Si se va con la vesícula, el riesgo de otra pancreatitis en las siguientes semanas es alto. En la forma leve se opera antes del alta.",
        after: { scene: { fx: { pancreas: { tint: ["inflamado", 0.15] } }, hide: ["vesicula"] }, vitals: { hr: 84, sys: 118, dia: 72, temp: 36.9 } },
      },
    ],
    pearls: ["Dos de tres: dolor, enzimas al triple, imagen.", "Líquidos, analgesia y comida temprana. Sin antibióticos profilácticos.", "Cullen (ombligo) y Grey Turner (flancos): hemorragia retroperitoneal."],
  },
  {
    id: "evc", title: "No puede hablar ni mover el brazo", area: "Neurología", hue: "#8e6fd0", glyph: "info", level: 3, organs: ["motora", "frontal", "supraaorticos"],
    patient: "Hombre de 70 años · fibrilación auricular sin anticoagulación",
    base: { only: [...CORTEX, "lob-occipital", "cerebelo", "tronco", "sust-blanca", "carotidas", "aorta", "subclavias", "corazon", "craneo", "mandibula"], ghost: { craneo: 0.16, mandibula: 0.16 }, focus: [20, 10, 1570], zoom: 7.1, turn: 1.05 },
    intro: {
      text: "Hace 70 minutos, mientras desayunaba, se le cayó la taza de la mano derecha y dejó de hablar. Su esposa vio el momento exacto.",
      exam: ["Desviación de la comisura labial hacia la izquierda", "Fuerza 1/5 en el brazo derecho y 3/5 en la pierna derecha", "No emite palabras; obedece órdenes sencillas", "Escala NIHSS: 16 puntos"],
      labs: [["110 mg/dL", "glucosa capilar"]],
      vitals: { rhythm: "fa", hr: 104, sys: 168, dia: 96, rr: 18, spo2: 96 },
    },
    nodes: [
      { q: "¿Qué haces primero?", options: ["Resonancia magnética con difusión", "Punción lumbar", "Bajar la presión a cifras normales", "Tomografía simple de cráneo de inmediato"], ok: 3, why: "La tomografía simple descarta hemorragia, que es lo único que necesitas saber para decidir la trombólisis. La presión solo se baja si supera 185/110 y se va a trombolizar." },
      {
        title: "Qué está pasando",
        text: "La fibrilación auricular estanca la sangre en la aurícula izquierda. Un coágulo se desprendió, subió por la carótida y <b>tapó la arteria cerebral media izquierda</b>. El centro del territorio muere en minutos. Alrededor queda la penumbra: tejido que ya no funciona pero sigue vivo y puede salvarse si la arteria se abre a tiempo.",
        facts: [["1.9 millones", "de neuronas se pierden por minuto"], ["Cara y brazo", "territorio de la cerebral media"]],
        scene: { fx: { ...each(CORTEX, { spot: [MCA, 44, "necrosis", 0.8], spot2: [MCA, 80, "isquemia", 0.5] }), carotidas: { streak: [240, 0.5] } }, pins: [{ at: [62, 2, 1594], text: "Núcleo del infarto", tone: "bad" }, { at: [50, 44, 1616], text: "Penumbra", side: "left" }] },
      },
      { q: "La tomografía no muestra hemorragia. Lleva 90 minutos, presión de 168/96 y no tiene contraindicaciones. ¿Qué indicas?", options: ["Aspirina y vigilancia", "Trombólisis intravenosa con alteplasa", "Anticoagulación plena por la fibrilación auricular", "Esperar a la resonancia magnética"], ok: 1, why: "La ventana es de 4.5 horas desde el inicio. La anticoagulación se difiere varios días por el riesgo de que el infarto sangre; la aspirina se inicia 24 horas después de la trombólisis." },
      {
        q: "La angiotomografía confirma la oclusión del primer segmento de la cerebral media. ¿Qué agregas?", options: ["Una segunda dosis de alteplasa", "Craniectomía descompresiva", "Trombectomía mecánica", "Nada más"], ok: 2,
        why: "En la oclusión de un gran vaso la trombectomía se suma a la trombólisis: hasta 6 horas en general y hasta 24 en pacientes seleccionados por imagen.",
        after: { scene: { fx: { ...each(CORTEX, { spot: [MCA, 20, "necrosis", 0.55], spot2: [MCA, 34, "isquemia", 0.25] }), carotidas: { streak: [240, 0.5] } }, pins: [{ at: [62, 2, 1594], text: "Infarto final, pequeño", tone: "good" }] }, vitals: { hr: 88, sys: 148, dia: 84 } },
      },
    ],
    pearls: ["Hora de inicio = última vez que se le vio bien.", "Antes de trombolizar: tomografía sin hemorragia, glucosa y presión menor de 185/110.", "Hemisferio izquierdo: afasia. Hemisferio derecho: negligencia."],
  },
  {
    id: "cad", title: "Joven con vómito y respiración profunda", area: "Endocrinología", hue: "#d6409f", glyph: "flow", level: 3, organs: ["pancreas", "rinones"],
    patient: "Hombre de 22 años · diabetes tipo 1, sin insulina hace 3 días",
    base: { only: ["pancreas", "higado", "rinon-der", "rinon-izq", "ureteres", "vejiga", ...LUNGS, "diafragma", "corazon", "aorta", "estomago"], ghost: { estomago: 0.25, ...ghost(LUNGS, 0.55) }, focus: [0, 0, 1130], zoom: 3.4, turn: -0.15 },
    intro: {
      text: "Dos días con mucha sed, orina abundante, dolor abdominal y vómito. Hoy está somnoliento y respira hondo y rápido.",
      exam: ["Mucosas secas, ojos hundidos", "Aliento con olor a fruta", "Respiración profunda y rápida", "Dolor abdominal difuso sin rebote"],
      labs: [["486 mg/dL", "glucosa"], ["7.12", "pH"], ["9 mEq/L", "bicarbonato"], ["5.4 mEq/L", "potasio"], ["Positivas", "cetonas"]],
      vitals: { hr: 124, sys: 92, dia: 58, rr: 30, spo2: 98, pattern: "kussmaul", depth: 1.9 },
    },
    nodes: [
      { q: "¿Cuál es el diagnóstico?", options: ["Estado hiperosmolar hiperglucémico", "Cetoacidosis diabética", "Acidosis láctica", "Abdomen agudo quirúrgico"], ok: 1, why: "Hiperglucemia, acidosis metabólica con brecha aniónica alta y cetonas. El estado hiperosmolar tiene glucosas mucho mayores sin acidosis importante. El dolor abdominal es parte del cuadro y cede al corregir la acidosis." },
      {
        title: "Qué está pasando",
        text: "Sin insulina la glucosa no entra a las células y el cuerpo se comporta como en ayuno: quema grasa y el hígado la convierte en <b>cuerpos cetónicos, que son ácidos</b>. La glucosa que sobra se va por la orina y arrastra agua, sodio y potasio. Los pulmones compensan eliminando CO₂: esa respiración profunda y rápida es la de Kussmaul.",
        facts: [["Brecha aniónica", "Na − (Cl + HCO₃) > 12"], ["Déficit de agua", "3 a 6 litros"]],
        scene: { fx: { pancreas: { tint: ["palido", 0.65] }, higado: { tint: ["calculo", 0.36] }, ureteres: { tint: ["orina", 0.55], wave: [44, 110, 1.5, 1] }, vejiga: { tint: ["orina", 0.4], swell: 3 } }, pins: [{ at: "pancreas", text: "Sin insulina" }, { at: "higado", text: "Fabrica cetonas", side: "left" }, { at: "rinon-izq", text: "Pierde agua y potasio" }, { at: "pulmon-der-sup", text: "Kussmaul", side: "left" }] },
      },
      { q: "¿Qué indicas primero?", options: ["Insulina en bolo intravenoso", "Bicarbonato de sodio", "Solución salina al 0.9 %", "Solución glucosada al 5 %"], ok: 2, why: "Le faltan varios litros de agua. Los líquidos restauran la perfusión y por sí solos bajan la glucosa. El bicarbonato solo se considera con pH menor de 6.9." },
      { lead: "Tras el primer litro llega el potasio de control: 3.1 mEq/L.", q: "¿Qué haces con la insulina?", options: ["La inicio: el potasio se corrige solo", "Repongo potasio primero y la difiero hasta que esté en 3.3 mEq/L o más", "Doy bicarbonato para subir el potasio", "Suspendo los líquidos"], ok: 1, why: "La insulina mete potasio a las células; con potasio bajo puede provocar una arritmia mortal. El potasio total del cuerpo está agotado aunque la cifra inicial parezca normal o alta." },
      {
        lead: "Con insulina en infusión la glucosa baja a 210 mg/dL, pero la brecha aniónica sigue abierta.", vitals: { hr: 102, sys: 106, dia: 66, rr: 24, depth: 1.4 },
        q: "¿Qué sigue?", options: ["Suspendo la insulina", "Paso a insulina subcutánea y lo doy de alta", "Agrego glucosa a los líquidos y mantengo la insulina hasta cerrar la brecha", "Aumento la insulina"], ok: 2,
        why: "La meta no es la glucosa: es resolver la cetoacidosis, con pH mayor de 7.3, bicarbonato de 15 o más y brecha cerrada. La glucosa permite seguir con la insulina sin causar hipoglucemia.",
        after: { scene: { fx: {}, pins: [{ at: "pancreas", text: "Insulina exógena", tone: "good" }] }, vitals: { hr: 86, sys: 116, dia: 72, rr: 16, pattern: "normal", depth: 1 } },
      },
    ],
    pearls: ["Orden: líquidos, potasio, insulina.", "Potasio menor de 3.3: no inicies la insulina.", "La cetoacidosis se resuelve cuando se cierra la brecha, no cuando baja la glucosa."],
  },
  {
    id: "diseccion", title: "Dolor que desgarra hacia la espalda", area: "Cardiología", hue: "#b5413f", glyph: "heart", level: 3, organs: ["aorta", "supraaorticos"],
    patient: "Hombre de 61 años · hipertenso mal controlado",
    base: { only: ["aorta", "corazon", "carotidas", "subclavias", "tronco-celiaco", "mesentericas", "art-renales", "art-iliacas", "col-toracica", "col-lumbar"], ghost: ghost(["col-toracica", "col-lumbar"], 0.2), focus: "aorta@0.14", zoom: 5.1, turn: 0.5 },
    intro: {
      text: "Dolor torácico de inicio súbito, el peor de su vida desde el primer segundo, que describe como si algo se rasgara y que se va hacia la espalda.",
      exam: ["Presión de 178/100 en el brazo derecho y 132/80 en el izquierdo", "Soplo diastólico aórtico que no tenía", "Pulso radial izquierdo disminuido"],
      labs: [["Mediastino ensanchado", "radiografía de tórax"], ["Sin elevación del ST", "electrocardiograma"]],
      vitals: { hr: 108, sys: 178, dia: 100, rr: 22, spo2: 96 },
    },
    nodes: [
      { q: "¿Qué sospechas y qué estudio pides?", options: ["Infarto: cateterismo inmediato", "Disección aórtica: angiotomografía de aorta", "Tromboembolia pulmonar: dímero D", "Pericarditis: antiinflamatorios"], ok: 1, why: "Dolor máximo desde el inicio, pulsos y presiones asimétricos y mediastino ancho. Anticoagular o trombolizar una disección por confundirla con un infarto puede ser letal." },
      {
        title: "Qué está pasando",
        text: "La capa interna de la aorta se desgarró y la sangre, empujada por cada latido, <b>se mete entre las capas de la pared</b> y abre un segundo canal: la falsa luz. Si avanza hacia el corazón puede dañar la válvula aórtica, tapar una coronaria o romperse al pericardio. Hacia delante puede dejar sin flujo a las ramas del cayado: por eso la presión es distinta en cada brazo.",
        facts: [["Hipertensión", "principal factor de riesgo"], ["1–2 % por hora", "mortalidad sin tratamiento, tipo A"]],
        scene: { fx: { aorta: { bulge: [0, 0.2, 3.6], spot: ["aorta@0.05", 28, "sangre", 0.75] }, subclavias: { tint: ["isquemia", 0.5] } }, pins: [{ at: "aorta@0.05", text: "Desgarro de la íntima", tone: "bad", side: "left" }, { at: "aorta@0.15", text: "Falsa luz" }, { at: "subclavias", text: "Rama con menos flujo" }] },
      },
      { q: "La tomografía muestra que la disección afecta la aorta ascendente. ¿Clasificación y conducta?", options: ["Stanford B: manejo médico", "Stanford A: manejo médico", "Stanford A: cirugía urgente", "Stanford B: cirugía urgente"], ok: 2, why: "Toda disección que toca la ascendente es tipo A y se opera. La tipo B, que empieza después de la subclavia izquierda, se trata con medicamentos si no hay complicaciones." },
      {
        q: "Mientras llega el cirujano, ¿cómo controlas la hemodinamia?", options: ["Vasodilatador solo, para bajar rápido la presión", "Betabloqueador intravenoso primero: frecuencia menor de 60 y sistólica de 100 a 120", "Líquidos abundantes", "Anticoagulación con heparina"], ok: 1,
        why: "Hay que reducir la fuerza con que cada latido golpea la pared. Un vasodilatador sin betabloqueo previo provoca taquicardia refleja y extiende el desgarro.",
        after: { vitals: { hr: 58, sys: 112, dia: 68 } },
      },
    ],
    pearls: ["Stanford A: ascendente, cirugía. Stanford B: descendente, medicamentos.", "Primero betabloqueador, después vasodilatador.", "Dolor torácico con pulsos asimétricos: no anticoagules hasta descartar disección."],
  },
  {
    id: "litiasis", title: "Cólico que baja a la ingle", area: "Urología", hue: "#c9a227", glyph: "pin", level: 1, organs: ["rinones", "vejiga"],
    patient: "Hombre de 35 años · toma poca agua",
    base: { only: ["rinon-der", "rinon-izq", "ureteres", "vejiga", "aorta", "vci", "art-renales", "ven-renales", "pelvis", "sacro", "col-lumbar"], ghost: ghost(["pelvis", "sacro", "col-lumbar"], 0.22), focus: [30, 0, 965], zoom: 4.6, turn: 0.3 },
    intro: {
      text: "Lo despertó un dolor intenso en la región lumbar izquierda que va y viene, baja hacia la ingle y el testículo y no le deja estar quieto. Tiene náusea.",
      exam: ["Puñopercusión lumbar izquierda dolorosa", "Abdomen blando, sin rebote", "Inquieto: no encuentra postura"],
      labs: [["Hematuria", "examen de orina"], ["36.8 °C", "temperatura"]],
      vitals: { hr: 104, sys: 142, dia: 88, rr: 20, spo2: 98 },
    },
    nodes: [
      { q: "¿Cuál es el estudio de elección?", options: ["Urografía excretora", "Radiografía simple de abdomen", "Tomografía simple de abdomen y pelvis", "Resonancia magnética"], ok: 2, why: "Tiene la mayor sensibilidad y no necesita contraste. En embarazadas y niños se empieza con ultrasonido." },
      {
        title: "Qué está pasando",
        text: "Un cálculo de oxalato de calcio bajó del riñón y <b>se atoró donde el uréter entra a la vejiga</b>, su punto más estrecho. La orina se acumula arriba: la pelvis renal se dilata y la cápsula del riñón se estira. El uréter se contrae con fuerza contra el obstáculo: eso es el cólico, que viaja hacia la ingle por los mismos nervios.",
        facts: [["Oxalato de calcio", "el más frecuente"], ["T11–L2", "dolor referido a la ingle"]],
        scene: { fx: { ureteres: { cut: { at: "ureteres@0.93/left ureter", part: "left ureter" }, wave: [50, 90, 1.3, 1] }, "rinon-izq": { swell: 3.2, tint: ["edema", 0.32] } }, pins: [{ at: "ureteres@0.95/left ureter", text: "Cálculo", tone: "bad" }, { at: "rinon-izq", text: "Hidronefrosis" }] },
      },
      { q: "El cálculo mide 4 mm y está en el uréter distal. El dolor cede con analgésico, no hay fiebre y la creatinina es normal. ¿Manejo?", options: ["Litotricia de inmediato", "Ureteroscopia urgente", "Tratamiento expulsivo: antiinflamatorio, alfabloqueador y líquidos, con revisión en 2 a 4 semanas", "Nefrostomía"], ok: 2, why: "La mayoría de los cálculos distales de 5 mm o menos se expulsan solos. La tamsulosina relaja el uréter y acelera la salida." },
      {
        lead: "Dos días después regresa con fiebre de 39 °C y escalofríos.", vitals: { hr: 124, sys: 96, dia: 58, temp: 39, perf: 0.7 },
        q: "¿Qué cambia?", options: ["Solo el analgésico", "Antibiótico oral y cita", "Litotricia extracorpórea", "Es una urgencia: derivación de la vía urinaria y antibióticos"], ok: 3,
        why: "Obstrucción con infección es pus a presión: sin drenaje evoluciona a sepsis. Se deriva con catéter doble J o nefrostomía; la litotricia está contraindicada con infección activa.",
        after: { scene: { fx: { "rinon-izq": { swell: 0.6 } }, pins: [{ at: "ureteres@0.5/left ureter", text: "Catéter doble J", tone: "good" }] }, vitals: { hr: 92, sys: 118, dia: 72, temp: 37.4, perf: 1 } },
      },
    ],
    pearls: ["Tres sitios estrechos: unión pieloureteral, cruce ilíaco y unión ureterovesical.", "Cinco milímetros o menos en uréter distal: tratamiento expulsivo.", "Fiebre más obstrucción: drenar antes que cualquier otra cosa."],
  },
  {
    id: "bazo", title: "Golpe en el costado izquierdo", area: "Urgencias", hue: "#7b3a55", glyph: "cases", level: 2, organs: ["bazo", "costillas"],
    patient: "Hombre de 30 años · choque en automóvil",
    base: { only: ["bazo", "estomago", "higado", "rinon-izq", "colon", "yeyuno", "ileon", "diafragma", "costillas", "aorta", "vci", "corazon"], ghost: { estomago: 0.3, diafragma: 0.25, costillas: 0.2, higado: 0.4 }, focus: [40, 0, 1090], zoom: 4.1, turn: 0.5 },
    intro: {
      text: "Conducía sin cinturón y se golpeó contra el volante y la puerta. Se queja de dolor en el lado izquierdo del abdomen y en el hombro izquierdo.",
      exam: ["Equimosis sobre las costillas 9 a 11 izquierdas", "Piel fría y llenado capilar lento", "Ansioso y confuso", "FAST positivo en el espacio esplenorrenal"],
      vitals: { hr: 128, sys: 84, dia: 50, rr: 28, spo2: 94, perf: 0.55 },
    },
    nodes: [
      { q: "¿En qué clase de choque hemorrágico está?", options: ["Clase I: perdió menos de 15 %", "Clase II: entre 15 y 30 %", "Clase III: entre 30 y 40 % de su volumen", "No está en choque: todavía tiene presión"], ok: 2, why: "La presión no cae hasta la clase III. Con frecuencia mayor de 120, presión baja y confusión ya perdió más de litro y medio de sangre." },
      {
        title: "Qué está pasando",
        text: "El golpe rompió el bazo, un órgano frágil y lleno de sangre que queda justo bajo esas costillas. La hemorragia llena el abdomen. El diafragma irritado manda el dolor al hombro izquierdo por el nervio frénico: es el <b>signo de Kehr</b>. Con menos sangre que bombear, el corazón late más rápido y las arterias se cierran para sostener la presión, hasta que ya no alcanza.",
        facts: [["Bazo", "el más lesionado en trauma cerrado"], ["C3–C5", "nervio frénico"]],
        scene: { fx: { bazo: { spot: ["bazo", 34, "sangre", 0.85] }, ...each(["colon", "yeyuno", "ileon"], { level: [985, "sangre", 0.72] }) }, pins: [{ at: "bazo", text: "Bazo roto", tone: "bad" }, { at: [10, -70, 975], text: "Sangre libre", side: "left" }] },
        vitals: { hr: 136, sys: 78, dia: 46, perf: 0.45 },
      },
      { q: "Está inestable y el FAST es positivo. ¿Qué sigue?", options: ["Tomografía contrastada para graduar la lesión", "Laparotomía de urgencia", "Observación con hemoglobinas seriadas", "Lavado peritoneal diagnóstico"], ok: 1, why: "El paciente inestable no va a tomografía. La tomografía y el manejo no operatorio son para el paciente estable." },
      { q: "¿Cómo lo reanimas mientras llega al quirófano?", options: ["Tres litros de cristaloide antes de transfundir", "Coloides sintéticos", "Vasopresores como primera medida", "Hemoderivados tempranos en proporción equilibrada y cristaloides limitados"], ok: 3, why: "ATLS, 10.ª edición: no más de un litro de cristaloide y sangre pronto, en proporción 1:1:1. El exceso de solución diluye los factores de coagulación. El ácido tranexámico se da en las primeras tres horas." },
      {
        q: "Se le quitó el bazo. Antes del alta necesita:", options: ["Solo antibiótico durante siete días", "Anticoagulación de por vida", "Vacunas contra neumococo, meningococo y Haemophilus influenzae tipo b", "Ninguna medida especial"], ok: 2,
        why: "Sin bazo pierde la defensa contra bacterias encapsuladas y queda en riesgo de sepsis fulminante. Las vacunas se aplican a partir de los 14 días de la cirugía.",
        after: { scene: { fx: {}, hide: ["bazo"] }, vitals: { hr: 88, sys: 118, dia: 72, rr: 18, spo2: 98, perf: 1 } },
      },
    ],
    pearls: ["Inestable con FAST positivo: quirófano, no tomografía.", "La presión arterial es un signo tardío de hemorragia.", "Sin bazo: vacunas contra encapsulados."],
  },
];
