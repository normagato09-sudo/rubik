# history

Historial de resoluciones reales de la sesión. `engine.ts` es pura
(sin React/Three.js/Zustand): añadir una entrada, actualizar la
penalización de una existente, o vaciar la lista. `store/historyStore.ts`
la expone vía Zustand.

Cada entrada guarda el tiempo base, la penalización (`none`/`plus2`/`dnf`)
y el scramble por separado — nunca convierte un DNF en un número.

`store/timerStore.ts` orquesta cuándo se registra: al detener el
cronómetro se crea una única entrada; si después se aplica +2 o DNF, se
actualiza esa misma entrada (por id) en vez de crear una nueva. El
scramble se lee de `cubeStore.scramble`, la misma fuente de verdad que
ya usa el resto de la app, sin duplicarlo.

Por ahora vive solo en memoria (se pierde al recargar la página); el
modelo ya es independiente de dónde vive el array, así que conectarlo a
persistencia más adelante no debería requerir rehacer esta arquitectura.

Fase 2, paso 11. Implementado. Pendiente: Ao5/Ao12 y estadísticas
(consumirán estas mismas entradas), y guardado persistente vía
`lib/storage`.