// Which BodyParts3D meshes make up each structure of the 3D body.
// A source is an exact English part name or a RegExp over part names.
// `tris` is the triangle budget after Blender decimates the joined mesh.

const side = "(left|right)";
const ord = "(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)";
const re = (s) => new RegExp(`^${s}$`);

export const LAYERS = ["piel", "musculo", "hueso", "organo", "vaso", "nervio"];

export const STRUCTS = [
  // ── skin ──────────────────────────────────────────────────────────────
  { id: "piel", layer: "piel", tris: 72000, src: ["skin"] },

  // ── skeleton ──────────────────────────────────────────────────────────
  {
    id: "craneo", layer: "hueso", tris: 36000,
    src: ["frontal bone", "occipital bone", "sphenoid bone", "ethmoid", "vomer", re(`${side} (parietal|temporal|zygomatic|nasal|lacrimal|palatine) bone`), re(`${side} maxilla`), re(`${side} inferior nasal concha`), re(`${side} upper .* tooth`)],
  },
  { id: "mandibula", layer: "hueso", tris: 12000, src: ["mandible", re(`${side} lower .* tooth`)] },
  { id: "laringe", layer: "hueso", tris: 5300, src: ["thyroid cartilage", "hyoid bone"] },
  { id: "col-cervical", layer: "hueso", tris: 19200, src: ["atlas", "axis", re(`${ord} cervical vertebra`)] },
  { id: "col-toracica", layer: "hueso", tris: 28800, src: [re(`${ord} thoracic vertebra`)] },
  { id: "col-lumbar", layer: "hueso", tris: 19200, src: [re(`${ord} lumbar vertebra`)] },
  { id: "discos", layer: "hueso", tris: 10800, src: [/^intervertebral disk of /] },
  { id: "sacro", layer: "hueso", tris: 9600, src: ["sacrum"] },
  { id: "costillas", layer: "hueso", tris: 40800, src: [re(`${side} ${ord} rib`)] },
  { id: "cartilagos", layer: "hueso", tris: 8600, src: [re(`${side} costal cartilage`)] },
  { id: "esternon", layer: "hueso", tris: 6700, src: ["manubrium", "body of sternum", "xiphoid process"] },
  { id: "claviculas", layer: "hueso", tris: 4300, src: [re(`${side} clavicle`)] },
  { id: "escapulas", layer: "hueso", tris: 12000, src: [re(`${side} scapula`)] },
  { id: "humeros", layer: "hueso", tris: 8600, src: [re(`${side} humerus`)] },
  { id: "radios", layer: "hueso", tris: 4800, src: [re(`${side} radius`)] },
  { id: "cubitos", layer: "hueso", tris: 5300, src: [re(`${side} ulna`)] },
  {
    id: "manos", layer: "hueso", tris: 16800,
    src: [re(`${side} (scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)`), re(`${side} ${ord} metacarpal bone`), re(`(proximal|middle|distal) phalanx of ${side} (thumb|\\w+ finger)`)],
  },
  { id: "pelvis", layer: "hueso", tris: 19200, src: [re(`${side} hip bone`)] },
  { id: "femures", layer: "hueso", tris: 11000, src: [re(`${side} femur`)] },
  { id: "rotulas", layer: "hueso", tris: 1700, src: [re(`${side} patella`)] },
  { id: "tibias", layer: "hueso", tris: 8600, src: [re(`${side} tibia`)] },
  { id: "perones", layer: "hueso", tris: 4300, src: [re(`${side} fibula`)] },
  {
    id: "pies", layer: "hueso", tris: 16800,
    src: [re(`${side} (talus|calcaneus|cuboid bone|(medial|intermediate|lateral) cuneiform bone)`), /^navicular bone of /, re(`${side} ${ord} metatarsal bone`), re(`(proximal|middle|distal) phalanx of ${side} (big|second|third|fourth|little) toe`), /^sesamoid bone of /],
  },

  // ── heart ─────────────────────────────────────────────────────────────
  { id: "corazon", layer: "organo", tris: 33600, src: ["wall of heart"] },
  { id: "valvulas", layer: "organo", tris: 5800, src: ["mitral valve", "tricuspid valve", "pulmonary valve"] },
  { id: "cor-izq", layer: "vaso", kind: "art", tris: 1200, src: ["stem of left coronary artery"] },
  { id: "cor-da", layer: "vaso", kind: "art", tris: 3800, src: ["anterior interventricular branch of left coronary artery, nsn", "set of interventricular septal branches of left coronary artery"] },
  { id: "cor-cx", layer: "vaso", kind: "art", tris: 3100, src: ["circumflex branch of left coronary artery"] },
  {
    id: "cor-der", layer: "vaso", kind: "art", tris: 5800,
    src: ["trunk of right coronary artery", "marginal branch of right coronary artery", "posterior interventricular branch of right coronary artery, nsn", "right posterolateral branch of right coronary artery", "set of interventricular septal branches of right coronary artery"],
  },
  { id: "venas-cardiacas", layer: "vaso", kind: "ven", tris: 5300, src: ["great cardiac vein", "middle cardiac vein", "coronary sinus", "set of anterior cardiac veins", "set of posterior veins of left ventricle"] },

  // ── arteries ──────────────────────────────────────────────────────────
  { id: "aorta", layer: "vaso", kind: "art", tris: 12500, src: ["ascending aorta", "arch of aorta", "descending aorta"] },
  { id: "carotidas", layer: "vaso", kind: "art", tris: 3400, src: [re(`${side} common carotid artery`)] },
  { id: "subclavias", layer: "vaso", kind: "art", tris: 3600, src: ["brachiocephalic artery, nsn", re(`${side} subclavian artery`)] },
  { id: "tronco-celiaco", layer: "vaso", kind: "art", tris: 3100, src: ["celiac artery", "common hepatic artery", "splenic artery", "left gastric artery"] },
  { id: "mesentericas", layer: "vaso", kind: "art", tris: 1900, src: ["superior mesenteric artery", "inferior mesenteric artery"] },
  { id: "art-renales", layer: "vaso", kind: "art", tris: 1900, src: [re(`${side} renal artery`)] },
  { id: "art-iliacas", layer: "vaso", kind: "art", tris: 3800, src: [re(`${side} (common|external|internal) iliac artery`)] },
  { id: "art-pulmonar", layer: "vaso", kind: "ven", tris: 15600, src: ["pulmonary artery"] },

  // ── veins ─────────────────────────────────────────────────────────────
  { id: "vcs", layer: "vaso", kind: "ven", tris: 3600, src: ["superior vena cava", re(`${side} brachiocephalic vein`)] },
  { id: "vci", layer: "vaso", kind: "ven", tris: 5300, src: ["inferior vena cava"] },
  { id: "yugulares", layer: "vaso", kind: "ven", tris: 2600, src: [re(`${side} internal jugular vein`), re(`${side} subclavian vein`)] },
  { id: "ven-renales", layer: "vaso", kind: "ven", tris: 1700, src: [re(`${side} renal vein`)] },
  { id: "ven-iliacas", layer: "vaso", kind: "ven", tris: 3100, src: [re(`${side} (common|external|internal) iliac vein`)] },
  { id: "porta", layer: "vaso", kind: "ven", tris: 1700, src: ["splenic vein", "superior mesenteric vein"] },
  { id: "ven-pulmonares", layer: "vaso", kind: "art", tris: 10800, src: ["pulmonary vein"] },

  // ── airway and lungs ──────────────────────────────────────────────────
  { id: "traquea", layer: "organo", tris: 5300, src: ["trachea"] },
  { id: "bronquios", layer: "organo", tris: 21600, src: ["bronchus"] },
  { id: "pulmon-der-sup", layer: "organo", tris: 10100, src: ["upper lobe of right lung"] },
  { id: "pulmon-der-med", layer: "organo", tris: 7200, src: ["middle lobe of lung"] },
  { id: "pulmon-der-inf", layer: "organo", tris: 11500, src: ["lower lobe of right lung"] },
  { id: "pulmon-izq-sup", layer: "organo", tris: 11000, src: ["upper lobe of left lung"] },
  { id: "pulmon-izq-inf", layer: "organo", tris: 11000, src: ["lower lobe of left lung"] },
  { id: "diafragma", layer: "organo", tris: 14400, src: ["diaphragm"] },
  { id: "timo", layer: "organo", tris: 4300, src: [re(`${side} lobe of thymus`)] },

  // ── digestive ─────────────────────────────────────────────────────────
  { id: "esofago", layer: "organo", tris: 4300, src: ["esophagus"] },
  { id: "estomago", layer: "organo", tris: 12000, src: ["stomach"] },
  { id: "duodeno", layer: "organo", tris: 7200, src: ["duodenum"] },
  { id: "yeyuno", layer: "organo", tris: 19200, src: ["jejunum"] },
  { id: "ileon", layer: "organo", tris: 19200, src: ["ileum"] },
  { id: "colon", layer: "organo", tris: 24000, src: ["colon, nsn"] },
  { id: "apendice", layer: "organo", tris: 1200, src: ["appendix"] },
  { id: "recto", layer: "organo", tris: 4800, src: ["rectum"] },
  { id: "higado", layer: "organo", tris: 19200, src: ["liver"] },
  { id: "vesicula", layer: "organo", tris: 4300, src: ["gallbladder"] },
  { id: "pancreas", layer: "organo", tris: 10100, src: ["pancreas, nsn", "pancreatic duct"] },
  { id: "bazo", layer: "organo", tris: 7200, src: ["spleen"] },

  // ── urinary and genital ───────────────────────────────────────────────
  { id: "rinon-der", layer: "organo", tris: 7700, src: ["right kidney"] },
  { id: "rinon-izq", layer: "organo", tris: 7700, src: ["left kidney"] },
  { id: "suprarrenales", layer: "organo", tris: 3800, src: [re(`${side} adrenal gland`)] },
  { id: "ureteres", layer: "organo", tris: 3400, src: [re(`${side} ureter`)] },
  { id: "vejiga", layer: "organo", tris: 5800, src: ["urinary bladder"] },
  { id: "prostata", layer: "organo", tris: 2900, src: ["prostate", "urethra", re(`${side} seminal vesicle`)] },
  { id: "genitales", layer: "organo", tris: 7200, src: [re(`${side} testis`), re(`${side} epididymis`), re(`${side} deferent duct`), "corpus cavernosum of penis", "corpus spongiosum of penis, nsn", "glans penis"] },

  // ── muscles ───────────────────────────────────────────────────────────
  { id: "m-cabeza", layer: "musculo", tris: 36000, src: [/frontalis$|occipitalis$|temporoparietalis$|^aponeurosis of epicranius$|orbicularis oculi$|^orbicularis oris$|corrugator supercilii$|procerus$|nasalis$|depressor septi nasi$|levator labii superioris|zygomaticus (major|minor)$|risorius$|buccinator$|depressor anguli oris$|depressor labii inferioris$|mentalis$|levator anguli oris$|masseter$|temporalis$|pterygoid$/] },
  { id: "m-cuello", layer: "musculo", tris: 30000, src: [/sternocleidomastoid$|platysma$|scalenus (anterior|medius|posterior)$|digastric$|stylohyoid$|mylohyoid$|geniohyoid$|sternohyoid$|sternothyroid$|thyrohyoid$|omohyoid$|intermediate tendon$|longus colli$|longus capitis$|rectus capitis (anterior|lateralis)$|cervical intertransversarii$/] },
  { id: "m-trapecio", layer: "musculo", tris: 16000, src: [/trapezius$/] },
  { id: "m-espalda", layer: "musculo", tris: 44000, src: [/splenius (capitis|cervicis)$|iliocostalis (cervicis|thoracis|lumborum)$|longissimus (capitis|cervicis|thoracis)$|spinalis (cervicis|thoracis)$|semispinalis (capitis|cervicis|thoracis)$|multifidus$|rotator$|interspinales|intertransversarius muscles$|levatores costarum|obliquus capitis (inferior|superior)$|rectus capitis posterior (major|minor)$|quadratus lumborum$|serratus posterior (superior|inferior)$|rhomboid (major|minor)$|levator scapulae$/] },
  { id: "m-dorsal", layer: "musculo", tris: 16000, src: [/latissimus dorsi$/] },
  { id: "m-pectorales", layer: "musculo", tris: 34000, src: [/pectoralis major$|pectoralis minor$|subclavius$|serratus anterior$/] },
  { id: "m-intercostales", layer: "musculo", tris: 30000, src: [/intercostal muscle$|transversus thoracis$/] },
  { id: "m-abdomen", layer: "musculo", tris: 34000, src: [/rectus abdominis$|external oblique$|internal oblique$|transversus abdominis$|pyramidalis$|^linea alba$|inguinal ligament$/] },
  { id: "m-hombro", layer: "musculo", tris: 30000, src: [/deltoid$|supraspinatus$|infraspinatus muscle$|teres (major|minor)$|subscapularis$/] },
  { id: "m-brazo", layer: "musculo", tris: 30000, src: [/biceps brachii$|brachialis$|coracobrachialis$|triceps brachii$|anconeus$/] },
  { id: "m-antebrazo", layer: "musculo", tris: 44000, src: [/pronator (teres|quadratus)$|supinator$|brachioradialis$|flexor carpi (radialis|ulnaris)$|extensor carpi (radialis longus|radialis brevis|ulnaris)$|palmaris longus$|flexor digitorum (superficialis|profundus)$|flexor pollicis longus$|^(left|right) extensor digitorum$|extensor digiti minimi$|extensor indicis$|extensor pollicis (longus|brevis)$|abductor pollicis longus$|interosseous membrane of (left|right) forearm$|flexor retinaculum of (left|right) wrist$/] },
  { id: "m-mano", layer: "musculo", tris: 18000, src: [/abductor pollicis brevis$|flexor pollicis brevis$|opponens pollicis$|adductor pollicis$|digiti minimi of (left|right) hand$|flexor digiti minimi brevis of (left|right) hand$|lumbricals of (left|right) hand$|interossei of (left|right) hand$/] },
  { id: "m-gluteos", layer: "musculo", tris: 38000, src: [/gluteus (maximus|medius|minimus)$|piriformis$|gemellus (superior|inferior)$|obturator (internus|externus)$|quadratus femoris$|tensor fasciae latae$|iliotibial tract$/] },
  { id: "m-psoas", layer: "musculo", tris: 14000, src: [/psoas major$|iliacus$/] },
  { id: "m-muslo-ant", layer: "musculo", tris: 40000, src: [/rectus femoris$|vastus (lateralis|medialis|intermedius)$|sartorius$|pectineus$/] },
  { id: "m-muslo-med", layer: "musculo", tris: 28000, src: [/adductor (longus|brevis|magnus|minimus)$|gracilis$/] },
  { id: "m-isquios", layer: "musculo", tris: 26000, src: [/biceps femoris$|semitendinosus$|semimembranosus$/] },
  { id: "m-pierna", layer: "musculo", tris: 50000, src: [/tibialis (anterior|posterior)$|extensor digitorum longus$|extensor hallucis longus$|fibularis (longus|brevis|tertius)$|gastrocnemius$|soleus$|plantaris$|popliteus$|flexor digitorum longus$|flexor hallucis longus$|calcaneal tendon$|interosseous membrane of (left|right) leg$/] },
  { id: "m-pie", layer: "musculo", tris: 20000, src: [/extensor digitorum brevis$|extensor hallucis brevis$|abductor hallucis$|flexor digitorum brevis$|digiti minimi of (left|right) foot$|flexor digiti minimi brevis of (left|right) foot$|flexor accessorius$|lumbrical of (left|right) foot$|flexor hallucis brevis$|adductor hallucis$|plantar interosseous of|dorsal interossei of (left|right) foot$|long plantar ligament$/] },
  { id: "m-perine", layer: "musculo", tris: 10000, src: [/puborectalis$|pubococcygeus$|iliococcygeus$|coccygeus$|^external anal sphincter$|^tendinous arch of levator ani$/] },

  // ── nervous system ────────────────────────────────────────────────────
  { id: "lob-frontal", layer: "nervio", tris: 16800, src: [re(`${side} (superior|middle) frontal gyrus`), "orbital gyri straight gyrus"] },
  { id: "giro-precentral", layer: "nervio", tris: 7200, src: [re(`${side} precentral gyrus`)] },
  { id: "giro-poscentral", layer: "nervio", tris: 7200, src: [re(`${side} postcentral gyrus`)] },
  { id: "lob-parietal", layer: "nervio", tris: 12000, src: [re(`${side} superior parietal lobule precuneus`), re(`${side} (supramarginal|angular) gyrus`)] },
  { id: "lob-temporal", layer: "nervio", tris: 16800, src: [re(`(anterior|posterior) part of ${side} superior temporal gyrus`), re(`${side} (middle temporal|inferior temporal|fusiform|parahippocampal) gyrus`)] },
  { id: "lob-occipital", layer: "nervio", tris: 8600, src: [re(`${side} occipital lobe`)] },
  { id: "insula", layer: "nervio", tris: 5800, src: [re(`${side} insula`), re(`${side} accessory short gyrus`), re(`${side} cingulate gyrus`)] },
  { id: "sust-blanca", layer: "nervio", tris: 16800, src: ["white matter structure of cerebral hemisphere", "corpus callosum"] },
  { id: "capsula-interna", layer: "nervio", tris: 3800, src: [re(`anterior limb of ${side} internal capsule`)] },
  { id: "ganglios-basales", layer: "nervio", tris: 7200, src: [re(`${side} (caudate nucleus|putamen|globus pallidus)`)] },
  { id: "talamo", layer: "nervio", tris: 3800, src: [re(`${side} thalamus`), "hypothalamus, nsn", "mammillary body"] },
  { id: "hipocampo", layer: "nervio", tris: 3400, src: [re(`${side} (hippocampus|amygdala)`)] },
  { id: "ventriculos", layer: "nervio", tris: 9600, src: [re(`${side} lateral ventricle`), "third ventricle", "fourth ventricle", "cerebral aqueduct"] },
  { id: "cerebelo", layer: "nervio", tris: 19200, src: ["cerebellum"] },
  { id: "tronco", layer: "nervio", tris: 12000, src: ["midbrain, nsn", "peduncle of midbrain", "pons", "medulla oblongata"] },
  { id: "hipofisis", layer: "nervio", tris: 1200, src: ["pituitary gland"] },
  { id: "via-optica", layer: "nervio", tris: 3600, src: [re(`${side} optic nerve`), "optic chiasm", re(`${side} optic tract`)] },
  { id: "ojos", layer: "nervio", tris: 3400, src: ["eyeball"] },
];

/** Resolve every source to STL ids using the index `[{ id, name, kb }]`. */
export function resolve(index) {
  const used = new Map();
  const out = STRUCTS.map((s) => {
    const files = [];
    for (const src of s.src) {
      const hits = index.filter((e) => (src instanceof RegExp ? src.test(e.name) : e.name === src));
      if (!hits.length) throw new Error(`${s.id}: nothing matches ${src}`);
      for (const h of hits) {
        if (used.has(h.id)) throw new Error(`${h.name} is in both ${used.get(h.id)} and ${s.id}`);
        used.set(h.id, s.id);
        files.push({ id: h.id, name: h.name, kb: h.kb });
      }
    }
    return { id: s.id, layer: s.layer, kind: s.kind ?? "", tris: s.tris, files };
  });
  return out;
}
