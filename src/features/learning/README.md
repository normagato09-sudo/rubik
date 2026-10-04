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
  - Keyhole (Pyraminx): Notación del Pyraminx, Pasos (Puntas, Bloque de
    detrás, Centros, Arista del hueco) y L3E.
  - L4E intuitivo (Pyraminx): Notación del Pyraminx, Pasos (Puntas, V,
    Arista de arriba) y L3E.
  - Oka (Pyraminx): Notación del Pyraminx, Pasos (Puntas, Arista Oka,
    Centros), Cierre del bloque y L3E.
  - 1-Flip (Pyraminx): Notación del Pyraminx, Pasos (Puntas, Bloque de
    detrás, Arista volteada), L3C y L3E.
  - WO (Pyraminx): Notación del Pyraminx, Pasos (Puntas, Bloque de detrás,
    Tercera arista), L3C y L3E.
  - Nutella (Pyraminx): Notación del Pyraminx, Pasos (Puntas, Aristas
    cambiadas), L3C y L3E.
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
- `cases-pyraminx-research.ts` — Keyhole, L4E intuitivo, Oka, 1-Flip, WO y
  Nutella, con
  los algoritmos de `features/pyraminx/research.ts`. Cada caso lleva
  `research` (nombre y enlace de la fuente) y la ficha lo muestra como
  «Investigado». Lo que varios métodos comparten (Puntas, V/bloque, la
  arista del hueco, la tercera arista, L3E) se escribe una vez y se lista
  en cada método. Explicaciones sacadas de las pegatinas de cada caso y
  diagramas dibujados por la app (`WRITE_DIAGRAMS=1 npx vitest run
  cases-pyraminx-research` los reescribe).
  - L3C de 1-Flip y WO: los de Sarah, pasados a la forma de sujetarlo de
    RUBIKO (bloque detrás); la ficha cita el texto original. Se dibujan
    vistos desde el lado en que el bloque está en su sitio, y la
    explicación dice el giro final de B cuando hace falta.
  - Tercera arista (1-Flip y WO): los mismos 7 algoritmos; en 1-Flip la
    arista acaba dada la vuelta a propósito, así que cada caso es otro.
    `researchCaseStates()` da el estado de cada caso y lo que deja su
    algoritmo.
  - Oka: la arista Oka (9) y los centros (los de Keyhole, con la arista
    Oka abajo a la izquierda) dejan el bloque a medias a propósito; el
    cierre del bloque (16, los dos lados) cita la hoja de Drew Brads en sus
    7 casos y dice que el motor calculó los otros 9.
  - Nutella: las aristas cambiadas (7, del motor) y su L3C (los 8 de Drew
    Brads, pasados al bloque detrás; la ficha cita el texto original).
- `cases-3x3-research.ts` — los métodos del 3×3 investigados (Petrus y
  ZZ; Roux está en `cases-roux.ts`). Cada caso lleva `research` y la ficha lo muestra como
  «Investigado».
  - Pasos intuitivos (bloque 2×2×2, bloque 2×2×3, orientación de aristas y
    resto de F2L con R y U): casos básicos, cada uno resuelto con la
    secuencia más corta que encuentra el motor con los giros que permite el
    paso (`STEP_MOVES`). Los tests lo comprueban con `search-3x3.ts`.
  - COLL (42): los 40 de SpeedCubeDB y los 2 con las esquinas ya orientadas
    (la T y la Y de la hoja de PLL). Los tests comprueban que son 42 casos
    distintos y que son todos los que cuenta el motor, y la forma de cada uno.
  - EPLL (4): Ua, Ub, H y Z de la hoja de PLL, con sus diagramas.
  - ZZ: orientación de las 12 aristas, la línea y F2L con L, U y R (el
    bloque de la izquierda es el espejo del de la derecha, que es el último
    paso de Petrus). OCLL (7): los casos 21–27 de la hoja de OLL; el 26 de
    la hoja repite el algoritmo del 27 (Sune), así que se usa el Antisune de
    SpeedCubeDB con el diagrama de la hoja. PLL (21): la de la hoja.
- `cases-2x2-research.ts` — los métodos del 2×2 investigados (EG, LEG y TCLL). La
  primera cara es la de Ortega y la CLL, la del método CLL. EG-1 y EG-2: el
  primer algoritmo de cada uno de los 40 casos de SpeedCubeDB, más los 3
  con el amarillo ya orientado, que salen de las PBL de Ortega (con x2 al
  principio y al final cuando el cambio tiene que ser abajo). `caseFacelets2`
  deshace el algoritmo desde el cubo resuelto sujeto como quede la primera
  cara abajo (algunos terminan con el cubo girado). `corners-2x2.ts` cuenta
  los casos sin importar los giros de U y D de antes y de después: 43 por
  cada capa de abajo, y los tests comprueban que cada set es exactamente
  esos 43. Los diagramas (`layersViewSvg`) son la vista de arriba con las
  dos filas de cada lado, para ver también la capa de abajo.
  LEG-1 (43): los mismos casos que EG-1 con la barra de abajo a la
  izquierda; el algoritmo mejor valorado de speedcube.quest para los 40
  casos y las 3 PBL de EG-1 con un giro de D delante. TCLL+ (43, de Chris
  Olson) y TCLL− (43, de SpeedCubeTrainer): la primera capa con la esquina
  de delante a la derecha girada (`bottomTwist`, `twistedLayerStates` en
  `corners-2x2.ts`); los tests comprueban que cada set es exactamente los
  43 casos que cuenta el motor.
