# RUBIKO

App (Next.js) para aprender y resolver el cubo de Rubik, en español y pensada
para el móvil.

- **Aprender** (`/entrenar`) — según el Cubo y el Método elegidos en Inicio:
  - 3×3 · CFOP: notación, cruz, esquinas, F2L, OLL y PLL.
  - 2×2 · Ortega (`?metodo=ortega`): notación 2×2, primera cara, OLL (7) y
    PBL (5).
  - 2×2 · CLL (`?metodo=cll`): notación 2×2, primera capa y CLL (42).

  Cada caso tiene su diagrama, su algoritmo y sus movimientos numerados. Los
  del 2×2 traen además una explicación corta. Todo sale de `docs/source/`.
- **Solucionador** (`/solucionador`) — para **3×3** y **2×2** (selector
  arriba; se recuerda en el dispositivo). Los colores se introducen a mano o
  con la cámara / una foto por cara, con validación en vivo que marca las
  pegatinas imposibles. La solución se sigue paso a paso con un cubo 3D.
  - 3×3: algoritmo de dos fases de Kociemba.
  - 2×2: la solución más corta (≤ 11 movimientos, solo R, U y F, sin girar
    el cubo entero), con el mismo reproductor y la misma lista que el 3×3.
    Sin centros, la guía es la esquina amarilla-azul-naranja
    abajo-detrás-izquierda. Si el cubo se copia en otra posición, se deja
    quieta la esquina que haya ahí.

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
