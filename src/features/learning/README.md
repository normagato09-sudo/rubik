# learning

Aprender como guía visual: el usuario lee la app y reproduce los movimientos
en su cubo físico. Aquí no hay cubo 3D, animaciones, timer, scramble ni
`TrainingAttempt`.

- `categories.ts` — bloques de la pantalla "Aprender a resolver": Notación,
  Pasos de aprendizaje, F2L, OLL y PLL. Cada uno tiene contenido real de
  `docs/source` y muestra su progreso X/Y. Un método nuevo solo se añade cuando tiene su fuente.
- `algorithm-sets.ts` — tipo común de los casos con algoritmo (Cruz,
  Esquinas, F2L, OLL, PLL), pasos, anterior/siguiente y búsqueda. `sets.ts`
  los registra.
- Pasos de aprendizaje — `LEARNING_STEPS` en `sets.ts`, en orden: 1 Cruz
  (`cruz-cases.ts`, 5 casos de `docs/source/cruz.docx`) y 2 Esquinas
  (`esquinas-cases.ts`, 4 casos de `docs/source/esquinas.docx`). Para añadir
  un paso: su fuente en docs/source, un `<paso>-cases.ts` con
  `buildCases()`, registrarlo en `ALGORITHM_SETS` y una línea en
  `LEARNING_STEPS`. Sus diagramas traen fondo claro propio y se guardan en
  un lienzo de 128×128.
- `f2l-cases.ts` — los 24 casos de `docs/source/F2L_Complet.pdf` (página 1,
  orden de lectura). Diagramas recortados del raster de esa misma página.
- `oll-cases.ts` — los 57 casos de `docs/source/oll.docx`, en el orden de
  su tabla. Rarezas de la fuente que se mantienen: 26 y 27 tienen el mismo
  algoritmo; 53 y 54, el mismo diagrama.
- `pll-cases.ts` — los 21 casos de `docs/source/pll.docx`, con su nombre
  (Ua, T, Gc...). Rb conserva el espacio de `U2 '` tal como está escrito.
- Fuente de verdad: los algoritmos no se corrigen ni se sustituyen. Solo se
  normaliza el apóstrofo tipográfico (’ → ') y algún espacio doble. Los
  tests comparan F2L con el texto del PDF, y Cruz, Esquinas, OLL y PLL fila
  a fila con el XML de sus .docx.
- Diagramas en `public/learning/<conjunto>/<conjunto>-NN.png`, uno por caso.
- `notation.ts` — los 12 diagramas de `docs/source/notacion.docx` (D, U, L,
  R, F, B, M, E, S, z, y, x; cada uno con su giro inverso), en el orden del
  documento. El documento solo contiene imágenes: la etiqueta de cada capa
  ("Cara inferior (Down)"...) es la notación estándar WCA, no texto de la
  fuente. Diagramas en `public/learning/notation/notation-<giro>.png`, con
  las líneas pasadas de negro a blanco para el fondo oscuro. `WIDE_MOVES`:
  movimientos en minúscula (f, r, l, b, u, d), que giran 2 capas y se
  muestran como "r (2x)"; x, y, z no entran (giran todo el cubo). No tienen
  diagrama en la fuente, así que no cuentan en el progreso X/12.
- `algorithm.ts` — `splitAlgorithm()`: un paso por movimiento, tal cual. Un
  `'` suelto (`U2 '`) se une al movimiento anterior.
- `progress-store.ts` — lo aprendido (Zustand + localStorage, clave
  `rubiko-learning-progress`; ids `f2l-07`, `oll-12`, `pll-08`,
  `notation-r`), separado de solves/History/TrainingAttempts. Se carga tras
  el montaje (`use-progress-hydration.ts`) para no mostrar números falsos
  durante la hidratación.

Rutas: `/entrenar` (pantalla Aprender, `?abierto=<categoría>` la deja
abierta) y `/entrenar/<cruz|esquinas|f2l|oll|pll>/<NN>` (detalle de un caso).
`/entrenar/cross` sigue siendo el entrenador antiguo de Cross.
