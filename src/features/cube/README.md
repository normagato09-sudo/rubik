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
