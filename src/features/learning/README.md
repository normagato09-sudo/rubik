# learning

Aprender como guía visual: el usuario lee la app y reproduce los movimientos
en su cubo físico. Aquí no hay cubo 3D, animaciones, timer, scramble ni
`TrainingAttempt`.

- `categories.ts` — bloques de la pantalla "Aprender a resolver" de cada
  método (`METHOD_CATEGORIES`):
  - CFOP (3×3): Notación, Pasos de aprendizaje, F2L, OLL y PLL.
  - Ortega (2×2): Notación 2×2, Pasos (Primera cara), OLL y PBL.
  - CLL (2×2): Notación 2×2, Pasos (Primera capa) y CLL.
  - Por capas (Pyraminx): Notación del Pyraminx, Pasos (Puntas, Centros,
    Primera capa) y Última capa.
  - L4E (Pyraminx): Notación del Pyraminx, Pasos (Puntas, V) y L4E.

  Cada bloque tiene contenido real de `docs/source` y muestra su progreso
  X/Y. Un método nuevo solo se añade cuando tiene su fuente. `learnHref()`
  da la dirección de cada método: el 3×3 sigue en `/entrenar`.
- `algorithm-sets.ts` — tipo común de los casos con algoritmo (Cruz,
  Esquinas, F2L, OLL, PLL), pasos, anterior/siguiente y búsqueda. `sets.ts`
  los registra.
- Pasos de aprendizaje — `METHOD_STEPS` en `sets.ts` (`LEARNING_STEPS` es el
  del 3×3), en orden: 1 Cruz
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
- Fuente de verdad (3×3): los algoritmos no se corrigen ni se sustituyen. Solo se
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
- `cases-2x2.ts` — los casos del 2×2, con una explicación corta de cómo
  reconocer cada uno:
  - OLL (7) y PBL (5) de Ortega, y CLL (42).
  - Los algoritmos son los de `features/solver2x2/algorithms.ts`, es decir,
    los de `docs/source/Ortega.docx` y `CLL.docx`, con las 4 filas mal de
    Ortega corregidas y los 2 casos de CLL que faltaban.
  - Cada caso que no usa el algoritmo de la hoja lo dice en la ficha
    (`note`), citando lo que ponía la hoja.
  - Paso 1 (Primera cara / Primera capa): la explicación del paso y 3 casos
    básicos de colocar una esquina (`R U R'`, `F' U' F`,
    `R U2 R' U' R U R'`), marcados como añadidos porque las hojas no los
    traen.
- Diagramas del 2×2:
  - Los de las hojas, fila a fila, en `public/learning/<ortega-oll|ortega-pbl|cll>/`.
  - Los que faltan (Paso 1, CLL 41–42 y el giro B) los dibuja
    `diagrams-2x2.ts` a partir del propio caso, con el motor 3D, así que el
    dibujo no puede contradecir al algoritmo.
  - `generated-diagrams-2x2.ts` los junta. Su test comprueba que los .svg de
    `public/` siguen iguales; `WRITE_DIAGRAMS=1 npx vitest run generated-diagrams`
    los reescribe.
- `notation.ts` (2×2) — `NOTATION_MOVES_2X2`:
  - U, D, R, L y F son los diagramas de `docs/source/Notacion 2x2.docx`, con
    las letras pasadas a blanco.
  - B está dibujado con el mismo estilo que F.
  - x e y usan los diagramas del 3×3, porque dos casos de CLL los usan.
  - Sin capas del medio ni minúsculas.
  - Ids `notation-2x2-*`: el progreso va aparte del 3×3.
- `cases-pyraminx.ts` — los casos del Pyraminx, con una explicación corta
  sacada de las pegatinas de cada caso:
  - Última capa de Por capas (5) y L4E (30): los algoritmos de
    `features/pyraminx/algorithms.ts`, es decir, los de
    `docs/source/Pyraminx Por capas - ultima capa.docx` y
    `Pyraminx L4E - ultimas 4 aristas.docx`, con la fila 5 de Por capas
    corregida (la ficha lo dice en `note`, citando la hoja). Sus diagramas
    son los de las hojas, en `public/learning/<pyra-ultima-capa|l4e>/`.
  - Pasos que las hojas no traen (Puntas, Centros, Primera capa, V): casos
    básicos añadidos a propósito, dibujados a partir del propio caso por
    `features/pyraminx/diagrams.ts` con el estilo de las hojas.
  - Los tests comprueban cada algoritmo con el motor del Pyraminx contra su
    diagrama.
- `notation.ts` (Pyraminx) — `NOTATION_MOVES_PYRAMINX`: los diagramas de
  `docs/source/Notacion Pyraminx.docx`, en `public/learning/notation-pyraminx/`.
- `algorithm.ts` — `splitAlgorithm()`: un paso por movimiento, tal cual. Un
  `'` suelto (`U2 '`) se une al movimiento anterior.
- `progress-store.ts` — lo aprendido (Zustand + localStorage, clave
  `rubiko-learning-progress`; ids `f2l-07`, `oll-12`, `pll-08`,
  `notation-r`), separado de solves/History/TrainingAttempts. Se carga tras
  el montaje (`use-progress-hydration.ts`) para no mostrar números falsos
  durante la hidratación.

Rutas:
- `/entrenar` — pantalla Aprender. `?metodo=ortega|cll` muestra el 2×2,
  `?metodo=por-capas|l4e` el Pyraminx y `?abierto=<categoría>` deja ese
  bloque abierto.
- `/entrenar/<conjunto>/<NN>` — detalle de un caso. Conjuntos: `cruz`,
  `esquinas`, `f2l`, `oll`, `pll`, `primera-cara`, `primera-capa`,
  `ortega-oll`, `ortega-pbl`, `cll`, `pyra-puntas`, `pyra-centros`,
  `pyra-primera-capa`, `pyra-ultima-capa`, `l4e-puntas`, `l4e-v` y `l4e`.
`/entrenar/cross` sigue siendo el entrenador antiguo de Cross.
