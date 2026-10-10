# skewb

Todo lo del Skewb que no es pantalla: el motor, la búsqueda y las mezclas.
Fase 1 de `docs/plan-puzles.md`. Aprender y el Solucionador llegan en las
fases 2 y 3.

Posición de referencia, la de las mezclas de la WCA (Regulación 4d5):
blanco arriba y verde delante a la izquierda, mirando la esquina de arriba
delante a la derecha (el rojo queda delante a la derecha). Las caras se
llaman como en un 3×3 con blanco arriba y verde delante: U blanco, F verde,
R rojo, D amarillo, L naranja, B azul.

- `geometry.ts` — el cubo y sus 30 pegatinas: en cada cara, el centro (0)
  y los 4 triángulos de las esquinas (1 arriba a la izquierda, 2 arriba a
  la derecha, 3 abajo a la derecha, 4 abajo a la izquierda), vistos desde
  fuera como en el desarrollo plano del 3×3. Caras en el orden del 3×3:
  U 0–4, R 5–9, F 10–14, D 15–19, L 20–24, B 25–29.
- `moves.ts` — los giros sobre las pegatinas. Cada giro mueve medio Skewb
  (la esquina que le da nombre, sus 3 vecinas y los 3 centros de
  alrededor) un tercio de vuelta, en sentido horario mirando la esquina;
  `'` al revés. Las permutaciones no se escriben a mano: se calculan
  girando las pegatinas sobre el eje de la esquina. Dos notaciones:
  - WCA, la de las mezclas (Regulación 12a, `parseSkewbScramble`): R gira
    la esquina de abajo a la derecha que se ve (DBR), U la de arriba (UBL),
    L la de abajo a la izquierda (DFL) y B la de detrás, que no se ve
    (DBL). Ninguna mueve la esquina de arriba delante a la derecha.
  - La de Sarah (sarah.cubing.net), la de sus métodos, que usará Aprender
    (`parseSarahAlgorithm`): las tres esquinas de arriba que se ven, F la
    de delante (UFR), R la de la derecha (UBR) y L la de la izquierda
    (UFL), más x, y, z, que giran el Skewb entero como R, U y F en un 3×3.
- `search.ts` — el Skewb por piezas: dónde está cada centro (360 formas) y
  cada esquina, y cómo está girada (8 748 formas juntas: el giro de las
  esquinas no es libre, depende de dónde estén). Cada parte se numera
  buscando lo que alcanzan los giros, así que no hace falta saber de
  antemano qué es posible. Una tabla completa de distancias (3 149 280
  posiciones, un byte cada una, unos 0,4 s) da la solución óptima, como
  mucho 11 giros, y las mezclas de la WCA: una posición al azar (todas
  igual de probables) alcanzada con 11 giros exactos, sin repetir esquina
  seguida, como hace TNoodle (`randomStateSkewbScramble`).
  `piecesFromStickers` lee las piezas de las pegatinas para el
  Solucionador.
- `components/SkewbScene.tsx` — el Skewb en 3D, visto como lo mira la WCA,
  con animación de cada giro (de una esquina o del Skewb entero). Cada
  pegatina lleva su fondo de plástico, que gira con ella.

Tests:
- `moves.test.ts` — geometría (30 pegatinas sobre las caras del cubo),
  cada giro mueve 15 pegatinas y tres giros no hacen nada, `'` deshace,
  ningún giro de la WCA mueve la esquina UFR, cada letra gira su esquina,
  el sentido horario (x lleva el centro de delante arriba, como R en un
  3×3) y las equivalencias de la web de Sarah: F' L F L' es y' R' F R F',
  y L F' L' F es y' F R' F' R.
- `search.test.ts` — 3 149 280 posiciones con la distribución conocida
  (1, 8, 48, 288, 1 728, 10 248, 59 304, 315 198, 1 225 483, 1 455 856,
  81 028 y 90 a 11 giros), la numeración coincide con las pegatinas,
  soluciones óptimas de 300 mezclas, piezas imposibles rechazadas y 100
  mezclas WCA de 11 giros que llevan a su posición.
