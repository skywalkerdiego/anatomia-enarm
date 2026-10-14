// Every structure of the 3D body: its name, colour, material, system and the study card it opens.

export const LAYERS = [
  { id: "piel", name: "Piel", short: "Piel" },
  { id: "hueso", name: "Esqueleto", short: "Hueso" },
  { id: "organo", name: "Órganos", short: "Órg." },
  { id: "vaso", name: "Vasos", short: "Vasos" },
  { id: "nervio", name: "Encéfalo", short: "SNC" },
];

// wrap (soft light), specular, gloss, rim
export const MATS = {
  piel: [0.5, 0.1, 20, 0.4],
  hueso: [0.24, 0.07, 14, 0.3],
  cartilago: [0.36, 0.22, 30, 0.36],
  organo: [0.55, 0.2, 52, 0.36],
  vaso: [0.45, 0.5, 64, 0.42],
  nervio: [0.5, 0.22, 34, 0.34],
};

export const SYSTEMS = [
  { id: "cardio", name: "Corazón y vasos" },
  { id: "resp", name: "Respiratorio" },
  { id: "digest", name: "Digestivo" },
  { id: "uro", name: "Urinario y genital" },
  { id: "neuro", name: "Sistema nervioso" },
  { id: "osteo", name: "Esqueleto" },
];

const BONE = "#E8DFCA";
const ART = "#D9453B";
const VEN = "#3E62C6";

