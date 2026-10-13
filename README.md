# Torso ENARM

Atlas anatómico interactivo del torso para estudiar el ENARM desde el teléfono.

Es un modelo isométrico de un torso de aula sobre su pedestal: columna con niveles vertebrales reales, costillas (sin el plastrón condroesternal), pulmones con sus fisuras, corazón con coronarias y grandes vasos, diafragma, vísceras abdominales, retroperitoneo y pelvis. Arterias en rojo, venas en azul.

- **Atlas**: toca un órgano y se ilumina; lo que lo tapa se vuelve transparente. Debajo aparece su ficha: anatomía, irrigación, inervación, correlación clínica de alto rendimiento y una perla.
- **Repaso**: preguntas tipo ENARM con explicación, filtros por sistema y un modo "Falladas" que recuerda tus errores en el teléfono.
- **Ritmos**: el monitor de ECG (dibujado con un shader WebGL) cambia entre ritmo sinusal, taquicardia, bradicardia, FA, flutter, BAV de tercer grado, TV y FV. El corazón late y los pulmones respiran con el ritmo elegido.

## Usarla en el iPhone

1. Abre la página de GitHub Pages en Safari.
2. Toca Compartir → **Agregar a pantalla de inicio**.
3. Se abre como app y funciona sin conexión.

## Construir

Requiere Node 20+.

```sh
node src/build.mjs          # genera docs/index.html (ordena por profundidad: ~3 min)
node src/build.mjs --fast   # vista rápida sin ordenar
```

La geometría está en `src/torso.mjs`, las fichas y preguntas en `src/content.mjs`, la app en `src/app.js` y `src/app.css`.

El dibujo usa el kit de la skill [anatomy](https://github.com/wheresryan22/anatomy) (MIT), incluido en `vendor/anatomy-kit`.

Material de estudio: verifica siempre con tu bibliografía y las guías vigentes.
