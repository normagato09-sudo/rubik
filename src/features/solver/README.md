# solver

Solucionador 3×3 (`/solucionador`): el usuario colorea las 54 pegatinas de su
cubo (blanco arriba, verde delante) y recibe los movimientos para resolverlo.

- `cubie.ts` — modelo de piezas (esquinas/aristas con giro y volteo, notación
  de Kociemba) y los 18 movimientos de cara.
- `facelets.ts` — pegatinas ↔ piezas, y validación con mensajes en español,
  clasificada en entrada incompleta, recuento de colores incorrecto o cubo
  imposible (piezas imposibles o repetidas, esquina girada, arista dada la
  vuelta, dos piezas intercambiadas). Si el cubo es imposible, `findTurnedFace`
  señala la cara que parece copiada girada (solo para avisar: nunca se
  resuelve un cubo inválido).
- `cube-state.ts` — convención de lectura de cada cara escrita en las
  coordenadas del cubo 3D (`features/cube`: blanco +y, verde +z, rojo +x):
  lee las 54 pegatinas de un `CubeState`. Los tests
  (`cube-state.test.ts`) comprueban con el motor de movimientos 3D que el
  solucionador usa las mismas caras, colores, orientación y movimientos.
- `twophase.ts` — algoritmo de dos fases de Kociemba (IDA* con tablas de
  poda), implementado aquí sin dependencias. Las tablas tardan ~1 s en
  construirse; después cada cubo se resuelve en unos 0,3 s con ~20
  movimientos (máx. 22 en las pruebas), incluido un breve margen para buscar
  una solución más corta.
- `solver.worker.ts` + `use-solver.ts` — ejecuta el solucionador en un Web
  Worker para no bloquear la pantalla; las tablas se preparan al abrirla.
- `components/SolverScreen.tsx` — la pantalla: cubo desplegado, editor de
  cara (cada borde muestra el color de la cara con la que linda), paleta con
  recuento x/9 y la solución en pasos numerados.

Los tests (`solver.test.ts`) resuelven cubos mezclados al azar leídos desde
sus pegatinas y comprueban que aplicar la solución deja el cubo resuelto.
