# Plan de puzles: Skewb, 4×4, 5×5 y Megaminx

Estado: **confirmado por el usuario** (2026-10-10).

## Reglas de trabajo

- Orden: **Skewb → 4×4 → 5×5 → Megaminx**. Un puzzle termina (sus 3 fases,
  con commit y push) antes de empezar el siguiente.
- Cada puzzle sigue el diseño, la estructura y la navegación del 3×3, el 2×2
  y el Pyraminx: Inicio (selector Cubo y Método, timer, mezcla, 3D),
  Aprender y Solucionador.
- En `C:\Users\Lenovo\Downloads` no hay documentos de estos puzzles (solo
  material ajeno a RUBIKO), así que todo el contenido nuevo sale de fuentes
  conocidas de speedcubing y se marca como «Investigado» con su fuente. Si el
  usuario aporta documentos más adelante, se copian a `docs/source/` y
  mandan sobre lo investigado.
- Cada algoritmo se comprueba con el motor de RUBIKO y los casos de cada paso
  los cuenta el propio motor (tests). Explicaciones con nuestras palabras y
  diagramas dibujados por la app.
- Al terminar cada fase: tests nuevos y todos los anteriores en verde, lint,
  tipos y build limpios, revisión en navegador a 360 px y en ordenador,
  README y este plan al día, resumen corto, commit y push.

## Cómo se han contado los casos

Igual que en `docs/plan-metodos.md`: posiciones agrupadas por el AUF de antes
y el de después (en el Skewb no hay AUF: se agrupan por el giro y del puzzle
entero). Como los motores de estos puzzles aún no existen, para este plan se
han contado con modelos de prueba en Node:

- **Skewb**: modelo 3D completo de pegatinas. Comprobación: da las
  3.149.280 posiciones conocidas del Skewb.
- **Última capa del Megaminx y paridades del 4×4**: modelo de piezas de la
  última capa. Comprobación: el mismo cálculo da 57 OLL y 21 PLL en el 3×3,
  4 EPLL y 151 PLL en el Megaminx (la cifra conocida).

En la fase 2 de cada puzzle se repiten las cuentas con el motor real, en
tests. Si algo cambia, se corrige aquí.

## Niveles y métodos

Regla del usuario (2026-10-10): solo los métodos y niveles que existen de
verdad. Si un puzzle solo tiene método de principiante, solo principiante;
no se inventan métodos ni se fuerzan los cuatro niveles.

Un método de cada nivel cuando existe. Los pasos intuitivos (primera capa,
centros, emparejar aristas, F2L...) no tienen lista cerrada de casos: como en
Petrus, ZZ y Roux, se enseñan con los casos básicos que calcule el motor.

### 1. Skewb

Sin Avanzado (confirmado 2026-10-10): no hay un método reconocido entre
Sarah's Intermediate y Sarah's Advanced.

| Método | Nivel | Pasos | Casos (motor) | Fuentes |
|---|---|---|---|---|
| Por capas | Principiante | Primera capa, esquinas de arriba, centros | Primera capa: intuitiva. Esquinas: 2 casos (con 1 algoritmo, el sledgehammer, repetido). Centros: 16 casos, resueltos con 2 algoritmos repetidos | Speedsolving Wiki (Skewb, método para principiantes) |
| Sarah's Intermediate | Intermedio | Primera capa, esquinas de arriba, centros (L5C) | Esquinas: 2. Centros: 16 (un algoritmo por caso) | Speedsolving Wiki (Sarah's Intermediate); SpeedCubeDB (Skewb) |
| Sarah's Advanced | Experto | Primera capa, L2L (las dos últimas capas en un algoritmo) | L2L: **136** según el motor (540 posiciones). La comunidad habla de 134; en la fase 2 se mira de dónde salen los 2 de diferencia (lo más probable: casos simétricos que se cuentan juntos) | Speedsolving Wiki (Sarah's Advanced); SpeedCubeDB (L2L) |

Datos del motor: con la primera capa hecha, las esquinas de arriba ya están
en su sitio y solo pueden estar giradas (9 posiciones); los 5 centros que
quedan pueden estar en 60 posiciones.

### 2. 4×4

| Método | Nivel | Pasos | Casos (motor) | Fuentes |
|---|---|---|---|---|
| Reducción | Principiante | Centros, aristas de una en una, 3×3 con CFOP (Cruz, Esquinas, F2L, OLL, PLL: lo que ya hay), paridades | Centros y aristas: intuitivos. Paridad de OLL: 1 algoritmo. Paridad de PLL: 1 algoritmo (cambia dos aristas opuestas; luego, PLL normal) | Speedsolving Wiki (Reduction, 4×4 parity) |
| Reducción con Freeslice | Intermedio | Centros, 8 aristas con el corte libre, últimas 4 aristas, 3×3 con CFOP, paridades | Aristas: intuitivas; el motor cuenta los casos de las últimas aristas en la fase 2. Paridades: las mismas | Speedsolving Wiki (Freeslice) |
| Hoya | Avanzado | 2 centros opuestos, cruz, 4 centros, resto de aristas, 3×3 sin la cruz, paridades | Intuitivo salvo paridades | Speedsolving Wiki (Hoya) |
| Yau | Experto | 2 centros opuestos, 3 aristas de la cruz, 4 centros, última arista de la cruz, 8 aristas, 3×3 sin la cruz, paridades | Intuitivo salvo paridades | Speedsolving Wiki (Yau) |

Paridades según el motor: con una sola arista volteada hay 54 situaciones de
OLL distintas, y con dos aristas cambiadas, 22 de PLL. No se enseñan todas:
como en el «2 pasos» del 3×3, un algoritmo de paridad y después el
OLL/PLL normal de CFOP. Las 54 y 22 quedan como dato.

