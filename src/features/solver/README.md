# solver

Solucionador 3×3 (`/solucionador`): el usuario introduce las 54 pegatinas de
su cubo (blanco arriba, verde delante) y recibe los movimientos para
resolverlo, que puede seguir paso a paso con su cubo físico. Al entrar elige
cómo introducirlas: **Manual** (pintarlas con la paleta) o **Cámara / foto**
(se leen con la cámara, o con una foto por cara). "Cambiar forma" vuelve al
selector.

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
- `color-scan.ts` — lectura de colores, sin dependencias y sin tocar el DOM:
  `sampleFace` toma la mediana de una zona pequeña en el centro de cada
  casilla de la cuadrícula guía (`guideSquare`: el 70 % central del lado
  corto, igual que la cuadrícula que se dibuja sobre el vídeo o la foto);
  `classifyColor` convierte a CIELAB y elige el color más cercano, dando
  poco peso a la luminosidad. Rojo/naranja se deciden por el tono y
  blanco/amarillo por b* (cuánto amarillo), a medio camino entre las
  referencias de este cubo. Las referencias empiezan con valores típicos de
  cámara y se calibran con lo que ve el usuario: el centro de cada cara (de
  color conocido, en `classifyFace`) y las pegatinas de cada cara
  confirmada (`calibrate`). `looksLikeSticker` descarta plástico negro u
  oscuridad (si no, se leerían como blanco) y `centerFits` evita volver a
  capturar la cara anterior si sigue delante de la cámara.
  `createStabilityTracker` dispara la captura automática cuando los 9
  colores se mantienen ~1 s. `faceletsFromScans` pasa las 6 caras leídas a
  las pegatinas del editor.
- `components/SolverScreen.tsx` — selector de forma, cubo desplegado,
  editor de cara (cada borde muestra el centro con el que linda), paleta con
  recuento x/9 y validación en vivo. "Resolver" solo se activa con un cubo
  válido.
- `components/CameraScanner.tsx` — modo cámara / foto. Abre la cámara
  trasera (`getUserMedia`); si no hay permiso, cámara o soporte, ofrece una
  foto por cara (`accept="image/*" capture="environment"`, también desde la
  galería). Dibuja la cuadrícula guía y las barras de las caras vecinas con
  las mismas indicaciones que el modo manual, y el progreso (cara x de 6).
  Captura sola o con "Capturar"; después enseña la cara detectada en grande
  para corregir pegatinas (las dudosas llevan "?") y "Repetir foto" o
  "Siguiente cara". Al terminar pasa las pegatinas al editor, cuya
  validación (incluidas las caras giradas) revisa el cubo. Todo ocurre en el
  navegador: ninguna imagen se sube. La cámara se apaga al salir del modo o
  de la pantalla y mientras la pestaña está oculta.
- `components/face-guide.tsx` — lo que comparten ambos modos: orden de
  caras, indicaciones de cómo sujetar el cubo, marco con las barras de color,
  pegatina del editor y paleta.
- `components/SolutionPlayer.tsx` — la solución completa y un reproductor
  paso a paso con el cubo 3D (`CubeScene`), movimiento actual explicado y
  lista numerada.

Tests: `solver.test.ts` (movimientos, coordenadas, validación, solver y
Worker), `cube-state.test.ts` (recorrido completo: estado 3D → pegatinas →
validación → solver → movimientos aplicados al cubo 3D → resuelto) y
`color-scan.test.ts` (clasificación con muestras RGB, incluidos los límites
rojo/naranja y blanco/amarillo con luz cálida y fría, muestreo con mediana,
captura estable y 6 caras detectadas → pegatinas válidas del editor).
