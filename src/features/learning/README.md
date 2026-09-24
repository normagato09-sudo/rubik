# learning

Aprender como guía visual: el usuario lee la app y reproduce los movimientos
en su cubo físico. Aquí no hay cubo 3D, animaciones, timer, scramble ni
`TrainingAttempt`.

- `categories.ts` — bloques de la pantalla "Aprender a resolver": Notación,
  F2L, OLL y PLL. Cada uno tiene contenido real de `docs/source` y muestra
  su progreso X/Y. Un método nuevo solo se añade cuando tiene su fuente.
- `algorithm-sets.ts` — tipo común de los casos con algoritmo (F2L, OLL,
  PLL), pasos, anterior/siguiente y búsqueda. `sets.ts` los registra.
- `f2l-cases.ts` — los 24 casos de `docs/source/F2L_Complet.pdf` (página 1,
  orden de lectura). Diagramas recortados del raster de esa misma página.
- `oll-cases.ts` — los 57 casos de `docs/source/oll.docx`, en el orden de
  su tabla. Rarezas de la fuente que se mantienen: 26 y 27 tienen el mismo
  algoritmo; 53 y 54, el mismo diagrama.
- `pll-cases.ts` — los 21 casos de `docs/source/pll.docx`, con su nombre
  (Ua, T, Gc...). Rb conserva el espacio de `U2 '` tal como está escrito.
- Fuente de verdad: los algoritmos no se corrigen ni se sustituyen. Solo se
  normaliza el apóstrofo tipográfico (’ → ') en F2L. Los tests comparan
  F2L con el texto del PDF, y OLL/PLL fila a fila con el XML de sus .docx.
- Diagramas en `public/learning/<f2l|oll|pll>/<conjunto>-NN.png`, uno por
  caso.
- `notation.ts` — los 12 diagramas de `docs/source/notacion.docx` (D, U, L,
  R, F, B, M, E, S, z, y, x; cada uno con su giro inverso), en el orden del
  documento. El documento solo contiene imágenes: la etiqueta de cada capa
  ("Cara inferior (Down)"...) es la notación estándar WCA, no texto de la
  fuente. Diagramas en `public/learning/notation/notation-<giro>.png`, con
  las líneas pasadas de negro a blanco para el fondo oscuro.
- `algorithm.ts` — `splitAlgorithm()`: un paso por movimiento, tal cual. Un
  `'` suelto (`U2 '`) se une al movimiento anterior.
- `progress-store.ts` — lo aprendido (Zustand + localStorage, clave
  `rubiko-learning-progress`; ids `f2l-07`, `oll-12`, `pll-08`,
  `notation-r`), separado de solves/History/TrainingAttempts. Se carga tras
  el montaje (`use-progress-hydration.ts`) para no mostrar números falsos
  durante la hidratación.

Rutas: `/entrenar` (pantalla Aprender, `?abierto=<categoría>` la deja
abierta) y `/entrenar/<f2l|oll|pll>/<NN>` (detalle de un caso).
`/entrenar/cross` sigue siendo el entrenador antiguo de Cross.