### 3. 5×5

| Método | Nivel | Pasos | Casos (motor) | Fuentes |
|---|---|---|---|---|
| Reducción | Principiante | Centros, aristas de una en una, 3×3 con CFOP, paridad de aristas | Centros y aristas: intuitivos. Paridad de aristas: 1 algoritmo | Speedsolving Wiki (Reduction, 5×5 parity) |
| Reducción con Freeslice | Intermedio | Centros, 8 aristas con el corte libre, últimas 2 aristas (L2E), 3×3, paridad | L2E: el motor los cuenta en la fase 2. Paridad: 1 | Speedsolving Wiki (Freeslice, L2E) |
| Hoya5 | Avanzado | Como Hoya en 4×4, con aristas de 3 piezas | Intuitivo salvo L2E y paridad | Speedsolving Wiki (Hoya) |
| Yau5 | Experto | Como Yau en 4×4, con aristas de 3 piezas | Intuitivo salvo L2E y paridad | Speedsolving Wiki (Yau5) |

El 5×5 no tiene paridad de OLL ni de PLL como el 4×4: tiene centros fijos.
Solo puede quedar una arista con las dos alas cambiadas.

### 4. Megaminx

| Método | Nivel | Pasos | Casos (motor) | Fuentes |
|---|---|---|---|---|
| Por capas | Principiante | Estrella, primera cara, segunda capa, caras de los lados, última cara en 4 pasos con pocos algoritmos | F2L: intuitivo. Última cara: orientar aristas (3 casos con 1 algoritmo), permutar aristas (con 1 algoritmo), permutar esquinas (con 1), orientar esquinas (R' D' R D repetido) | Speedsolving Wiki (Megaminx, método para principiantes) |
| 4LLL | Intermedio | El mismo F2L, última cara en 4 pasos: EO, CO, CP, EP | EO 3, CO 16, CP 3, EP 15 (**37 algoritmos**) | Speedsolving Wiki (Megaminx 4LLL); SpeedCubeDB (Megaminx) |
| 3LLL | Avanzado | El mismo F2L, EO, CO, PLL completo | EO 3, CO 16, PLL **151** | Speedsolving Wiki; SpeedCubeDB (Megaminx PLL) |

Sin Experto (decidido 2026-10-10, con la regla de arriba): el «2LLL» (OLL
259 + PLL 151 = 410 algoritmos) existe como lista de algoritmos, pero no como
método que se use: los mejores del Megaminx usan el PLL completo y solo una
parte del OLL. El Megaminx se queda con tres niveles.

## Fases de cada puzzle

### Fase 1: motor y 3D

- Modelo del puzzle, notación de resolución estándar y la de mezclas WCA,
  render 3D con animaciones y generador de mezclas WCA.
  - Skewb: mezcla WCA de estado aleatorio (como TNoodle), que sale del
    solucionador óptimo (tabla de 3.149.280 posiciones).
  - 4×4 y 5×5: el motor del cubo pasa a N×N (capas exteriores, anchas como Rw
    y 3Rw, y capas internas como r o 3r) sin romper el 3×3 ni el 2×2 (todos
    sus tests siguen igual). Mezclas: el 5×5 usa 60 movimientos al azar como
    TNoodle. El 4×4 de la WCA es de estado aleatorio, y eso necesita el
    solucionador de la fase 3, así que en la fase 1 lleva 40 movimientos al
    azar y en la fase 3 pasa a estado aleatorio (confirmado 2026-10-10).
  - Megaminx: notación de resolución (U, R, F, L, ... y sus `'`, `2`, `2'`) y
    la de mezclas WCA (R++, D--, U, U'; 7 líneas).
- Se activa en el selector «Cubo» de Inicio (timer, mezcla e historial como
  los demás).

### Fase 2: Aprender

- Los métodos de la tabla, con su etiqueta de nivel y la estructura de
  siempre: notación, pasos, fichas con diagrama, algoritmo, movimientos
  numerados, explicación, «Marcar como aprendido» y progreso.
- 4×4 y 5×5: paridades con sus algoritmos. La parte de 3×3 de la reducción
  reutiliza CFOP (Cruz, Esquinas, F2L, OLL y PLL ya existentes).
- Cada algoritmo comprobado con el motor. Recuento de casos repetido con el
  motor real.

### Fase 3: Solucionador

- Selector con el puzzle; entrada manual con validación en vivo en español,
  pegatinas problemáticas marcadas e indicaciones de cómo sujetar el puzzle
  para copiar cada cara.
- Cámara en Skewb, 4×4 y 5×5 (6 colores; el 4×4 no tiene centros fijos, así
  que se calibra como en el 2×2). En el Megaminx, solo entrada manual.
- Skewb: solución óptima con tabla BFS (como el 2×2). Como mucho 11
  movimientos.
- 4×4, 5×5 y Megaminx: la óptima no se puede calcular, así que se buscan los
  menos movimientos posibles por fases (búsqueda con tablas de poda, varias
  opciones y la más corta, cancelaciones simplificadas). 4×4 y 5×5 terminan
  con el solucionador de 3×3 de dos fases. Unos segundos como máximo, en el
  Web Worker. La media de movimientos se mide y se dice en el resumen.
- Toda solución se comprueba con el motor antes de mostrarla, y se ve con el
  reproductor paso a paso y el puzzle en 3D.

## Estado

| Puzzle | Fase 1 | Fase 2 | Fase 3 |
|---|---|---|---|
| Skewb | pendiente | pendiente | pendiente |
| 4×4 | pendiente | pendiente | pendiente |
| 5×5 | pendiente | pendiente | pendiente |
| Megaminx | pendiente | pendiente | pendiente |

El 6×6 y el 7×7 siguen como «próximamente» en el selector.
