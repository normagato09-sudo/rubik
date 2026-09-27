# solver2x2

Solucionador 2×2 (dentro de `/solucionador`, eligiendo "2×2"). Resuelve de
tres formas, a elegir antes de pulsar Resolver, siempre en pasos con nombre:

- **Óptima** — la solución más corta (11 movimientos como mucho, solo R, U
  y F), con la esquina amarilla-azul-naranja quieta abajo-detrás-izquierda.
- **Método Ortega** — Paso 1 "Primera cara" (la cara de un color que sale
  más corta, se dice cuál) → Paso 2 "OLL" (7 casos, con AUF) → Paso 3 "PBL"
  (5 casos, con ajustes de U/D; si el intercambio está solo abajo, x2).
- **Método CLL** — Paso 1 "Primera capa" (la más corta, con los lados bien) →
  Paso 2 "CLL" (42 casos, con AUF antes y después).

El 2×2 no tiene centros: la guía es la esquina amarilla-azul-naranja, que va
abajo-detrás-izquierda (donde está en un cubo resuelto con blanco arriba y
verde delante). Si el usuario copia el cubo en otra posición no se marca como
inválido: se reorienta (x/y/z) antes de resolver.

- `facelets.ts` — las 24 pegatinas (mismo orden y lectura que el 3×3, 4 por
  cara), esquinas por sus tres colores y validación en vivo en español: 4 de
  cada color, esquinas reales (sin colores repetidos ni opuestos, ni en
  espejo), cada esquina una vez y giro total correcto ("hay una esquina girada
  sobre sí misma"), con las pegatinas problemáticas marcadas y detección de
  caras copiadas giradas, igual que el 3×3.
- `sticker-moves.ts` — los movimientos sobre las 24 pegatinas, calculados con
  el motor 3D (`features/cube`), las 24 orientaciones del cubo y
  `cubeStateForSolution2`: reproduce la solución con el motor 3D y solo la
  acepta si deja el cubo resuelto partiendo exactamente de lo pintado.
- `search.ts` — tabla BFS completa (3 674 160 posiciones con la esquina DBL
  fija, un byte cada una, ~0,3 s) para la óptima, y tablas pequeñas de las
  otras tres esquinas de abajo para "primera cara" y "primera capa".
- `algorithm.ts` — lee los algoritmos tal como vienen en las hojas
  (paréntesis, ’, R2', x/y).
- `algorithms.ts` — los algoritmos de OLL, PBL y CLL, sacados de
  `docs/source/Ortega.docx` y `docs/source/CLL.docx` (lo que enseña RUBIKO),
  con el diagrama de cada caso codificado. Los que las hojas tienen mal o no
  tienen usan el estándar y lo dicen (`source`, `docAlgorithm`).
- `methods.ts` — los tres métodos. Cada caso se reconoce probando sus
  algoritmos (con AUF/ajustes) sobre las pegatinas y quedándose con el más
  corto que de verdad hace el paso; la solución entera pasa por el motor 3D
  antes de devolverse. Se ejecuta en el mismo Web Worker que el 3×3
  (`features/solver/solver-requests.ts`).

Tests: `search.test.ts` (distancias exactas de todas las posiciones del 2×2,
cada giro se deshace con su inverso, mezclas en ≤ 11, cubos imposibles
rechazados), `algorithms.test.ts` (cada algoritmo resuelve con el motor 3D el
caso de su diagrama, cobertura de los 7 OLL, 5 PBL y 42 CLL, los algoritmos
coinciden con los .docx y los que se sustituyeron fallan de verdad),
`methods.test.ts` (cientos de cubos aleatorios por método, paso a paso) y
`facelets.test.ts` (validación y reorientación).
