# history

Historial de resoluciones reales de la sesión. `engine.ts` es pura
(sin React/Three.js/Zustand): añadir una entrada, actualizar la
penalización de una existente, o vaciar la lista. `store/historyStore.ts`
la expone vía Zustand.

Cada entrada guarda el tiempo base, la penalización (`none`/`plus2`/`dnf`),
el scramble y el `cubeId` del cubo (`features/cubes`) al que pertenece —
nunca convierte un DNF en un número, ni mezcla solves de cubos distintos.

`store/timerStore.ts` orquesta cuándo se registra: al detener el
cronómetro se crea una única entrada, con el `cubeId` del cubo activo en
`cubesStore`; si después se aplica +2 o DNF, se actualiza esa misma
entrada (por id) en vez de crear una nueva. El scramble se lee de
`cubeStore.scramble`, la misma fuente de verdad que ya usa el resto de
la app, sin duplicarlo.

`solvesForCube()` filtra este mismo array por `cubeId` — es la única
diferencia entre lo que mostrará "Cubos" (filtrado) y "Tiempos" (sin
filtrar): un único store, nunca dos historiales separados.

Por ahora vive solo en memoria (se pierde al recargar la página); el
modelo ya es independiente de dónde vive el array, así que conectarlo a
persistencia más adelante no debería requerir rehacer esta arquitectura.

Implementado: historial, Ao5 y estadísticas (consumen estas mismas
entradas). Pendiente: guardado persistente vía `lib/storage`.