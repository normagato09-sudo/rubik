# solver

Solucionador 3×3 (`/solucionador`): el usuario colorea las 54 pegatinas de su
cubo (blanco arriba, verde delante) y recibe los movimientos para resolverlo,
que puede seguir paso a paso con su cubo físico.

- `cubie.ts` — modelo de piezas (esquinas/aristas con giro y volteo, notación
  de Kociemba), los 18 movimientos de cara y `cubeProblem` (pieza repetida,
  esquina girada, arista dada la vuelta o paridad imposible).
- `facelets.ts` — pegatinas ↔ piezas y validación con mensajes en español:
  entrada incompleta (por cara), recuento de colores incorrecto o cubo
  imposible. `pieceIssues` detecta en cuanto se pintan las piezas imposibles
  (color repetido, colores opuestos, esquina en espejo) y `validateFacelets`
  resume el estado para la pantalla. Si el cubo es imposible,
  `findTurnedFaces` busca una o dos caras copiadas giradas: solo se corrige
  si el usuario pulsa el botón; nunca se resuelve un cubo inválido.
- `cube-state.ts` — convención de lectura de cada cara escrita en las
  coordenadas del cubo 3D (`features/cube`: blanco +y, verde +z, rojo +x).
  `cubeStateForSolution` reconstruye el cubo del usuario con el motor 3D de
  RUBIKO a partir de la solución y comprueba que muestra exactamente las
  pegatinas pintadas: solo se enseñan soluciones que de verdad lo resuelven.
- `twophase.ts` — algoritmo de dos fases de Kociemba (IDA* con tablas de
  poda), sin dependencias. Rechaza cubos imposibles, tiene límite de tiempo
  y verifica la solución antes de devolverla.
- `solver-requests.ts` + `solver.worker.ts` + `use-solver.ts` — el solver en
  un Web Worker. Toda petición termina (solución o error): si el Worker no
  carga, falla o tarda más de 30 s se descarta y el siguiente intento crea
  otro; sin soporte de Worker se resuelve en el hilo principal.
- `components/SolverScreen.tsx` — cubo desplegado, editor de cara (cada
  borde muestra el centro con el que linda), paleta con recuento x/9 y
  validación en vivo. "Resolver" solo se activa con un cubo válido.
- `components/SolutionPlayer.tsx` — la solución completa y un reproductor
  paso a paso con el cubo 3D (`CubeScene`), movimiento actual explicado y
  lista numerada.

Tests: `solver.test.ts` (movimientos, coordenadas, validación, solver y
Worker) y `cube-state.test.ts` (recorrido completo: estado 3D → pegatinas →
validación → solver → movimientos aplicados al cubo 3D → resuelto).
