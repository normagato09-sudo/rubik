# pyraminx

Todo lo del Pyraminx que no es pantalla: el motor, la validación, la
cámara, el solver y los algoritmos que enseña Aprender. Lo usan el
Solucionador (`features/solver/components/Pyraminx*.tsx`, eligiendo
"Pyraminx") y Aprender (`features/learning/cases-pyraminx.ts`).

Posición de referencia: amarillo abajo, verde delante, rojo a la izquierda y
azul a la derecha. Las 4 puntas se llaman como los giros que las mueven: U
(arriba), L (delante a la izquierda), R (delante a la derecha) y B (detrás).

- `geometry.ts` — el tetraedro y sus 36 pegatinas. Cada cara (F 0–8, L 9–17,
  R 18–26, D 27–35) se numera igual, vista desde fuera con su vértice arriba:
  0, 4 y 8 son puntas; 2, 5 y 7 centros; 1, 3 y 6 aristas.
- `moves.ts` — los giros sobre las pegatinas: U, L, R, B (capa grande) y
  u, l, r, b (solo la punta), un tercio de vuelta en sentido horario mirando
  la punta; `'` al revés. Las permutaciones no se escriben a mano: se
  calculan girando la capa sobre el eje de su punta. Para los algoritmos de
  Aprender lee además la notación ampliada de la Speedsolving Wiki
  (`parsePyraNotation`, `applyPyraTokens`): giros de cara Fw, Lw, Rw y Dw
  (todo menos la capa de la punta opuesta, en sentido horario mirando la
  cara) y giros del Pyraminx entero [U], [L], [R] y [B]. Los 16 giros de
  siempre no cambian: el solucionador sigue usando solo `PyraMove`.
- `pieces.ts` — las piezas como grupos de pegatinas: 4 puntas y 4 centros
  (3 pegatinas, solo giran) y 6 aristas (2, se mueven).
- `facelets.ts` — validación en vivo con mensajes en español (incompleto,
  recuento, pieza imposible) y las pegatinas que hay que revisar. No hace
  falta sujetarlo de una forma concreta: los centros dicen el color de cada
  cara. Si es imposible, busca una cara copiada girada y ofrece girarla.
- `search.ts` — solución óptima: primero las puntas (un giro como mucho
  cada una), después centros y aristas (933 120 posiciones) con una tabla
  completa de distancias. Como mucho 11 giros grandes más 4 de puntas.
- `scan.ts` — lectura de una cara con la cámara o una foto, en una guía
  triangular; usa `features/solver/color-scan.ts` y se calibra con las caras
  ya confirmadas.
- `algorithms.ts` — los algoritmos de Por capas (última capa, 5) y L4E (30),
  tal como están en las hojas de `docs/source/`, cada uno con el dibujo de
  su caso. Donde la hoja se equivoca se usa el correcto y `source:
  "corregido"` lo dice, con el texto de la hoja en `docAlgorithm`.
- `research.ts` — los algoritmos que no salen de las hojas sino de
  investigación, cada uno con su fuente (`SOURCES`): L3E (las 3 aristas de
  la cara de delante, 5 casos, Speedsolving Wiki), la arista que cierra el
  bloque de detrás en Keyhole (7, guía de Andy Klise) y los casos básicos de
  centros de Keyhole (calculados con el motor con U y Fw, el método de la
  guía). En los métodos Top First el bloque es la capa de la punta de
  detrás (B) y la última capa, la cara verde.
- `diagrams.ts` — dibuja, con el estilo de las hojas, los casos que estas no
  traen, a partir del propio caso: el dibujo no puede contradecir al
  algoritmo.
- `components/PyraminxScene.tsx` — el Pyraminx en 3D para el reproductor de
  la solución.

Tests: `moves.test.ts` (geometría, giros y lectura de los algoritmos de las
hojas), `search.test.ts` (300 mezclas resueltas en ≤ 11 + 4, optimalidad,
cualquier forma de sujetarlo, validación y caras giradas), `scan.test.ts`
(caras sintéticas con ruido y poca luz, 4 caras → editor) y
`algorithms.test.ts` (cada algoritmo, más su ajuste final, resuelve el caso
de su dibujo; el de la hoja corregido de verdad no lo resuelve; y los textos
coinciden con los .docx de `docs/source/`). `moves.test.ts` comprueba también
la notación ampliada (los 16 giros de siempre siguen igual) y
`research.test.ts` cada algoritmo investigado, además de contar los casos
con el motor: L3E 6 (uno resuelto) de 12 posiciones, la arista del hueco 7,
y los centros de Keyhole 81 posiciones, 26 casos si el de arriba se deja
para el final.
