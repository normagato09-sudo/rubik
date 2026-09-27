# RUBIKO

App (Next.js) para aprender y resolver el cubo de Rubik, en español y pensada
para el móvil.

- **Aprender** (`/entrenar`) — notación, cruz, esquinas, F2L, OLL y PLL del
  3×3, con los algoritmos de `docs/source/`.
- **Solucionador** (`/solucionador`) — para **3×3** y **2×2** (selector
  arriba; se recuerda en el dispositivo). Los colores se introducen a mano o
  con la cámara / una foto por cara, con validación en vivo que marca las
  pegatinas imposibles. La solución se sigue paso a paso con un cubo 3D.
  - 3×3: algoritmo de dos fases de Kociemba.
  - 2×2: tres formas a elegir — **Óptima** (la más corta, ≤ 11
    movimientos), **Método Ortega** (primera cara → OLL → PBL) y **Método
    CLL** (primera capa → CLL), con los algoritmos de
    `docs/source/Ortega.docx` y `docs/source/CLL.docx`. Sin centros, la guía
    es la esquina amarilla-azul-naranja abajo-detrás-izquierda; si el cubo se
    copia en otra posición, se reorienta.

Todo el cálculo ocurre en el navegador (Web Worker); ninguna imagen sale del
dispositivo. Cada solución se reproduce con el motor 3D de RUBIKO antes de
mostrarse.

## Estructura

- `src/features/cube` — motor del cubo (3×3 y 2×2 con el mismo código) y
  render 3D.
- `src/features/solver` — pantalla del solucionador, cámara, reproductor,
  Worker y solver 3×3.
- `src/features/solver2x2` — solver 2×2: validación, búsqueda óptima, Ortega
  y CLL.
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
