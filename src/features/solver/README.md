# solver

Solucionador 3×3 (`/solucionador`): el usuario colorea las 54 pegatinas de su
cubo (blanco arriba, verde delante) y recibe los movimientos para resolverlo.

- `cubie.ts` — modelo de piezas (esquinas/aristas con giro y volteo, notación
  de Kociemba) y los 18 movimientos de cara.
- `facelets.ts` — pegatinas ↔ piezas, y validación con mensajes en español:
  colores que faltan o sobran, piezas imposibles o repetidas, esquina girada,
  arista dada la vuelta y dos piezas intercambiadas (paridad).
- `twophase.ts` — algoritmo de dos fases de Kociemba (IDA* con tablas de
  poda), implementado aquí sin dependencias. Las tablas tardan ~1 s en
  construirse; después cada cubo se resuelve en unos 0,3 s con ~20
  movimientos (máx. 22 en las pruebas), incluido un breve margen para buscar
  una solución más corta.
- `solver.worker.ts` + `use-solver.ts` — ejecuta el solucionador en un Web
  Worker para no bloquear la pantalla; las tablas se preparan al abrirla.
- `components/SolverScreen.tsx` — la pantalla: cubo desplegado, editor de
  cara, paleta con recuento x/9 y la solución en pasos numerados.

Los tests (`solver.test.ts`) resuelven cubos mezclados al azar leídos desde
sus pegatinas y comprueban que aplicar la solución deja el cubo resuelto.
