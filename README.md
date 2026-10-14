# Cuerpo ENARM

Atlas 3D del cuerpo humano para estudiar el ENARM desde el teléfono: se explora con los dedos, muestra cómo funcionan los procesos y trae un simulador de casos clínicos.

El cuerpo está sobre un pedestal giratorio dibujado con la skill [anatomy](https://github.com/wheresryan22/anatomy); a su lado, una regla cuyo cursor marca el nivel vertebral de lo que selecciones. El modelo son 92 estructuras reales (esqueleto, órganos, vasos y encéfalo) procesadas con Blender y dibujadas con shaders WebGL propios, en la misma cámara isométrica que el pedestal.

## Modos

- **Explorar.** Gira, acerca y toca. La estructura se ilumina y lo que la tapa se corta para dejarla ver. Su ficha trae anatomía, correlación clínica de alto rendimiento, una perla y preguntas. Hay capas (piel, esqueleto, órganos, vasos, encéfalo), búsqueda, vista separada por piezas y tema claro u oscuro.
- **Procesos.** Seis recorridos paso a paso sobre el cuerpo: ciclo cardiaco (en cámara lenta, con el diagrama de Wiggers sincronizado al latido), conducción eléctrica, circulación, respiración, digestión y formación de orina. Además, ocho ritmos en el monitor.
- **Casos.** Doce pacientes simulados. El monitor y el cuerpo reaccionan a la enfermedad y a cada decisión, y un cuadro «Qué está pasando» muestra la fisiopatología sobre el modelo: la coronaria ocluida, el pulmón colapsado, el territorio del infarto cerebral.
- **Repaso.** Preguntas tipo examen con explicación (se ilumina el órgano al responder) y «Localiza», donde hay que encontrar la estructura en el cuerpo.

El corazón late, los pulmones respiran y el pulso recorre las arterias con el mismo modelo que dibuja el electrocardiograma: si cambias el ritmo, cambia todo.

## Usarla en el iPhone

1. Abre la página de GitHub Pages en Safari.
2. Toca Compartir → **Agregar a pantalla de inicio**.
3. Se abre a pantalla completa y, después de la primera carga, funciona sin conexión.

## Construir

Requiere Node 20 o posterior. La página se arma con:

```sh
node src/build.mjs          # escribe docs/index.html y docs/sw.js
node tools/serve.mjs        # la sirve en http://127.0.0.1:8787/ para probar
```

El modelo 3D (`docs/body.bin.gz` y `src/body.json`) ya está en el repositorio. Para regenerarlo hace falta [Blender](https://www.blender.org/) 4.x:

```sh
node tools/fetch.mjs        # descarga las mallas de BodyParts3D a .cache/ (353 MB)
blender --background --factory-startup --python tools/build_model.py
```

`tools/build_model.py` reduce cada malla con el modificador Decimate, hornea por vértice la oclusión ambiental y una coordenada de flujo (milímetros a lo largo de cada vaso, vía aérea o tramo del tubo digestivo desde donde entra su contenido) y empaqueta todo en 2.5 MB. Con esa coordenada los shaders mueven el pulso, la peristalsis y el corte de flujo de una arteria ocluida.

## Dónde está cada cosa

| Ruta | Contenido |
|---|---|
| `src/content/` | Fichas, procesos, casos y el catálogo de estructuras. Aquí se agrega o corrige material de estudio. |
| `src/app/body.js` | El renderer WebGL2 y sus shaders. |
| `src/app/physio.js` | El modelo que mueve el trazo, los signos vitales y el cuerpo. |
| `src/app/stage.js` | Capas, selección, cámara, gestos y escenas. |
| `src/pedestal.mjs` | El pedestal y la regla, dibujados con el kit de la skill. |
| `tools/` | Descarga de mallas, script de Blender y servidor de pruebas. |
| `src/legacy/` | La maqueta isométrica del torso (primera versión), publicada en `docs/torso.html`. |

La construcción revisa que cada estructura, pieza y ancla nombrada en un proceso o un caso exista en el modelo.

## Límites

- El modelo es un cuerpo masculino adulto: no incluye útero, ovarios ni mama, ni músculos o nervios periféricos.
- Las deformaciones (latido, respiración, colapso pulmonar) son ilustrativas, no simulaciones físicas.
- Es material de estudio. Las conductas siguen las guías de práctica clínica y los cursos ATLS y ACLS; confirma dosis y tiempos con la versión vigente.

## Créditos y licencias

- Modelo anatómico: **BodyParts3D, © The Database Center for Life Science, licencia CC Attribution-Share Alike 2.1 Japan**. Las mallas se tomaron del espejo [Kevin-Mattheus-Moerman/BodyParts3D](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D). `docs/body.bin.gz` y `src/body.json` son una obra derivada y se distribuyen bajo esa misma licencia.
- Dibujo isométrico: kit de la skill [anatomy](https://github.com/wheresryan22/anatomy) (MIT), incluido en `vendor/anatomy-kit`.
