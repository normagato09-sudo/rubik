# cube

Estado real del cubo (modelo de datos + movimientos R, R', R2... U, D, F, B, L)
y su representación 3D (Three.js / React Three Fiber). Sin dependencias de UI de
otras features: scramble, timer, solver y tutorial consumen este motor.

`components/CubeBody.tsx` es la lógica de renderizado/animación (dividir
en capa animada + resto, `Cubie`, `AnimatedLayer`), sin store: recibe
`cubeState`/`activeMove`/`moveId`/`onMoveComplete` como props.
`components/RubiksCube.tsx` es `CubeBody` conectado a `store/cubeStore`
(la resolución real). `components/CubeScene.tsx` es el Canvas + luces +
`OrbitControls` reutilizable alrededor de `CubeBody`, para cualquier
`CubeState` que no sea el cubo global — estático (una vista previa) o
animando sus propios movimientos (p.ej. un caso de `features/trainings`),
sin acoplarse nunca al cubo/scramble de la pantalla de resolver.

Fase 1, pasos 4-7.

**3×3 y 2×2 con el mismo motor.** `createSolvedCube(size)` crea 26 piezas
(3×3) u 8 esquinas (2×2). Las posiciones son siempre {-1, 0, 1}: el 2×2
simplemente no tiene capa 0, así que cada giro (que mueve las piezas con
coordenada ±1 en su eje) sirve igual para los dos. `CubeScene`/`CubeBody`
reciben `size` y dibujan el 2×2 con las piezas juntas y la cámara más cerca.
Además de R, U, F, L, D y B (con ' y 2), el motor entiende x, y y z (girar el
cubo entero, como R, U y F); algunos algoritmos del 2×2 los usan.
`ALL_MOVES` sigue siendo solo los 18 giros de cara (mezclas y solver 3×3).

**4×4 y 5×5 (N×N).** Las coordenadas de las capas siguen la regla del
2×2 y el 3×3 (`layerCoords`): en los cubos impares, enteros seguidos
alrededor de 0 (3×3: -1, 0, 1; 5×5: -2 … 2); en los pares, enteros impares
(2×2: -1, 1; 4×4: -3, -1, 1, 3). Así un cuarto de vuelta sigue siendo un
intercambio exacto de enteros y el 2×2 y el 3×3 no cambian en nada.
`createSolvedCube(4)` crea 56 piezas y `createSolvedCube(5)`, 98 (las de
dentro no se ven). Los giros de cubo grande (`BigMove`) siguen la
Regulación 12a de la WCA y la notación habitual de las capas internas:
R gira la capa de fuera; Rw las 2 de fuera y 3Rw las 3 (giros anchos); r
solo la 2.ª capa y 3r solo la 3.ª (capas internas, como en los algoritmos
de paridad del 4×4); x, y, z el cubo entero. En el 3×3 y el 2×2, r sigue
siendo R con M, como lo escriben sus algoritmos. `layerTurn(move, size)`
dice qué capas gira cualquier movimiento de cualquier cubo;
`applyCubeMove` lo aplica (el 2×2 y el 3×3 siguen pasando por
`applyMove`, igual que antes) y `parseBigAlgorithm` lee algoritmos y
mezclas de 4×4 y 5×5. `CubeScene`/`CubeBody` dibujan y animan cualquier
tamaño con `layerTurn`, con la cámara a la distancia de cada uno.

Tests del N×N (`big-cube.test.ts`): piezas y pegatinas de cada tamaño;
cada giro cuatro veces o con su inverso no cambia nada; Rw = R r,
3Rw = R r 3r, x = Rw Lw' (4×4); cuántas piezas mueve cada giro; la paridad
de PLL (r2 U2 r2 Uw2 r2 Uw2, más U2) cambia solo las aristas UF y UB, y la
de OLL voltea la arista UF sin tocar los centros ni las dos primeras
capas; mezclas de 40 movimientos que se deshacen exactamente.
