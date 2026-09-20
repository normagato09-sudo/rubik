# trainer

Datos y estado de Aprender: catálogo de cubos y métodos, cuáles están
activos ("PRÓXIMAMENTE" para el resto), y la selección actual del usuario
(`store.ts`, Zustand). `cubes.ts`, `methods.ts` y `cfop.ts`/`stages.ts`
son datos puros, sin UI.

Relación Cubo → Método → Etapa: cada `MethodOption` tiene un `cubeType`
(`getMethodsForCubeType`), y cada etapa tiene un `methodId`
(`getStagesForMethod`). Un método nunca aparece para un cubo al que no
pertenece — CFOP nunca se ofrece fuera de `cubeType: "3x3"`. `store.ts`
aplica la cascada: cambiar de cubo recalcula el método por defecto para
ese tipo de cubo.

`cfop.ts` describe las cuatro etapas de CFOP (Cross, F2L, OLL, PLL) que se
muestran en /entrenar: nombre, descripción breve y color de acento. Todavía
sin casos ni algoritmos — eso llega en una fase posterior.

Nota: esto es el catálogo de *tipos* de cubo para Aprender, distinto de
`features/cubes` (los cubos concretos del usuario, "Mis cubos"), que es
lo que llevan asociados los solves y los `TrainingAttempt`.

Preparado para crecer hacia: casos, algoritmos, práctica y progreso por
etapa, y para añadir más métodos (Roux, ZZ, Petrus, LBL) y más cubos
(2x2, Pyraminx, 4x4...) cuando se implementen.