- `cases-roux.ts` — Roux, también investigado. Los dos bloques de 1×2×3
  son pasos intuitivos como los de Petrus (el primero con L, U, F y B; el
  segundo con R, U, M y r, sin tocar el primero). CMLL (42): el primer
  algoritmo de cada caso de SpeedCubeDB; los tests comprueban que no rompen
  los bloques y que son los 42 casos de esquinas que cuenta el motor (con
  `corners-3x3.ts`, compartido con COLL y OCLL). LSE, solo con M y U: cada
  algoritmo es el más corto que encuentra el motor, y los tests comprueban
  que los casos son todos los que hay: 4a, orientación (11); 4b, las
  aristas de izquierda y derecha (7: el motor ve 4 formas, pero en 3 de
  ellas el algoritmo cambia según qué arista está dónde; el último U las
  alinea con las esquinas); 4c, capa M (11, con el amarillo arriba). Los
  diagramas de LSE son el cubo desplegado (`netSvg3`), para ver toda la
  capa M. Las categorías pueden llevar `intro`, que se muestra encima de
  sus casos.
  - `cube3.ts` sujeta el cubo como las hojas (amarillo arriba, verde
    delante) y describe dónde está cada pieza; `diagrams-3x3.ts` dibuja los
    diagramas y `generated-diagrams-3x3.ts` los junta
    (`WRITE_DIAGRAMS=1 npx vitest run generated-diagrams` los reescribe).
- `notation.ts` (Pyraminx, ampliada) — `PYRAMINX_EXTRA_MOVES`: Fw, Lw, Rw,
  Dw y [U], [L], [R], [B], que usan los métodos Top First. Sin diagrama en
  el documento, así que van aparte y no cuentan en el progreso, como las
  minúsculas del 3×3.
- `algorithm.ts` — `splitAlgorithm()`: un paso por movimiento, tal cual. Un
  `'` suelto (`U2 '`) se une al movimiento anterior.
- `progress-store.ts` — lo aprendido (Zustand + localStorage, clave
  `rubiko-learning-progress`; ids `f2l-07`, `oll-12`, `pll-08`,
  `notation-r`), separado de solves/History/TrainingAttempts. Se carga tras
  el montaje (`use-progress-hydration.ts`) para no mostrar números falsos
  durante la hidratación.

Rutas:
- `/entrenar` — pantalla Aprender. `?metodo=petrus|zz|roux` muestra Petrus, ZZ o Roux (3×3), `?metodo=ortega|cll|eg|leg|tcll` el 2×2,
  `?metodo=por-capas|keyhole|l4e-intuitivo|oka|1-flip|wo|nutella|l4e` el Pyraminx y `?abierto=<categoría>` deja ese
  bloque abierto.
- `/entrenar/<conjunto>/<NN>` — detalle de un caso. Conjuntos: `cruz`,
  `esquinas`, `f2l`, `oll`, `pll`, `primera-cara`, `primera-capa`,
  `ortega-oll`, `ortega-pbl`, `cll`, `pyra-puntas`, `pyra-centros`,
  `pyra-primera-capa`, `pyra-ultima-capa`, `l4e-puntas`, `l4e-v`, `l4e`,
  `keyhole-puntas`, `keyhole-bloque`, `keyhole-centros`, `keyhole-arista`,
  `keyhole-l3e`, `l4ei-puntas`, `l4ei-v`, `l4ei-arista`, `l4ei-l3e`,
  `1flip-puntas`, `1flip-bloque`, `1flip-arista`, `1flip-l3c`,
  `1flip-l3e`, `wo-puntas`, `wo-bloque`, `wo-arista`, `wo-l3c`, `wo-l3e`, `petrus-222`,
  `petrus-223`, `petrus-eo`, `petrus-f2l`, `petrus-coll`, `petrus-epll`,
  `zz-eo`, `zz-linea`, `zz-f2l`, `zz-ocll`, `zz-pll`, `roux-bloque1`,
  `roux-bloque2`, `roux-cmll`, `roux-eo`, `roux-ulur` y `roux-capa-m`, `eg-cara`, `eg-cll`, `eg-1`, `eg-2`, `leg-cara`, `leg-1`, `tcll-capa`, `tcll-cll`, `tcll-mas` y `tcll-menos`.
`/entrenar/cross` sigue siendo el entrenador antiguo de Cross.
