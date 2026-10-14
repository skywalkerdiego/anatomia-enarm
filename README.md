# Cuerpo ENARM

Atlas 3D del cuerpo humano para estudiar el ENARM desde el teléfono: se explora con los dedos, muestra cómo funcionan los procesos y trae un simulador de casos clínicos.

Hay dos cuerpos completos, **mujer** y **hombre**, con unas 145 estructuras cada uno y unos dos millones de triángulos:
- esqueleto y músculos;
- órganos y encéfalo;
- arterias y venas de todo el cuerpo;
- nervios craneales y periféricos;
- ganglios linfáticos y glándulas.

El cuerpo femenino tiene además útero, cuello uterino, vagina, trompas con fimbrias, ovarios, ligamentos, vasos uterinos y ováricos, y glándulas mamarias.

Se dibujan con un motor WebGL2 propio:
- materiales físicos (PBR) y luz que atraviesa los tejidos delgados;
- sombras, oclusión ambiental, resplandor y corrección de color de cine;
- una plataforma giratoria de estudio.

## Modos

- **Explorar.** Gira (arrastra a los lados), inclina (arriba y abajo), acerca (pellizca) y toca. La estructura se ilumina y lo que la tapa se corta para dejarla ver. Su ficha trae anatomía, correlación clínica de alto rendimiento, una perla y preguntas. Hay capas (piel, músculo, hueso, órganos, vasos, nervios), búsqueda, vista separada por piezas, tema claro u oscuro y el cambio entre mujer y hombre.
- **Procesos.** Siete recorridos paso a paso sobre el cuerpo: ciclo cardiaco (en cámara lenta, con el diagrama de Wiggers sincronizado al latido), conducción eléctrica, circulación, respiración, digestión, formación de orina y ciclo menstrual. Además, ocho ritmos en el monitor.
- **Casos.** Catorce pacientes simulados, dos de ellos ginecológicos (embarazo ectópico roto y torsión anexial). El monitor y el cuerpo reaccionan a la enfermedad y a cada decisión, y un cuadro «Qué está pasando» muestra la fisiopatología sobre el modelo.
- **Repaso.** Preguntas tipo examen con explicación (se ilumina el órgano al responder) y «Localiza», donde hay que encontrar la estructura en el cuerpo.

El cuerpo se mueve con un mismo modelo fisiológico:
- el corazón late;
- los pulmones, el diafragma y la piel respiran;
- el pulso recorre las arterias;
- hay peristalsis en el tubo digestivo;
- los impulsos corren por los nervios.

Ese modelo también dibuja el electrocardiograma: si cambias el ritmo, cambia todo.

## Usarla en el iPhone

1. Abre la página de GitHub Pages en Safari.
2. Toca Compartir → **Agregar a pantalla de inicio**.
3. Se abre a pantalla completa y, después de la primera carga, funciona sin conexión. Cada cuerpo pesa unos 9.5 MB y solo se descarga el que eliges.

## Construir

Requiere Node 20 o posterior (`npm install` instala meshoptimizer). La página se arma con:

```sh
node src/build.mjs          # escribe docs/index.html y docs/sw.js
node tools/serve.mjs        # la sirve en http://127.0.0.1:8787/ para probar
```

Los modelos (`docs/models/*.bin.gz` y `src/models/*.json`) ya están en el repositorio. Para regenerarlos hace falta [Blender](https://www.blender.org/) 4.5:

```sh
node tools/fetch.mjs                                        # mallas de BodyParts3D (incluye músculos) → .cache/
blender -b <Z-Anatomy>/Startup.blend --python tools/za_export.py -- .cache/za   # vasos, nervios, ganglios y glándulas
blender --background --python tools/za_align.py            # ajusta Z-Anatomy al marco de BodyParts3D
blender --background --factory-startup --python tools/build_model.py -- --ao 12
node tools/pack.mjs                                         # meshoptimizer + gzip
```

`tools/build_model.py`:
- reduce cada malla con el modificador Decimate;
- arma el cuerpo femenino: deforma las proporciones del masculino y modela los órganos con `tools/female.py`;
- hornea por vértice la oclusión ambiental, el grosor del tejido (para la luz que lo atraviesa), el eje de las fibras musculares y una coordenada de flujo (milímetros a lo largo de cada vaso, nervio, vía aérea o tramo del tubo digestivo).

Con el flujo, los shaders mueven el pulso, los impulsos, la peristalsis y el corte de una arteria ocluida.

`tools/female_preview.py` renderiza solo los órganos femeninos con Cycles, para revisarlos en un minuto.

## Dónde está cada cosa

| Ruta | Contenido |
|---|---|
| `src/content/` | Fichas, procesos, casos y el catálogo de estructuras. Aquí se agrega o corrige material de estudio. |
| `src/app/body.js` | El motor WebGL2 y sus shaders. |
| `src/app/physio.js` | El modelo que mueve el trazo, los signos vitales y el cuerpo. |
| `src/app/stage.js` | Capas, selección, cámara, gestos y escenas. |
| `tools/` | Descarga de mallas, scripts de Blender, empaquetador y servidor de pruebas. |
| `src/legacy/` | La maqueta isométrica del torso (primera versión), publicada en `docs/torso.html`. |

La construcción revisa que cada estructura, pieza y ancla nombrada en un proceso o un caso exista en el cuerpo que le corresponde.

## Límites

- El cuerpo femenino parte del masculino. No hay un modelo femenino abierto compatible, así que se ajustaron las proporciones y se modelaron los órganos con medidas de referencia. Es fiel en forma y relaciones, no es una segmentación de una persona real.
- Las deformaciones (latido, respiración, colapso pulmonar) son ilustrativas, no simulaciones físicas.
- Es material de estudio. Las conductas siguen las guías de práctica clínica y los cursos ATLS y ACLS; confirma dosis y tiempos con la versión vigente.

## Créditos y licencias

- **BodyParts3D**, © The Database Center for Life Science, licencia CC Attribution-Share Alike 2.1 Japan. Las mallas se tomaron del espejo [Kevin-Mattheus-Moerman/BodyParts3D](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D).
- **Z-Anatomy** ([z-anatomy.com](https://www.z-anatomy.com/)), licencia CC BY-SA 4.0: vasos, nervios, ganglios linfáticos y glándulas.
- Los modelos derivados (`docs/models/` y `src/models/`) se distribuyen bajo CC BY-SA 4.0.
- [meshoptimizer](https://github.com/zeux/meshoptimizer) (MIT) comprime las mallas.
- Kit de dibujo de la skill [anatomy](https://github.com/wheresryan22/anatomy) (MIT), incluido en `vendor/anatomy-kit`.
