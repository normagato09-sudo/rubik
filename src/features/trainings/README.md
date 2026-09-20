# trainings

Resultados de los módulos de Aprender (Aprender → cubo → método → etapa,
p.ej. 3×3 → CFOP → Cross). Un `TrainingAttempt` NUNCA se mezcla con un
`Solve` de `features/history`, aunque ambos puedan reutilizar el mismo
motor de timer/scramble: significan cosas distintas (una repetición
técnica de una fase no es un solve completo).

`engine.ts` es puro, mismo patrón que `features/history/engine.ts`.
`store/trainingsStore.ts` lo expone vía Zustand.

Todavía sin ningún módulo de entrenamiento conectado (Cross incluido) —
el store existe para que, cuando se implemente Cross, grabar un intento
sea tan simple como ya lo es grabar un solve en `historyStore`.
