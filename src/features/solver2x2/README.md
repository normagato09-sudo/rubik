# solver2x2

Solucionador 2×2 (dentro de `/solucionador`, eligiendo "2×2"). Da una sola
solución, la más corta: como mucho 11 movimientos, solo R, U y F, sin girar el
cubo entero. Se muestra igual que la del 3×3: mismo reproductor, misma lista
de movimientos.

El 2×2 no tiene centros, así que la guía es la esquina amarilla-azul-naranja.
Va abajo-detrás-izquierda, que es donde está en un cubo resuelto con blanco
arriba y verde delante. Si el usuario copia el cubo en otra posición, no se
marca como inválido: se deja quieta la esquina que haya abajo-detrás-izquierda
y se renombran los colores. Los giros físicos son los mismos y la solución es
igual de corta.

- `solve.ts` — `solve2x2()`: valida las pegatinas, busca la solución óptima y
  la reproduce con el motor 3D antes de devolverla. Se ejecuta en el mismo Web
  Worker que el 3×3 (`features/solver/solver-requests.ts`).
- `facelets.ts` — las 24 pegatinas y su validación en vivo en español:
  - Mismo orden y lectura que el 3×3, con 4 pegatinas por cara.
  - Las esquinas se reconocen por sus tres colores.
  - Comprueba 4 pegatinas de cada color, esquinas reales (sin colores
    repetidos ni opuestos, ni en espejo), cada esquina una sola vez y el giro
    total ("hay una esquina girada sobre sí misma").
  - Marca las pegatinas con problemas y detecta caras copiadas giradas, igual
    que el 3×3.
- `sticker-moves.ts` — los movimientos sobre las 24 pegatinas, calculados con
  el motor 3D (`features/cube`), y las 24 orientaciones del cubo.
  `cubeStateForSolution2` reproduce la solución con el motor 3D y solo la
  acepta si deja resuelto exactamente el cubo pintado.
- `search.ts` — tabla BFS completa: 3 674 160 posiciones con la esquina DBL
  fija, un byte cada una, que se construye en unos 0,3 s.
- `algorithm.ts` — lee los algoritmos tal como vienen en las hojas
  (paréntesis, ’, R2', x/y).
- `algorithms.ts` — los algoritmos de OLL, PBL y CLL que enseña Aprender
  (`features/learning/cases-2x2.ts`):
  - Salen de `docs/source/Ortega.docx` y `docs/source/CLL.docx`, con el
    diagrama de cada caso codificado.
  - Los que las hojas tienen mal o no tienen usan el estándar y lo dicen
    (`source`, `docAlgorithm`).
- `case-check.ts` — lo que necesitan los tests para comprobar un caso: dónde
  deja una capa cada algoritmo, los ajustes de U y D, y si una capa está
  resuelta o tiene un intercambio adyacente o diagonal.

Tests:
- `solve.test.ts` — 300 cubos aleatorios, sujetos de cualquier forma,
  resueltos en ≤ 11 movimientos de R, U y F.
- `search.test.ts` — distancias exactas de todas las posiciones, cada giro se
  deshace con su inverso y se rechazan los cubos imposibles.
- `algorithms.test.ts` — cada algoritmo resuelve con el motor 3D el caso de su
  diagrama. Cubre los 7 OLL, los 5 PBL y los 42 CLL, comprueba que los
  algoritmos coinciden con los .docx y que los sustituidos de verdad fallan.
- `facelets.test.ts` — validación y reorientación.
