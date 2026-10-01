# RUBIKO

App (Next.js) para aprender y resolver el cubo de Rubik, en español y pensada
para el móvil.

- **Aprender** (`/entrenar`) — según el Cubo y el Método elegidos en Inicio:
  - 3×3 · CFOP: notación, cruz, esquinas, F2L, OLL y PLL.
  - 2×2 · Ortega (`?metodo=ortega`): notación 2×2, primera cara, OLL (7) y
    PBL (5).
  - 2×2 · CLL (`?metodo=cll`): notación 2×2, primera capa y CLL (42).
  - Pyraminx · Por capas (`?metodo=por-capas`): notación del Pyraminx,
    puntas, centros, primera capa y última capa (5).
  - Pyraminx · Keyhole (`?metodo=keyhole`): notación, puntas, bloque de
    detrás, centros con el hueco, arista del hueco (7) y L3E (5).
  - Pyraminx · L4E intuitivo (`?metodo=l4e-intuitivo`): notación, puntas,
    V, arista de arriba (7) y L3E (5).
  - Pyraminx · L4E (`?metodo=l4e`): notación del Pyraminx, puntas, V y
    L4E (30).

  Keyhole y L4E intuitivo no salen de `docs/source/` sino de investigación
  (Speedsolving Wiki, guía Keyhole de Andy Klise): cada ficha lo marca como
  «Investigado» con su fuente, y cada algoritmo está comprobado con el
  motor del Pyraminx.

  Cada caso tiene su diagrama, su algoritmo y sus movimientos numerados. Los
  del 2×2 y del Pyraminx traen además una explicación corta. Todo lo demás
  sale de `docs/source/`.
- **Solucionador** (`/solucionador`) — para **3×3**, **2×2** y **Pyraminx**
  (selector arriba; se recuerda en el dispositivo). Los colores se introducen a mano o
  con la cámara / una foto por cara, con validación en vivo que marca las
  pegatinas imposibles. La solución se sigue paso a paso con un cubo 3D.
  - 3×3: algoritmo de dos fases de Kociemba.
  - 2×2: la solución más corta (≤ 11 movimientos, solo R, U y F, sin girar
    el cubo entero), con el mismo reproductor y la misma lista que el 3×3.
    Sin centros, la guía es la esquina amarilla-azul-naranja
    abajo-detrás-izquierda. Si el cubo se copia en otra posición, se deja
    quieta la esquina que haya ahí.
  - Pyraminx: 36 pegatinas (4 caras triangulares de 9), a mano o con la
    cámara (guía triangular). La solución más corta: como mucho 11 giros
    grandes (U, L, R, B) más un giro por punta (u, l, r, b), con su propio
    reproductor paso a paso y el Pyraminx en 3D.

Todo el cálculo ocurre en el navegador (Web Worker); ninguna imagen sale del
dispositivo. Cada solución se reproduce con el motor 3D de RUBIKO antes de
mostrarse.

## Estructura

- `src/features/cube` — motor del cubo (3×3 y 2×2 con el mismo código) y
  render 3D.
- `src/features/solver` — pantalla del solucionador, cámara, reproductor,
  Worker y solver 3×3.
- `src/features/solver2x2` — solver 2×2 (validación y búsqueda óptima) y
  los algoritmos de Ortega y CLL que enseña Aprender.
- `src/features/pyraminx` — motor del Pyraminx (geometría, giros, piezas),
  validación, lectura con cámara, búsqueda óptima, render 3D y los
  algoritmos de Por capas y L4E que enseña Aprender.
- `src/features/learning`, `src/features/trainer` — Aprender y Entrenar.
- `docs/source/` — hojas de algoritmos de las que salen los datos.

Cada carpeta de `src/features` tiene su propio README.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # vitest
npm run lint
npm run build
```
