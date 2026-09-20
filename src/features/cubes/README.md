# cubes

Entidad `Cube`: los cubos del usuario ("Mis cubos"). Todo `Solve` (en
`features/history`) y todo `TrainingAttempt` (en `features/trainings`)
pertenece a un `cubeId`, para que Cubos y Tiempos puedan leer el mismo
historial filtrando por cubo en vez de mantener listas separadas.

`engine.ts` es puro (añadir un cubo). `store/cubesStore.ts` lo expone vía
Zustand, con un único cubo 3×3 sembrado por defecto para que el resto de
la app (timer, historial) siempre tenga un `cubeId` válido mientras no
existe todavía la pantalla "+ Añadir cubo".

Pendiente: pantalla de gestión de cubos, y persistencia real (`lib/storage`).
