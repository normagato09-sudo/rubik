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
