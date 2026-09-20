# trainer

Datos y estado del Entrenador: qué cubos y métodos existen, cuáles están
activos ("PRÓXIMAMENTE" para el resto), y la selección actual del usuario
(`store.ts`, Zustand). `cubes.ts` y `methods.ts` son datos puros, sin UI.

`cfop.ts` describe las cuatro etapas de CFOP (Cross, F2L, OLL, PLL) que se
muestran en /entrenar: nombre, descripción breve y color de acento. Todavía
sin casos ni algoritmos — eso llega en una fase posterior.

Preparado para crecer hacia: casos, algoritmos, práctica y progreso por
etapa, y para añadir más métodos (Roux, ZZ, Petrus, LBL) y más cubos
(2x2, Pyraminx, 4x4...) cuando se implementen.