// id: [name, short name, system, colour, material, card]
const T = {
  piel: ["Piel", "Piel", "osteo", "#EBC3A7", "piel", null],

  craneo: ["Cráneo", "Cráneo", "osteo", "#E9E1CC", "hueso", "craneo"],
  mandibula: ["Mandíbula", "Mandíbula", "osteo", "#E6DDC6", "hueso", "craneo"],
  laringe: ["Hioides y cartílago tiroides", "Laringe", "resp", "#C7D6DA", "cartilago", "cuello"],
  "col-cervical": ["Columna cervical", "Cervicales", "osteo", BONE, "hueso", "columna"],
  "col-toracica": ["Columna torácica", "Torácicas", "osteo", BONE, "hueso", "columna"],
  "col-lumbar": ["Columna lumbar", "Lumbares", "osteo", BONE, "hueso", "columna"],
  discos: ["Discos intervertebrales", "Discos", "osteo", "#9FC3CF", "cartilago", "columna"],
  sacro: ["Sacro y cóccix", "Sacro", "osteo", "#E2D8BF", "hueso", "pelvis"],
  costillas: ["Costillas", "Costillas", "osteo", "#EAE2CE", "hueso", "costillas"],
  cartilagos: ["Cartílagos costales", "Cartílagos", "osteo", "#BDD3DA", "cartilago", "costillas"],
  esternon: ["Esternón", "Esternón", "osteo", "#E6DDC6", "hueso", "costillas"],
  claviculas: ["Clavículas", "Clavículas", "osteo", BONE, "hueso", "hombro"],
  escapulas: ["Escápulas", "Escápulas", "osteo", "#E4DAC3", "hueso", "hombro"],
  humeros: ["Húmero", "Húmero", "osteo", BONE, "hueso", "humero"],
  radios: ["Radio", "Radio", "osteo", BONE, "hueso", "antebrazo"],
  cubitos: ["Cúbito (ulna)", "Cúbito", "osteo", "#E4DAC3", "hueso", "antebrazo"],
  manos: ["Huesos de la mano", "Mano", "osteo", BONE, "hueso", "mano"],
  pelvis: ["Huesos coxales", "Pelvis", "osteo", "#E6DDC6", "hueso", "pelvis"],
  femures: ["Fémur", "Fémur", "osteo", BONE, "hueso", "femur"],
  rotulas: ["Rótula", "Rótula", "osteo", "#E4DAC3", "hueso", "pierna"],
  tibias: ["Tibia", "Tibia", "osteo", BONE, "hueso", "pierna"],
  perones: ["Peroné (fíbula)", "Peroné", "osteo", "#E4DAC3", "hueso", "pierna"],
  pies: ["Huesos del pie", "Pie", "osteo", BONE, "hueso", "pie"],

  corazon: ["Corazón", "Corazón", "cardio", "#B5413F", "organo", "corazon"],
  valvulas: ["Válvulas cardiacas", "Válvulas", "cardio", "#F0E3D0", "cartilago", "valvulas"],
  "cor-izq": ["Tronco coronario izquierdo", "Tronco izq.", "cardio", "#EE4B3D", "vaso", "coronarias"],
  "cor-da": ["Descendente anterior", "Desc. anterior", "cardio", "#EE4B3D", "vaso", "coronarias"],
  "cor-cx": ["Arteria circunfleja", "Circunfleja", "cardio", "#EE4B3D", "vaso", "coronarias"],
  "cor-der": ["Coronaria derecha", "Coronaria der.", "cardio", "#EE4B3D", "vaso", "coronarias"],
  "venas-cardiacas": ["Venas cardiacas y seno coronario", "Venas cardiacas", "cardio", "#4668CF", "vaso", "coronarias"],
  aorta: ["Aorta", "Aorta", "cardio", ART, "vaso", "aorta"],
  carotidas: ["Carótidas comunes", "Carótidas", "cardio", "#DD4A3F", "vaso", "supraaorticos"],
  subclavias: ["Tronco braquiocefálico y subclavias", "Subclavias", "cardio", "#DD4A3F", "vaso", "supraaorticos"],
  "tronco-celiaco": ["Tronco celiaco", "Tronco celiaco", "cardio", ART, "vaso", "aorta"],
  mesentericas: ["Arterias mesentéricas", "Mesentéricas", "cardio", ART, "vaso", "aorta"],
  "art-renales": ["Arterias renales", "A. renales", "cardio", ART, "vaso", "aorta"],
  "art-iliacas": ["Arterias ilíacas", "A. ilíacas", "cardio", ART, "vaso", "aorta"],
  "art-pulmonar": ["Arteria pulmonar", "A. pulmonar", "cardio", "#4F74D6", "vaso", "pulmonar"],
  "ven-pulmonares": ["Venas pulmonares", "V. pulmonares", "cardio", "#E2574B", "vaso", "pulmonar"],
  vcs: ["Vena cava superior", "Cava superior", "cardio", VEN, "vaso", "cavas"],
  vci: ["Vena cava inferior", "Cava inferior", "cardio", VEN, "vaso", "cavas"],
  yugulares: ["Yugulares internas y subclavias", "Yugulares", "cardio", "#4267CC", "vaso", "cavas"],
  "ven-renales": ["Venas renales", "V. renales", "cardio", VEN, "vaso", "cavas"],
  "ven-iliacas": ["Venas ilíacas", "V. ilíacas", "cardio", VEN, "vaso", "cavas"],
  porta: ["Venas esplénica y mesentérica superior", "Sistema porta", "cardio", "#5B57C9", "vaso", "porta"],

  traquea: ["Tráquea", "Tráquea", "resp", "#CFDDE0", "cartilago", "traquea"],
  bronquios: ["Árbol bronquial", "Bronquios", "resp", "#C3D4D9", "cartilago", "traquea"],
  "pulmon-der-sup": ["Pulmón derecho · lóbulo superior", "LSD", "resp", "#E6A9A2", "organo", "pulmon-der"],
  "pulmon-der-med": ["Pulmón derecho · lóbulo medio", "LM", "resp", "#E19E97", "organo", "pulmon-der"],
  "pulmon-der-inf": ["Pulmón derecho · lóbulo inferior", "LID", "resp", "#DB978F", "organo", "pulmon-der"],
  "pulmon-izq-sup": ["Pulmón izquierdo · lóbulo superior", "LSI", "resp", "#E6A9A2", "organo", "pulmon-izq"],
  "pulmon-izq-inf": ["Pulmón izquierdo · lóbulo inferior", "LII", "resp", "#DB978F", "organo", "pulmon-izq"],
  diafragma: ["Diafragma", "Diafragma", "resp", "#B96A5E", "organo", "diafragma"],
  timo: ["Timo", "Timo", "resp", "#E3BCA8", "organo", "timo"],

  esofago: ["Esófago", "Esófago", "digest", "#D8A08A", "organo", "esofago"],
  estomago: ["Estómago", "Estómago", "digest", "#E3A68D", "organo", "estomago"],
  duodeno: ["Duodeno", "Duodeno", "digest", "#E0B08A", "organo", "duodeno"],
  yeyuno: ["Yeyuno", "Yeyuno", "digest", "#E6B79C", "organo", "intestino"],
  ileon: ["Íleon", "Íleon", "digest", "#E1AB93", "organo", "intestino"],
  colon: ["Colon y ciego", "Colon", "digest", "#C98E7C", "organo", "colon"],
  apendice: ["Apéndice", "Apéndice", "digest", "#D08F7A", "organo", "colon"],
  recto: ["Recto", "Recto", "digest", "#C58676", "organo", "colon"],
  higado: ["Hígado", "Hígado", "digest", "#8B4636", "organo", "higado"],
  vesicula: ["Vesícula biliar", "Vesícula", "digest", "#5F9150", "organo", "vesicula"],
  pancreas: ["Páncreas", "Páncreas", "digest", "#E6C67E", "organo", "pancreas"],
  bazo: ["Bazo", "Bazo", "digest", "#7B3A55", "organo", "bazo"],

  "rinon-der": ["Riñón derecho", "Riñón der.", "uro", "#9A4A43", "organo", "rinones"],
  "rinon-izq": ["Riñón izquierdo", "Riñón izq.", "uro", "#9A4A43", "organo", "rinones"],
  suprarrenales: ["Glándulas suprarrenales", "Suprarrenales", "uro", "#E3B24A", "organo", "rinones"],
  ureteres: ["Uréteres", "Uréteres", "uro", "#E8D48E", "organo", "rinones"],
  vejiga: ["Vejiga", "Vejiga", "uro", "#E9CB72", "organo", "vejiga"],
  prostata: ["Próstata, uretra y vesículas seminales", "Próstata", "uro", "#C99D8C", "organo", "prostata"],
  genitales: ["Testículos, epidídimo y pene", "Genitales", "uro", "#D7AB98", "organo", "genitales"],

  "lob-frontal": ["Lóbulo frontal", "Frontal", "neuro", "#E9B9A7", "nervio", "frontal"],
  "giro-precentral": ["Giro precentral (motora primaria)", "Precentral", "neuro", "#E0786B", "nervio", "motora"],
  "giro-poscentral": ["Giro poscentral (somatosensorial)", "Poscentral", "neuro", "#6FA0DB", "nervio", "motora"],
  "lob-parietal": ["Lóbulo parietal", "Parietal", "neuro", "#EBCB8E", "nervio", "parietal"],
  "lob-temporal": ["Lóbulo temporal", "Temporal", "neuro", "#A6CE98", "nervio", "temporal"],
  "lob-occipital": ["Lóbulo occipital", "Occipital", "neuro", "#C3A1DB", "nervio", "occipital"],
  insula: ["Ínsula y giro del cíngulo", "Ínsula", "neuro", "#E3A2B7", "nervio", "temporal"],
  "sust-blanca": ["Sustancia blanca y cuerpo calloso", "Sust. blanca", "neuro", "#F1EADB", "nervio", "capsula"],
  "capsula-interna": ["Cápsula interna", "Cápsula int.", "neuro", "#F3E3A6", "nervio", "capsula"],
  "ganglios-basales": ["Ganglios basales", "Gang. basales", "neuro", "#B98968", "nervio", "basales"],
  talamo: ["Tálamo e hipotálamo", "Tálamo", "neuro", "#C9B37B", "nervio", "talamo"],
  hipocampo: ["Hipocampo y amígdala", "Hipocampo", "neuro", "#CC8FB3", "nervio", "temporal"],
  ventriculos: ["Sistema ventricular", "Ventrículos", "neuro", "#7CC6DB", "nervio", "ventriculos"],
  cerebelo: ["Cerebelo", "Cerebelo", "neuro", "#DBA78D", "nervio", "cerebelo"],
  tronco: ["Tronco encefálico", "Tronco", "neuro", "#D8C29E", "nervio", "tronco"],
  hipofisis: ["Hipófisis", "Hipófisis", "neuro", "#E58B58", "nervio", "hipofisis"],
  "via-optica": ["Vía óptica", "Vía óptica", "neuro", "#F0D36A", "nervio", "optica"],
  ojos: ["Globos oculares", "Ojos", "neuro", "#F2EEE4", "organo", "optica"],
};

const rgb = (hex) => [1, 3, 5].map((i) => +(parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));

export const STRUCTS = Object.fromEntries(
  Object.entries(T).map(([id, [name, short, sys, colour, mat, card]]) => [id, { name, short, sys, color: rgb(colour), hex: colour, mat, card }]),
);
