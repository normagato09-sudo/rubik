# scramble

Generador de secuencias de scramble válidas (sin movimientos redundantes o
que se anulen entre sí). Usa el motor de movimientos de `features/cube`.
El scramble activo se guarda en `store/cubeStore`, junto al estado del
cubo, para que el futuro cronómetro pueda leerlo.

Fase 1, paso 5. Implementado.

`generate2x2Scramble()` — mezclas de 2×2 de 9 a 11 movimientos con R, U y F,
sin repetir cara seguida (con una esquina quieta, R, U y F llegan a todas
las posiciones).
