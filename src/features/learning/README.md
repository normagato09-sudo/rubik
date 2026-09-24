# learning

Aprender como guía visual: el usuario lee la app y reproduce los movimientos
en su cubo físico. Aquí no hay cubo 3D, animaciones, timer, scramble ni
`TrainingAttempt`.

- `categories.ts` — bloques de la pantalla "Aprender a resolver" (Notación,
  Principiantes, F2L, OLL, PLL). Solo los que tienen contenido real
  (`available: true`) muestran progreso X/Y; el resto, "Próximamente".
- `f2l-cases.ts` — los 24 casos de `docs/source/F2L_Complet.pdf` (página 1,
  orden de lectura). Fuente de verdad: no se cambian los algoritmos.
  Diagramas en `public/learning/f2l/f2l-01.png` … `f2l-24.png`, recortados
  del raster de esa misma página.
- `notation.ts` — los 12 diagramas de `docs/source/notacion.docx` (D, U, L,
  R, F, B, M, E, S, z, y, x; cada uno con su giro inverso), en el orden del
  documento. El documento solo contiene imágenes: la etiqueta de cada capa
  ("Cara inferior (Down)"...) es la notación estándar WCA, no texto de la
  fuente. Diagramas en `public/learning/notation/notation-<giro>.png`, con
  las líneas pasadas de negro a blanco para el fondo oscuro.
- `algorithm.ts` — `splitAlgorithm()`: un paso por movimiento, tal cual.
- `progress-store.ts` — casos aprendidos (Zustand + localStorage, clave
  `rubiko-learning-progress`), separado de solves/History/TrainingAttempts.
  Se carga tras el montaje (`use-progress-hydration.ts`) para no mostrar
  números falsos durante la hidratación.

Rutas: `/entrenar` (pantalla Aprender) y `/entrenar/f2l/[caseId]` (detalle).
