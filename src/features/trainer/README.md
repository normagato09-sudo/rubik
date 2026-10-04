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
ese tipo de cubo. Activos hoy: 3x3 con CFOP, Petrus, ZZ y Roux, 2x2 con Ortega, CLL y EG, y
Pyraminx con Por capas, Keyhole, L4E intuitivo, L4E, Oka, 1-Flip, WO y
Nutella. Cada método activo tiene su nivel (`level`: Principiante,
Intermedio, Avanzado o Experto, ver `docs/plan-metodos.md`) y cada cubo los
lista de más fácil a más difícil; el desplegable de Método de Inicio y la
cabecera de Aprender lo muestran con `LevelBadge`. El
botón Aprender de Inicio lleva al contenido del método elegido
(`learnHref`, en `features/learning/categories.ts`).

`cfop.ts` describe las cuatro etapas de CFOP (Cross, F2L, OLL, PLL) que se
muestran en /entrenar: nombre, descripción breve y color de acento.

`cross-cases.ts` tiene los primeros casos reales: los 4 casos titulados
de la cruz blanca de la guía beginner de ruwix.com (situación + algoritmo,
citados de esa fuente, no inventados), más `startingStateFor()`, que
calcula el `CubeState` de partida de cada caso aplicando el inverso de su
algoritmo a un cubo resuelto — así "resolver el caso" siempre vuelve a un
cubo resuelto, sin necesidad de fabricar un scramble a mano. F2L/OLL/PLL
sin casos ni algoritmos todavía — eso llega en una fase posterior.

Nota: esto es el catálogo de *tipos* de cubo para Aprender, distinto de
`features/cubes` (los cubos concretos del usuario, "Mis cubos"), que es
lo que llevan asociados los solves y los `TrainingAttempt`.

Preparado para crecer hacia: casos, algoritmos, práctica y progreso por
etapa, y para añadir más métodos (LBL) y más cubos
(Pyraminx, 4x4...) cuando se implementen.
