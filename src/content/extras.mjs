// Monitor rhythms (criteria and first-line management per ACLS) and the facts shown in the explorer.
export const RHYTHMS = [
  { id: "sinusal", name: "Ritmo sinusal", rate: "72 lpm", text: "Onda P antes de cada QRS, PR de 120 a 200 ms, QRS menor de 120 ms, frecuencia de 60 a 100." },
  { id: "taqui", name: "Taquicardia sinusal", rate: "125 lpm", text: "Sinusal a más de 100. Se trata la causa: fiebre, dolor, hipovolemia, anemia, hipertiroidismo." },
  { id: "bradi", name: "Bradicardia sinusal", rate: "45 lpm", text: "Sinusal a menos de 60. Con síntomas: atropina 1 mg intravenoso cada 3 a 5 min, máximo 3 mg; si no responde, marcapasos transcutáneo o infusión de dopamina o adrenalina." },
  { id: "fa", name: "Fibrilación auricular", rate: "≈ 110 lpm, irregular", text: "Irregularmente irregular y sin ondas P. Inestable: cardioversión sincronizada. Estable: controlar la frecuencia y anticoagular según CHA₂DS₂-VASc." },
  { id: "flutter", name: "Flutter auricular 2:1", rate: "150 lpm", text: "Ondas en dientes de sierra a 300 por minuto, mejor vistas en DII, DIII y aVF, con conducción 2:1. Sospéchalo ante una frecuencia regular de 150." },
  { id: "bav3", name: "Bloqueo AV de tercer grado", rate: "P 80 · QRS 38", text: "Disociación auriculoventricular: las P y los QRS no guardan relación; el escape es ancho y lento. Marcapasos: transcutáneo de inicio y definitivo después." },
  { id: "tv", name: "Taquicardia ventricular", rate: "180 lpm", text: "QRS ancho, regular, monomórfico. Con pulso e inestable: cardioversión sincronizada. Estable: amiodarona. Sin pulso: desfibrilación." },
  { id: "fv", name: "Fibrilación ventricular", rate: "sin pulso", text: "Actividad caótica sin QRS: paro cardiaco. Reanimación de alta calidad y desfibrilación inmediata; adrenalina cada 3 a 5 min y amiodarona tras la tercera descarga." },
];

export const FACTS = [
  "El hígado puede recuperar su tamaño a partir de una cuarta parte de su masa.",
  "El corazón late unas 100 000 veces al día y mueve cerca de 7 000 litros de sangre.",
  "Los riñones filtran 180 litros de plasma al día y devuelven más de 99 %.",
  "La superficie de los alvéolos extendida cubre unos 70 m²: media cancha de tenis.",
  "El fémur soporta, a lo largo, varias veces el peso del cuerpo.",
  "El intestino delgado mide unos 6 metros; el colon, metro y medio.",
  "El nervio vago llega hasta el ángulo esplénico del colon: de ahí en adelante manda el parasimpático sacro.",
  "El cerebro pesa 2 % del cuerpo y consume 20 % de su oxígeno.",
  "El hueso más pequeño es el estribo, en el oído medio: mide unos 3 mm.",
  "La aorta mide unos 2.5 cm de diámetro al salir del corazón.",
  "El estómago renueva su capa de moco cada pocas horas para no digerirse a sí mismo.",
  "La médula espinal termina en L1–L2 en el adulto: por eso la punción lumbar se hace más abajo.",
];
