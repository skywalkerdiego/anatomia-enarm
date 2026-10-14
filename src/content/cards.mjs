// Study cards. Several structures of the model can open the same card.
// Each card: name, a level or landmark line, sections of short points, a pearl and questions.
import { TORSO } from "./cards-torso.mjs";

const q = (question, right, wrong, why) => ({ q: question, a: [right, ...wrong], ok: 0, why });

const MORE = {
  valvulas: {
    name: "Válvulas cardiacas",
    level: "Focos: aórtico 2.º EIC der. · pulmonar 2.º EIC izq. · tricúspide 4.º–5.º EIC paraesternal izq. · mitral 5.º EIC LMC",
    sections: [
      ["Anatomía", ["Auriculoventriculares: tricúspide (derecha, 3 valvas) y mitral (izquierda, 2 valvas), sujetas por cuerdas tendinosas a los músculos papilares.", "Semilunares: pulmonar y aórtica, de 3 valvas y sin cuerdas. En el modelo se ven la mitral, la tricúspide y la pulmonar."]],
      ["Ruidos cardiacos", ["S1: cierre de mitral y tricúspide, al inicio de la sístole.", "S2: cierre de aórtica y pulmonar; se desdobla de forma fisiológica en la inspiración.", "S3: llenado rápido (insuficiencia cardiaca; normal en jóvenes). S4: contracción auricular contra un ventrículo rígido (hipertrofia)."]],
      ["Correlación clínica ENARM", ["Estenosis aórtica: soplo sistólico eyectivo irradiado a carótidas; angina, síncope y disnea; pulso parvus et tardus.", "Estenosis mitral: casi siempre reumática; chasquido de apertura y retumbo diastólico; fibrilación auricular y embolia.", "Insuficiencia mitral: soplo holosistólico en el ápex irradiado a la axila.", "Insuficiencia aórtica: soplo diastólico decreciente y presión de pulso amplia.", "Endocarditis en usuarios de drogas intravenosas: válvula tricúspide, S. aureus."]],
    ],
    pearl: "Sistólicos: estenosis aórtica e insuficiencia mitral. Diastólicos: insuficiencia aórtica y estenosis mitral.",
    quiz: [
      q("Soplo sistólico eyectivo en el 2.º espacio intercostal derecho irradiado a carótidas, con síncope de esfuerzo:", "Estenosis aórtica", ["Insuficiencia mitral", "Estenosis mitral", "Insuficiencia aórtica"], "La tríada clásica es angina, síncope y disnea; el pulso es pequeño y tardío."),
      q("El primer ruido cardiaco (S1) corresponde al cierre de:", "Las válvulas mitral y tricúspide", ["Las válvulas aórtica y pulmonar", "La válvula aórtica sola", "El foramen oval"], "Marca el inicio de la sístole ventricular; S2 es el cierre de las semilunares."),
    ],
  },
  coronarias: {
    name: "Arterias coronarias",
    level: "Nacen de los senos aórticos derecho e izquierdo",
    sections: [
      ["Anatomía", ["Tronco coronario izquierdo → descendente anterior (DA) y circunfleja (Cx).", "Coronaria derecha (CD) → marginal aguda y, cuando domina (80–85 %), la descendente posterior.", "El miocardio se perfunde en diástole: la taquicardia acorta la diástole y reduce el flujo coronario."]],
      ["Territorios y derivaciones", ["DA: septum anterior, cara anterior y ápex → V1–V4.", "Cx: cara lateral → DI, aVL, V5–V6.", "CD: cara inferior, ventrículo derecho y nodos sinusal y AV → DII, DIII, aVF.", "Infarto del ventrículo derecho: pedir V4R; evitar nitratos y diuréticos, dar volumen."]],
      ["Correlación clínica ENARM", ["IAM con elevación del ST: reperfundir. ICP primaria si se logra en ≤ 120 min desde el primer contacto; si no, fibrinólisis en las primeras 12 h.", "Metas: puerta-balón ≤ 90 min; puerta-aguja ≤ 30 min.", "Complicaciones mecánicas (días 3–7): rotura de músculo papilar (insuficiencia mitral aguda), comunicación interventricular y rotura de pared libre (taponamiento)."]],
    ],
    pearl: "DII, DIII y aVF = coronaria derecha. V1–V4 = descendente anterior. DI, aVL, V5–V6 = circunfleja.",
    quiz: [
      q("Elevación del ST de V1 a V4. Arteria más probablemente ocluida:", "Descendente anterior", ["Coronaria derecha", "Circunfleja", "Marginal aguda"], "La DA irriga el septum anterior, la cara anterior y el ápex."),
      q("IAM inferior con hipotensión, ingurgitación yugular y campos pulmonares limpios. Conducta:", "Sospechar infarto del ventrículo derecho: V4R, líquidos y evitar nitratos", ["Nitroglicerina intravenosa", "Furosemida", "Betabloqueador intravenoso"], "El ventrículo derecho infartado depende de la precarga; los nitratos y los diuréticos la reducen."),
      q("IAM con elevación del ST de 2 h de evolución; la sala de hemodinamia más cercana está a 4 h. Conducta:", "Fibrinólisis en los primeros 30 min y después traslado", ["Esperar el traslado para ICP primaria", "Solo antiagregantes", "Prueba de esfuerzo"], "Si la ICP no es posible en ≤ 120 min, se fibrinoliza (estrategia farmacoinvasiva)."),
    ],
  },
  supraaorticos: {
    name: "Troncos supraaórticos y carótidas",
    level: "Cayado T4 · bifurcación carotídea en C3–C4",
    sections: [
      ["Anatomía", ["Ramas del cayado: tronco braquiocefálico (subclavia y carótida común derechas), carótida común izquierda y subclavia izquierda.", "La carótida común se bifurca a la altura del borde superior del cartílago tiroides. La interna no da ramas en el cuello; la externa irriga cara y cuello.", "Seno carotídeo: barorreceptor (IX par). Cuerpo carotídeo: quimiorreceptor de O₂.", "Subclavia: da la vertebral, la torácica interna y el tronco tirocervical."]],
      ["Correlación clínica ENARM", ["Estenosis carotídea sintomática de 70–99 %: endarterectomía.", "Robo de la subclavia: estenosis proximal a la vertebral; flujo vertebral retrógrado y síntomas vertebrobasilares al usar el brazo; presión distinta entre brazos.", "Disección carotídea: dolor cervical, síndrome de Horner y EVC en un joven.", "Masaje del seno carotídeo en la taquicardia supraventricular: auscultar antes para descartar soplo."]],
    ],
    pearl: "La carótida interna no da ramas en el cuello; la externa sí.",
    quiz: [
      q("Mareo y visión doble al ejercitar el brazo izquierdo, con presión arterial menor en ese brazo:", "Síndrome del robo de la subclavia", ["Disección aórtica", "Estenosis carotídea", "Síndrome del opérculo torácico"], "La estenosis de la subclavia proximal a la vertebral invierte el flujo vertebral."),
    ],
  },
  pulmonar: {
    name: "Circulación pulmonar",
    level: "El tronco pulmonar sale del ventrículo derecho y se divide bajo el cayado",
    sections: [
      ["Anatomía", ["Las arterias pulmonares llevan sangre desoxigenada (azules en el modelo) a baja presión: la media normal es menor de 20 mmHg.", "Cuatro venas pulmonares (rojas) devuelven sangre oxigenada a la aurícula izquierda.", "Ligamento arterioso: resto del conducto arterioso, entre la pulmonar izquierda y el cayado."]],
      ["Correlación clínica ENARM", ["Tromboembolia pulmonar: disnea súbita, dolor pleurítico y taquicardia. El hallazgo más frecuente en el ECG es la taquicardia sinusal; S1Q3T3 es clásico pero poco común.", "Probabilidad baja: dímero D. Probabilidad alta: angiotomografía pulmonar.", "Tratamiento: anticoagulación; trombólisis si hay hipotensión sostenida o choque.", "Hipertensión pulmonar: presión media > 20 mmHg por cateterismo derecho.", "Conducto arterioso persistente: soplo continuo «en maquinaria»; indometacina o ibuprofeno lo cierran en el prematuro, la prostaglandina E1 lo mantiene abierto."]],
    ],
    pearl: "TEP con choque: trombólisis. TEP estable: anticoagulación.",
    quiz: [
      q("Estudio de elección ante alta probabilidad clínica de tromboembolia pulmonar en un paciente estable:", "Angiotomografía pulmonar", ["Dímero D", "Radiografía de tórax", "Gasometría arterial"], "El dímero D solo sirve para descartar cuando la probabilidad es baja o intermedia."),
      q("Hallazgo electrocardiográfico más frecuente en la tromboembolia pulmonar:", "Taquicardia sinusal", ["Patrón S1Q3T3", "Bloqueo de rama izquierda", "Elevación difusa del ST"], "S1Q3T3 es específico de sobrecarga derecha pero aparece en una minoría."),
    ],
  },
  porta: {
    name: "Sistema porta",
    level: "La porta se forma detrás del cuello del páncreas (L1–L2)",
    sections: [
      ["Anatomía", ["Vena porta = esplénica + mesentérica superior; la mesentérica inferior drena en la esplénica. En el modelo se ven la esplénica y la mesentérica superior.", "Aporta alrededor de 75 % del flujo hepático: sangre rica en nutrientes y pobre en oxígeno."]],
      ["Anastomosis portocavas", ["Esófago: gástrica izquierda ↔ ácigos → várices esofágicas.", "Ombligo: paraumbilicales ↔ epigástricas → cabeza de medusa.", "Recto: rectal superior ↔ rectales media e inferior → várices rectales."]],
      ["Correlación clínica ENARM", ["Hipertensión portal clínicamente significativa: gradiente de presión venosa hepática ≥ 10 mmHg; la cirrosis es la causa más común.", "Sangrado variceal: reanimación restrictiva, vasoconstrictor esplácnico (terlipresina u octreótido), ceftriaxona profiláctica y ligadura endoscópica.", "Ascitis con gradiente albúmina sérica-ascitis ≥ 1.1 g/dL: hipertensión portal.", "Peritonitis bacteriana espontánea: ≥ 250 polimorfonucleares/mm³; cefalosporina de tercera generación y albúmina."]],
    ],
    pearl: "Gradiente de albúmina ≥ 1.1 g/dL = la ascitis es por hipertensión portal.",
    quiz: [
      q("Paciente cirrótico con ascitis, fiebre y 380 polimorfonucleares/mm³ en el líquido. Diagnóstico y manejo:", "Peritonitis bacteriana espontánea: cefalosporina de tercera generación y albúmina", ["Ascitis no complicada: solo diuréticos", "Peritonitis secundaria: laparotomía", "Carcinomatosis: citología"], "Con ≥ 250 PMN/mm³ se trata sin esperar el cultivo; la albúmina previene el síndrome hepatorrenal."),
      q("La vena porta se forma por la unión de:", "La vena esplénica y la mesentérica superior", ["Las venas mesentéricas superior e inferior", "La esplénica y la gástrica izquierda", "Las venas hepáticas"], "Se unen detrás del cuello del páncreas; la mesentérica inferior suele drenar en la esplénica."),
    ],
  },
  timo: {
    name: "Timo",
    level: "Mediastino anterosuperior, detrás del manubrio",
    sections: [
      ["Anatomía y función", ["Madura los linfocitos T. Es grande en la infancia e involuciona después de la pubertad.", "Deriva de la tercera bolsa faríngea, igual que las paratiroides inferiores."]],
      ["Correlación clínica ENARM", ["Masas del mediastino anterior, las «4 T»: timoma, teratoma, tiroides y «terrible» linfoma.", "Miastenia gravis: 10–15 % tienen timoma y la mayoría hiperplasia tímica; pedir tomografía de tórax.", "Síndrome de DiGeorge (22q11): aplasia tímica, hipocalcemia y cardiopatía conotruncal.", "Signo de la vela en la radiografía del lactante: timo normal."]],
    ],
    pearl: "Miastenia gravis → tomografía de tórax para buscar timoma.",
    quiz: [q("Tumor más frecuente del mediastino anterior en el adulto, asociado a miastenia gravis:", "Timoma", ["Schwannoma", "Quiste broncogénico", "Linfoma de Hodgkin"], "Los tumores neurogénicos son del mediastino posterior; los quistes broncogénicos, del medio.")],
  },
  prostata: {
    name: "Próstata y vesículas seminales",
    level: "Bajo la vejiga, delante del recto",
    sections: [
      ["Anatomía", ["Rodea la uretra prostática. Zona de transición (periuretral): asiento de la hiperplasia. Zona periférica: asiento del cáncer, palpable al tacto rectal.", "La vesícula seminal y el conducto deferente forman el conducto eyaculador."]],
      ["Correlación clínica ENARM", ["Hiperplasia prostática: los alfabloqueadores (tamsulosina) alivian rápido; los inhibidores de la 5-alfa-reductasa (finasterida) reducen el volumen en meses.", "Cáncer de próstata: adenocarcinoma de la zona periférica; antígeno prostático y tacto rectal; el diagnóstico es por biopsia. Metástasis óseas blásticas en la columna.", "Prostatitis aguda: E. coli; evitar el masaje prostático."]],
    ],
    pearl: "Hiperplasia = zona de transición. Cáncer = zona periférica.",
    quiz: [q("El adenocarcinoma de próstata se origina con mayor frecuencia en la zona:", "Periférica", ["De transición", "Central", "Periuretral"], "Por eso puede palparse en el tacto rectal y da síntomas obstructivos tardíos.")],
  },
  genitales: {
    name: "Testículo y escroto",
    level: "Arteria testicular: rama de la aorta en L2",
    sections: [
      ["Anatomía", ["Vena testicular derecha → cava inferior; izquierda → vena renal izquierda.", "Linfáticos del testículo → ganglios paraaórticos; los del escroto → inguinales superficiales.", "Reflejo cremastérico: L1–L2 (nervio genitofemoral)."]],
      ["Correlación clínica ENARM", ["Torsión testicular: dolor súbito, testículo elevado y horizontal, reflejo cremastérico ausente; exploración quirúrgica urgente, idealmente antes de 6 h.", "Epididimitis: el dolor mejora al elevar el testículo (Prehn positivo); en menores de 35 años, Chlamydia y gonococo.", "Criptorquidia: orquidopexia entre los 6 y 12 meses (máximo 18); riesgo de infertilidad y cáncer.", "Cáncer testicular: masa indolora en un joven; AFP, hCG y DHL; orquiectomía radical por vía inguinal, nunca biopsia transescrotal."]],
    ],
    pearl: "Dolor testicular súbito sin reflejo cremastérico = torsión hasta demostrar lo contrario.",
    quiz: [
      q("Adolescente con dolor testicular súbito, testículo elevado y reflejo cremastérico ausente. Conducta:", "Exploración quirúrgica urgente", ["Antibiótico y control en 48 h", "Ultrasonido Doppler programado", "Analgésico y reposo"], "El tiempo es testículo: la viabilidad cae después de 6 h; el Doppler no debe retrasar la cirugía."),
      q("Los linfáticos del testículo drenan a los ganglios:", "Paraaórticos (lumbares)", ["Inguinales superficiales", "Ilíacos internos", "Obturadores"], "El testículo desciende desde el retroperitoneo y conserva su drenaje; el escroto drena a los inguinales."),
    ],
  },
  craneo: {
    name: "Cráneo",
    level: "Pterion: unión de frontal, parietal, temporal y esfenoides",
    sections: [
      ["Anatomía", ["Neurocráneo (8 huesos) y viscerocráneo (14). Suturas coronal, sagital y lambdoidea.", "Fontanela anterior: cierra entre los 9 y 18 meses; la posterior, al mes o dos.", "Bajo el pterion corre la arteria meníngea media.", "Base: agujero oval (V3), redondo (V2), espinoso (meníngea media), yugular (IX, X, XI) y magno."]],
      ["Correlación clínica ENARM", ["Hematoma epidural: arteria meníngea media, fractura temporal, intervalo lúcido; imagen biconvexa que no cruza suturas.", "Hematoma subdural: venas puente; imagen semilunar que sí cruza suturas; ancianos y alcohólicos.", "Fractura de la base: ojos de mapache, signo de Battle, salida de líquido cefalorraquídeo por nariz u oído; no colocar sonda nasogástrica.", "Glasgow ≤ 8: vía aérea definitiva.", "Tríada de Cushing (hipertensión, bradicardia, respiración irregular): hipertensión intracraneal."]],
    ],
    pearl: "Biconvexo = epidural (arteria). Semilunar = subdural (venas puente).",
    quiz: [
      q("Golpe en la región temporal, pérdida breve del estado de alerta, recuperación y deterioro una hora después. La tomografía mostrará:", "Imagen biconvexa que no cruza suturas", ["Imagen semilunar que cruza suturas", "Sangre en las cisternas de la base", "Hipodensidad en un territorio arterial"], "Hematoma epidural por lesión de la arteria meníngea media, con intervalo lúcido."),
      q("Paciente con ojos de mapache y salida de líquido claro por la nariz tras un traumatismo. Está contraindicado:", "Colocar una sonda nasogástrica", ["Colocar un collarín cervical", "Hacer una tomografía de cráneo", "Administrar oxígeno"], "En la fractura de la base anterior la sonda puede entrar al cráneo; se usa la vía orogástrica."),
    ],
  },
  hombro: {
    name: "Cintura escapular",
    level: "La clavícula es el primer hueso en osificarse",
    sections: [
      ["Anatomía", ["La clavícula une el esternón con el acromion: es la única unión ósea del miembro superior con el tronco.", "Manguito rotador: supraespinoso (inicia la abducción), infraespinoso y redondo menor (rotación externa), subescapular (rotación interna)."]],
      ["Correlación clínica ENARM", ["Fractura de clavícula: tercio medio; cabestrillo. Es la fractura más frecuente del recién nacido.", "Luxación glenohumeral anterior (95 %): signo de la charretera; explorar el nervio axilar (sensibilidad sobre el deltoides).", "Luxación posterior: convulsiones o descarga eléctrica.", "Escápula alada: lesión del nervio torácico largo (serrato anterior).", "Parálisis de Erb-Duchenne (C5–C6): brazo en aducción y rotación interna, «propina del mesero»."]],
    ],
    pearl: "Luxación anterior de hombro → explora el nervio axilar antes y después de reducir.",
    quiz: [q("Nervio que se lesiona con mayor frecuencia en la luxación anterior de hombro:", "Axilar", ["Radial", "Musculocutáneo", "Torácico largo"], "Rodea el cuello quirúrgico del húmero; da sensibilidad a la piel sobre el deltoides.")],
  },
  humero: {
    name: "Húmero y codo",
    level: "Cuello quirúrgico · surco radial · epicóndilos",
    sections: [
      ["Nervio en riesgo según el sitio", ["Cuello quirúrgico: nervio axilar.", "Diáfisis (surco radial): nervio radial → mano caída.", "Supracondílea: arteria braquial y nervio mediano.", "Epicóndilo medial: nervio cubital → garra cubital."]],
      ["Correlación clínica ENARM", ["Fractura supracondílea en extensión: la más frecuente del codo infantil; vigilar el pulso y el síndrome compartimental (contractura de Volkmann).", "Codo de niñera: subluxación de la cabeza del radio por tracción; se reduce con supinación y flexión o con hiperpronación.", "Epicondilitis lateral: codo de tenista, origen de los extensores."]],
    ],
    pearl: "Fractura de la diáfisis del húmero con mano caída = nervio radial.",
    quiz: [q("Fractura de la diáfisis humeral con incapacidad para extender la muñeca y los dedos. Nervio lesionado:", "Radial", ["Mediano", "Cubital", "Axilar"], "El radial corre por el surco radial, pegado a la diáfisis.")],
  },
  antebrazo: {
    name: "Antebrazo: radio y cúbito",
    level: "Radio del lado del pulgar · cúbito del lado del meñique",
    sections: [
      ["Anatomía", ["La pronación y la supinación ocurren en las articulaciones radiocubitales; la membrana interósea une ambos huesos.", "Pulso radial: lateral al tendón del flexor radial del carpo. Prueba de Allen antes de puncionar la arteria."]],
      ["Fracturas con nombre", ["Colles: radio distal con desplazamiento dorsal, «dorso de tenedor»; caída sobre la mano extendida.", "Smith: radio distal con desplazamiento palmar.", "Monteggia: fractura del cúbito proximal con luxación de la cabeza del radio.", "Galeazzi: fractura del radio distal con luxación radiocubital distal."]],
    ],
    pearl: "MUGR: Monteggia rompe el cúbito (ulna), Galeazzi rompe el radio.",
    quiz: [q("Fractura del tercio proximal del cúbito con luxación de la cabeza del radio:", "Monteggia", ["Galeazzi", "Colles", "Smith"], "Galeazzi es la inversa: radio fracturado y luxación radiocubital distal.")],
  },
  mano: {
    name: "Mano y muñeca",
    level: "8 huesos del carpo · 5 metacarpianos · 14 falanges",
    sections: [
      ["Anatomía", ["Fila proximal: escafoides, semilunar, piramidal y pisiforme. Fila distal: trapecio, trapezoide, grande y ganchoso.", "Túnel del carpo: nervio mediano y nueve tendones flexores."]],
      ["Correlación clínica ENARM", ["Fractura de escafoides: dolor en la tabaquera anatómica; la radiografía inicial puede ser normal: inmovilizar con férula que incluya el pulgar y repetirla en 10–14 días. Riesgo de necrosis avascular del polo proximal.", "Síndrome del túnel del carpo: parestesias nocturnas en los tres primeros dedos; Tinel y Phalen; atrofia tenar tardía.", "Fractura del boxeador: cuello del quinto metacarpiano.", "Radial: mano caída. Cubital: garra. Mediano: mano del predicador."]],
    ],
    pearl: "Dolor en la tabaquera anatómica = fractura de escafoides aunque la radiografía sea normal.",
    quiz: [q("Caída sobre la mano extendida, dolor en la tabaquera anatómica y radiografía normal. Conducta:", "Inmovilizar con férula que incluya el pulgar y repetir la radiografía en 10–14 días", ["Alta con analgésico", "Vendaje elástico y movilización", "Cirugía inmediata"], "La fractura puede no verse al inicio y su consolidación está en riesgo por la irrigación retrógrada.")],
  },
  femur: {
    name: "Fémur y cadera",
    level: "La cabeza se irriga por la circunfleja femoral medial",
    sections: [
      ["Anatomía", ["Las arterias retinaculares suben por el cuello hasta la cabeza: una fractura intracapsular puede dejarla sin riego (necrosis avascular)."]],
      ["Correlación clínica ENARM", ["Fractura de cadera del anciano: miembro acortado y en rotación externa. Intracapsular desplazada: artroplastia. Intertrocantérica: osteosíntesis. Operar en 24–48 h.", "Luxación posterior de cadera (golpe contra el tablero): acortado, en aducción y rotación interna; explorar el nervio ciático.", "Fractura de la diáfisis: puede perder más de un litro de sangre; embolia grasa (disnea, confusión, petequias).", "En el niño: displasia del desarrollo (Ortolani y Barlow; ultrasonido antes de los 4–6 meses), Legg-Calvé-Perthes (4–8 años) y deslizamiento de la epífisis (adolescente con obesidad)."]],
    ],
    pearl: "Acortado y en rotación externa: fractura. Acortado y en rotación interna: luxación posterior.",
    quiz: [
      q("Mujer de 82 años que cae de su altura; miembro pélvico acortado y en rotación externa:", "Fractura de cadera", ["Luxación posterior de cadera", "Fractura de la diáfisis femoral", "Esguince de rodilla"], "La luxación posterior deja el miembro en aducción y rotación interna."),
      q("Estudio de elección para la displasia del desarrollo de la cadera en un lactante de 2 meses:", "Ultrasonido de cadera", ["Radiografía de pelvis", "Tomografía", "Resonancia magnética"], "Antes de los 4–6 meses la cabeza femoral aún no está osificada y la radiografía no la muestra."),
    ],
  },
  pierna: {
    name: "Rodilla y pierna",
    level: "El nervio peroneo común rodea el cuello del peroné",
    sections: [
      ["Anatomía", ["Ligamento cruzado anterior: impide que la tibia se desplace hacia delante. El posterior, hacia atrás.", "El menisco medial está fijo al ligamento colateral medial, por eso se lesiona más."]],
      ["Correlación clínica ENARM", ["Lesión del cruzado anterior: giro con chasquido y derrame inmediato; la prueba de Lachman es la más sensible.", "Lesión del peroneo común: pie caído, sin dorsiflexión ni eversión.", "Síndrome compartimental (fractura de tibia): dolor desproporcionado que aumenta al estirar de forma pasiva; fasciotomía. La falta de pulso es tardía.", "Osgood-Schlatter: dolor en la tuberosidad tibial del adolescente deportista."]],
    ],
    pearl: "En el síndrome compartimental el dolor desproporcionado es lo primero; el pulso se pierde al final.",
    quiz: [q("Fractura de tibia enyesada, dolor intenso que no cede y aumenta al extender de forma pasiva los dedos; pulsos presentes. Conducta:", "Retirar el yeso y hacer fasciotomía urgente", ["Aumentar los analgésicos", "Elevar la extremidad y revalorar en 12 h", "Solicitar ultrasonido Doppler"], "Es un síndrome compartimental: el diagnóstico es clínico y el pulso presente no lo descarta.")],
  },
  pie: {
    name: "Tobillo y pie",
    level: "7 huesos del tarso · 5 metatarsianos · 14 falanges",
    sections: [
      ["Anatomía", ["El astrágalo no tiene inserciones musculares y su irrigación es precaria.", "Pulso pedio: lateral al tendón del extensor largo del dedo gordo. Tibial posterior: detrás del maléolo medial."]],
      ["Correlación clínica ENARM", ["Esguince por inversión: ligamento peroneoastragalino anterior.", "Reglas de Ottawa: radiografía si hay dolor óseo en el borde posterior o la punta de un maléolo, en la base del quinto metatarsiano o en el navicular, o si no puede dar cuatro pasos.", "Fractura de calcáneo por caída de altura: buscar fractura de la columna lumbar.", "Pie diabético: neuropatía (monofilamento) más isquemia.", "Pie equinovaro congénito: método de Ponseti."]],
    ],
    pearl: "Caída de altura con fractura de calcáneo → revisa la columna lumbar.",
    quiz: [q("Ligamento que se lesiona con mayor frecuencia en el esguince de tobillo por inversión:", "Peroneoastragalino anterior", ["Deltoideo", "Peroneocalcáneo", "Tibioperoneo posterior"], "Es el más débil del complejo lateral.")],
  },
  frontal: {
    name: "Lóbulo frontal",
    level: "Delante del surco central · arterias cerebral anterior y media",
    sections: [
      ["Funciones", ["Corteza prefrontal: planeación, juicio y conducta.", "Área de Broca (giro frontal inferior del hemisferio dominante): expresión del lenguaje. Ese giro no está en este modelo.", "Campos oculares frontales: mirada conjugada hacia el lado contrario."]],
      ["Correlación clínica ENARM", ["Afasia de Broca: habla no fluente con comprensión conservada.", "Lesión hemisférica: los ojos se desvían hacia el lado de la lesión.", "Síndrome frontal: desinhibición o apatía y reflejos de liberación.", "Infarto de la cerebral anterior: debilidad de la pierna contralateral, abulia e incontinencia."]],
    ],
    pearl: "Broca: habla rota pero entiende. En la lesión hemisférica, los ojos miran hacia la lesión.",
    quiz: [q("Paciente que entiende órdenes pero habla con esfuerzo, con frases cortas y sin fluidez:", "Afasia de Broca", ["Afasia de Wernicke", "Afasia de conducción", "Disartria"], "Lesión del giro frontal inferior dominante, territorio de la división superior de la cerebral media.")],
  },
  motora: {
    name: "Corteza motora y somatosensorial",
    level: "Giro precentral (área 4) y poscentral (áreas 3, 1, 2)",
    sections: [
      ["Homúnculo", ["Cara y mano en la convexidad lateral: arteria cerebral media.", "Pierna y pie en la cara medial: arteria cerebral anterior.", "La vía corticoespinal baja por el brazo posterior de la cápsula interna y se cruza en el bulbo."]],
      ["Correlación clínica ENARM", ["Infarto de la cerebral media: hemiparesia e hipoestesia contralaterales de predominio en cara y brazo; afasia si es el hemisferio dominante, negligencia si no lo es.", "Motoneurona superior: espasticidad, hiperreflexia y Babinski. Inferior: flacidez, atrofia y fasciculaciones.", "Crisis focal motora con marcha jacksoniana y parálisis de Todd posterior."]],
    ],
    pearl: "Cara y brazo = cerebral media. Pierna = cerebral anterior.",
    quiz: [
      q("Hemiparesia derecha que predomina en la pierna, con abulia e incontinencia urinaria. Arteria afectada:", "Cerebral anterior izquierda", ["Cerebral media izquierda", "Cerebral posterior izquierda", "Basilar"], "La pierna se representa en la cara medial del hemisferio."),
      q("Hiperreflexia, espasticidad y signo de Babinski indican lesión de:", "Motoneurona superior", ["Motoneurona inferior", "Unión neuromuscular", "Músculo"], "La motoneurona inferior produce flacidez, atrofia y fasciculaciones."),
    ],
  },
  parietal: {
    name: "Lóbulo parietal",
    level: "Detrás del surco central",
    sections: [
      ["Funciones", ["Integra la sensibilidad y el esquema corporal. El no dominante dirige la atención al espacio; el dominante, el cálculo y la escritura."]],
      ["Correlación clínica ENARM", ["Negligencia del lado izquierdo: lesión parietal derecha.", "Síndrome de Gerstmann (giro angular dominante): agrafia, acalculia, agnosia digital y confusión derecha-izquierda.", "Cuadrantanopsia inferior contralateral: radiaciones ópticas superiores.", "Astereognosia y apraxia."]],
    ],
    pearl: "El paciente que ignora su lado izquierdo tiene dañado el parietal derecho.",
    quiz: [q("Agrafia, acalculia, agnosia digital y confusión derecha-izquierda:", "Síndrome de Gerstmann", ["Síndrome de Balint", "Síndrome de Anton", "Síndrome de Klüver-Bucy"], "Lesión del giro angular del hemisferio dominante.")],
  },
  temporal: {
    name: "Lóbulo temporal y sistema límbico",
    level: "Bajo la cisura de Silvio",
    sections: [
      ["Funciones", ["Corteza auditiva primaria. Área de Wernicke (giro temporal superior posterior, dominante): comprensión del lenguaje.", "Hipocampo: memoria reciente. Amígdala: miedo y emoción. Ínsula y cíngulo completan el sistema límbico."]],
      ["Correlación clínica ENARM", ["Afasia de Wernicke: habla fluida sin sentido y sin comprensión.", "Epilepsia del lóbulo temporal: aura epigástrica, desconexión y automatismos.", "Encefalitis herpética: afecta el temporal; aciclovir intravenoso sin esperar la PCR.", "Herniación del uncus: midriasis del mismo lado por compresión del III par.", "Cuadrantanopsia superior contralateral: asa de Meyer.", "Enfermedad de Alzheimer: atrofia del hipocampo."]],
    ],
    pearl: "Wernicke: habla mucho, no dice nada y no entiende.",
    quiz: [
      q("Fiebre, confusión y crisis convulsivas; la resonancia muestra lesión temporal. Tratamiento inmediato:", "Aciclovir intravenoso", ["Ceftriaxona sola", "Esperar el resultado de la PCR", "Esteroides"], "La encefalitis por herpes simple tipo 1 se trata de forma empírica: el retraso empeora el pronóstico."),
      q("Traumatismo craneal con midriasis derecha y deterioro del estado de alerta:", "Herniación del uncus derecho", ["Lesión del nervio óptico", "Síndrome de Horner", "Herniación de las amígdalas cerebelosas"], "El uncus comprime el III par del mismo lado contra el borde del tentorio."),
    ],
  },
  occipital: {
    name: "Lóbulo occipital",
    level: "Corteza visual primaria en la cisura calcarina · arteria cerebral posterior",
    sections: [
      ["Correlación clínica ENARM", ["Infarto de la cerebral posterior: hemianopsia homónima contralateral con respeto macular.", "Ceguera cortical (lesión bilateral): no ve, pero los reflejos pupilares están conservados.", "Síndrome de Anton: niega su ceguera.", "Aura visual de la migraña."]],
    ],
    pearl: "Hemianopsia homónima con respeto macular = arteria cerebral posterior.",
    quiz: [q("Paciente que no ve, con pupilas reactivas y fondo de ojo normal:", "Ceguera cortical por lesión occipital bilateral", ["Neuritis óptica bilateral", "Glaucoma agudo", "Compresión del quiasma"], "El reflejo fotomotor no pasa por la corteza: va del nervio óptico al mesencéfalo.")],
  },
  capsula: {
    name: "Sustancia blanca y cápsula interna",
    level: "La cápsula interna pasa entre el tálamo y el núcleo lenticular",
    sections: [
      ["Anatomía", ["Brazo anterior, rodilla (fibras corticobulbares) y brazo posterior (corticoespinal y sensitivas). El modelo muestra el brazo anterior.", "La irrigan las arterias lenticuloestriadas, ramas perforantes de la cerebral media.", "El cuerpo calloso une los dos hemisferios."]],
      ["Correlación clínica ENARM", ["Infartos lacunares por hipertensión y diabetes: motor puro (brazo posterior de la cápsula o base del puente), sensitivo puro (tálamo), hemiparesia atáxica y disartria-mano torpe.", "Hemorragia hipertensiva: putamen y cápsula (la más frecuente), tálamo, puente y cerebelo.", "Esclerosis múltiple: placas periventriculares perpendiculares a los ventrículos; el brote se trata con metilprednisolona."]],
    ],
    pearl: "Hemiparesia motora pura sin signos corticales = infarto lacunar en la cápsula interna.",
    quiz: [q("Hipertenso con hemiparesia derecha pura de cara, brazo y pierna, sin afasia ni déficit sensitivo:", "Infarto lacunar en el brazo posterior de la cápsula interna", ["Infarto cortical de la cerebral media", "Infarto de la cerebral posterior", "Lesión medular"], "La falta de afasia, negligencia o déficit visual descarta la corteza.")],
  },
  basales: {
    name: "Ganglios basales",
    level: "Caudado + putamen = estriado · putamen + globo pálido = lenticular",
    sections: [
      ["Función", ["Modulan el movimiento: la vía directa lo facilita y la indirecta lo frena; la dopamina de la sustancia negra favorece el movimiento."]],
      ["Correlación clínica ENARM", ["Enfermedad de Parkinson: pérdida de neuronas dopaminérgicas de la sustancia negra; bradicinesia más temblor de reposo o rigidez; levodopa con carbidopa.", "Enfermedad de Huntington: atrofia del caudado, repeticiones CAG, herencia autosómica dominante; corea y demencia.", "Hemibalismo: lesión del núcleo subtalámico contralateral.", "Enfermedad de Wilson: degeneración hepatolenticular y anillo de Kayser-Fleischer.", "Kernícterus: bilirrubina depositada en los ganglios basales."]],
    ],
    pearl: "Movimientos amplios y violentos de medio cuerpo = núcleo subtalámico del lado contrario.",
    quiz: [q("Hombre de 40 años con corea y demencia; su padre tuvo lo mismo. Estructura atrofiada:", "Núcleo caudado", ["Sustancia negra", "Núcleo subtalámico", "Cerebelo"], "Enfermedad de Huntington: la atrofia del caudado agranda las astas frontales de los ventrículos laterales.")],
  },
  talamo: {
    name: "Tálamo e hipotálamo",
    level: "A los lados del tercer ventrículo",
    sections: [
      ["Función", ["Tálamo: relevo de todas las vías sensitivas menos el olfato. VPL (cuerpo), VPM (cara), geniculado lateral (visión) y medial (audición).", "Hipotálamo: temperatura, hambre, sed, ritmo circadiano y control de la hipófisis; produce ADH y oxitocina."]],
      ["Correlación clínica ENARM", ["Síndrome talámico: pérdida de la sensibilidad contralateral y después dolor.", "Diabetes insípida central: poliuria hipotónica que responde a la desmopresina.", "Secreción inadecuada de ADH: hiponatremia con volumen normal.", "Encefalopatía de Wernicke: oftalmoplejía, ataxia y confusión; tiamina antes que glucosa."]],
    ],
    pearl: "Todo lo sensitivo pasa por el tálamo, menos el olfato.",
    quiz: [q("Alcohólico con confusión, ataxia y oftalmoplejía. Antes de la solución glucosada debe recibir:", "Tiamina", ["Ácido fólico", "Vitamina B12", "Naloxona"], "La glucosa sin tiamina puede precipitar o agravar la encefalopatía de Wernicke.")],
  },
  ventriculos: {
    name: "Sistema ventricular y líquido cefalorraquídeo",
    level: "150 mL en total · se producen unos 500 mL al día",
    sections: [
      ["Circulación", ["Plexos coroideos → ventrículos laterales → agujeros de Monro → tercer ventrículo → acueducto de Silvio → cuarto ventrículo → agujeros de Luschka y Magendie → espacio subaracnoideo → granulaciones aracnoideas."]],
      ["Correlación clínica ENARM", ["Hidrocefalia obstructiva: estenosis del acueducto o tumores. Comunicante: tras meningitis o hemorragia subaracnoidea.", "Hidrocefalia normotensa: alteración de la marcha, demencia e incontinencia.", "Punción lumbar en L3–L4 o L4–L5; antes, descartar datos de masa o herniación.", "Líquido bacteriano: polimorfonucleares, glucosa baja y proteínas altas. Viral: linfocitos y glucosa normal.", "Meningitis bacteriana del adulto: ceftriaxona y vancomicina, con dexametasona; añadir ampicilina después de los 50 años o con inmunocompromiso."]],
    ],
    pearl: "Marcha magnética, demencia e incontinencia = hidrocefalia normotensa.",
    quiz: [
      q("Líquido cefalorraquídeo turbio con 2 000 leucocitos (90 % polimorfonucleares), glucosa de 18 mg/dL y proteínas de 250 mg/dL:", "Meningitis bacteriana", ["Meningitis viral", "Meningitis tuberculosa", "Síndrome de Guillain-Barré"], "Predominio de neutrófilos con glucosa baja y proteínas altas."),
      q("Anciano con marcha de pasos cortos, deterioro cognitivo e incontinencia urinaria; ventrículos dilatados:", "Hidrocefalia normotensa", ["Enfermedad de Parkinson", "Enfermedad de Alzheimer", "Demencia vascular"], "La punción evacuadora que mejora la marcha apoya el diagnóstico y predice la respuesta a la derivación."),
    ],
  },
  cerebelo: {
    name: "Cerebelo",
    level: "Fosa posterior · arterias cerebelosas superior, anteroinferior y posteroinferior",
    sections: [
      ["Función", ["Coordina el movimiento del mismo lado, el equilibrio y el tono. Vermis: tronco y marcha. Hemisferios: extremidades."]],
      ["Correlación clínica ENARM", ["Síndrome cerebeloso: ataxia, dismetría, disdiadococinesia, temblor de intención y nistagmo, del mismo lado de la lesión.", "Alcoholismo crónico: atrofia del vermis con ataxia de la marcha.", "Infarto o hemorragia cerebelosa: puede comprimir el tronco y causar hidrocefalia; valorar descompresión.", "Tumores de fosa posterior en el niño: meduloblastoma (vermis) y astrocitoma pilocítico."]],
    ],
    pearl: "El cerebelo falla del mismo lado: lesión derecha, dismetría derecha.",
    quiz: [q("Lesión del hemisferio cerebeloso derecho. Se espera:", "Dismetría y temblor de intención en las extremidades derechas", ["Hemiparesia izquierda", "Dismetría izquierda", "Afasia"], "Las vías cerebelosas se cruzan dos veces, así que el déficit es ipsilateral.")],
  },
  tronco: {
    name: "Tronco encefálico",
    level: "Mesencéfalo (III, IV) · puente (V–VIII) · bulbo (IX–XII)",
    sections: [
      ["Anatomía", ["Los pares craneales III y IV salen del mesencéfalo; del V al VIII, del puente; del IX al XII, del bulbo.", "En el bulbo están los centros respiratorio y cardiovascular y se cruzan las pirámides."]],
      ["Correlación clínica ENARM", ["Síndromes alternos: par craneal de un lado y hemiparesia del otro.", "Weber (mesencéfalo): parálisis del III par y hemiparesia contralateral.", "Wallenberg (arteria cerebelosa posteroinferior, bulbo lateral): pérdida de dolor y temperatura en la cara del mismo lado y en el cuerpo del contrario, disfagia, ronquera, Horner y ataxia; sin debilidad.", "Hemorragia del puente: coma con pupilas puntiformes.", "Síndrome de enclaustramiento: base del puente, arteria basilar."]],
    ],
    pearl: "Par craneal de un lado y hemiparesia del otro = la lesión está en el tronco.",
    quiz: [q("Vértigo, disfagia, ronquera, Horner derecho y pérdida de dolor y temperatura en la hemicara derecha y el hemicuerpo izquierdo:", "Síndrome de Wallenberg", ["Síndrome de Weber", "Infarto de la cerebral media", "Síndrome de enclaustramiento"], "Infarto bulbar lateral por oclusión de la arteria vertebral o de la cerebelosa posteroinferior.")],
  },
  hipofisis: {
    name: "Hipófisis",
    level: "Silla turca del esfenoides, bajo el quiasma óptico",
    sections: [
      ["Anatomía", ["Adenohipófisis: GH, prolactina, ACTH, TSH, FSH y LH.", "Neurohipófisis: almacena la ADH y la oxitocina que produce el hipotálamo."]],
      ["Correlación clínica ENARM", ["Prolactinoma: el adenoma más frecuente; amenorrea y galactorrea; se trata con cabergolina.", "Macroadenoma: hemianopsia bitemporal por compresión del quiasma.", "Acromegalia: IGF-1 elevado y GH que no se suprime con glucosa.", "Síndrome de Sheehan: necrosis hipofisaria posparto; falta de lactancia y amenorrea.", "Apoplejía hipofisaria: cefalea súbita con oftalmoplejía; hidrocortisona urgente."]],
    ],
    pearl: "Hemianopsia bitemporal = quiasma comprimido, casi siempre por un adenoma de hipófisis.",
    quiz: [
      q("Mujer con amenorrea, galactorrea y pérdida de la visión periférica de ambos lados. Tratamiento inicial:", "Agonista dopaminérgico (cabergolina)", ["Cirugía transesfenoidal inmediata", "Radioterapia", "Anticonceptivos orales"], "El prolactinoma responde al tratamiento médico incluso cuando es macroadenoma."),
      q("Tras una hemorragia obstétrica grave, la paciente no logra lactar y no recupera la menstruación:", "Síndrome de Sheehan", ["Síndrome de Asherman", "Prolactinoma", "Síndrome de ovario poliquístico"], "La hipófisis crecida del embarazo es vulnerable a la hipoperfusión."),
    ],
  },
  optica: {
    name: "Vía óptica y ojo",
    level: "Nervio → quiasma → cintilla → cuerpo geniculado lateral → radiaciones → cisura calcarina",
    sections: [
      ["Defectos del campo visual", ["Nervio óptico: ceguera de un ojo.", "Quiasma: hemianopsia bitemporal.", "Cintilla óptica: hemianopsia homónima contralateral.", "Asa de Meyer (temporal): cuadrantanopsia superior. Radiación parietal: cuadrantanopsia inferior.", "Occipital: hemianopsia homónima con respeto macular."]],
      ["Correlación clínica ENARM", ["Reflejo fotomotor: entra por el II par y sale por el III.", "Defecto pupilar aferente: neuritis óptica (esclerosis múltiple).", "Glaucoma agudo de ángulo cerrado: ojo rojo y doloroso, pupila en midriasis media fija y córnea turbia.", "Oclusión de la arteria central de la retina: pérdida súbita e indolora, mancha rojo cereza.", "Desprendimiento de retina: destellos, moscas volantes y una cortina."]],
    ],
    pearl: "Detrás del quiasma los defectos son homónimos y del lado contrario a la lesión.",
    quiz: [q("Pérdida súbita e indolora de la visión de un ojo con mancha rojo cereza en la mácula:", "Oclusión de la arteria central de la retina", ["Desprendimiento de retina", "Glaucoma agudo", "Neuritis óptica"], "La fóvea conserva su color por la coroides mientras el resto de la retina palidece.")],
  },
};

export const CARDS = { ...TORSO, ...MORE };
