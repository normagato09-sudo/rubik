# trainings

Resultados de los módulos de Aprender (Aprender → cubo → método → etapa,
p.ej. 3×3 → CFOP → Cross). Un `TrainingAttempt` NUNCA se mezcla con un
`Solve` de `features/history`, aunque ambos puedan reutilizar el mismo
motor de timer/scramble: significan cosas distintas (una repetición
técnica de una fase no es un solve completo).

`engine.ts` es puro, mismo patrón que `features/history/engine.ts`.
`store/trainingsStore.ts` lo expone vía Zustand.

Cross (3×3 → CFOP → Cross) es el primer módulo conectado, pero todavía
como aprendizaje visual, no como práctica cronometrada:
`components/CrossTrainer.tsx` recorre los 4 casos de
`features/trainer/cross-cases.ts` (situación + algoritmo, tomados de una
referencia real — ver ese archivo), animando cada movimiento sobre un
cubo local propio (`features/cube/components/CubeScene.tsx`), sin tocar
`cubeStore`. No usa `timerStore`/`trainingsStore` todavía: no hay
cronómetro ni `TrainingAttempt` en Cross por ahora — eso queda para un
futuro modo "Practicar" que sí use `trainingsStore.record()` tal como
está preparado en `engine.ts`.

F2L, OLL y PLL todavía no están conectados — solo Cross.
