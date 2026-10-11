# scramble

Generador de secuencias de scramble válidas (sin movimientos redundantes o
que se anulen entre sí). Usa el motor de movimientos de `features/cube`.
El scramble activo se guarda en `store/cubeStore`, junto al estado del
cubo, para que el futuro cronómetro pueda leerlo.

Fase 1, paso 5. Implementado.

`generate2x2Scramble()` — mezclas de 2×2 de 9 a 11 movimientos con R, U y F,
sin repetir cara seguida (con una esquina quieta, R, U y F llegan a todas
las posiciones).

`generatePyraminxScramble()` — mezclas de Pyraminx en el formato habitual:
11 giros grandes (U, L, R, B) sin repetir punta seguida y después cada punta
(u, l, r, b) girada o no al azar.

`generateSkewbScramble()` — mezclas de Skewb de la WCA, como las de TNoodle:
una posición al azar, todas igual de probables, alcanzada con 11 giros
exactos de R, U, L y B (`features/skewb/search.ts`).

`generate4x4Scramble()` — mezclas de 4×4 de 40 movimientos al azar, como
hacía TNoodle antes de las de estado aleatorio: las 6 caras y los giros
anchos Rw, Uw y Fw (con ' y 2), nunca dos seguidos sobre el mismo eje. La
mezcla de estado aleatorio de la WCA necesita el solucionador del 4×4, y
llega en su fase 3 (`docs/plan-puzles.md`).
