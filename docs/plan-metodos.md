# Plan de métodos

Estado: **confirmado por el usuario** (2026-10-02). FH queda pendiente hasta que diga qué es. Sustituye a la
tabla anterior de métodos del Pyraminx, que ya está terminada.

## Reglas de trabajo

- Cada algoritmo se comprueba con el motor de RUBIKO y los casos de cada paso
  los cuenta el propio motor (tests).
- Explicaciones con nuestras palabras y diagramas dibujados por la app. Lo que
  no sale de `docs/source/` se marca como «Investigado» con su fuente.
- La notación nueva (M, E, S, giros anchos) entra en el motor con tests antes
  de usarla.
- Commit y push al final de cada fase, con un resumen corto.

## Niveles

Cada método lleva una etiqueta de nivel (Principiante, Intermedio, Avanzado o
Experto) en el desplegable de Método de Inicio y arriba en Aprender. El nivel
depende de cuántos algoritmos hay que aprender y de lo difícil que se
considera el método en la comunidad (Speedsolving Wiki, por ejemplo: ZZ con
OCLL+PLL «Beginner», COLL+EPLL «Intermediate», ZBLL «Advanced»; EG y TCLL se
recomiendan después de CLL).

## Tabla

Los casos son los que cuenta nuestro motor: posiciones agrupadas por el AUF de
antes y de después (y el ADF de después en el 2×2). Entre paréntesis, si el
recuento incluye casos ya resueltos o casos de PBL.

### 3×3

| Método | Nivel | Pasos | Casos (motor) | Fuentes |
|---|---|---|---|---|
| CFOP (hecho) | Intermedio | Cruz, Esquinas, F2L, OLL, PLL | ya en la app (F2L 24, OLL 57, PLL 21) | `docs/source/` |
| Petrus (nuevo) | Intermedio | Bloque 2×2×2, bloque 2×2×3, orientación de aristas (EO), resto de F2L, COLL, EPLL | 2×2×2, 2×2×3, EO y F2L: intuitivos (casos básicos calculados por el motor). COLL 42 (40 + 2 con las esquinas ya orientadas). EPLL 4 | Speedsolving Wiki (Petrus, COLL, EPLL); SpeedCubeDB (COLL, EPLL) |
| Roux (nuevo) | Avanzado | Primer bloque 1×2×3, segundo bloque, CMLL, LSE: 4a orientación, 4b UL/UR, 4c capa M | Bloques: intuitivos (casos básicos del motor). CMLL 42. LSE 4a: 11 casos de orientación. 4b: 4 casos (+ resuelto). 4c: 24 posiciones, se agrupan en casos en su fase | Speedsolving Wiki (Roux, CMLL, LSE); SpeedCubeDB (CMLL) |
| ZZ (nuevo) | Avanzado | EOLine, F2L solo con R, U y L, OCLL, PLL | EOLine y F2L: intuitivos (casos básicos del motor). OCLL 7. PLL 21 (los de CFOP) | Speedsolving Wiki (ZZ); SpeedCubeDB (OLL/OCLL) |

Comprobaciones del recuento: el motor da 493 casos para el último paso con las
aristas orientadas (el tamaño conocido de ZBLL), así que el método de contar
coincide con la comunidad. ZBLL no entra en el plan: son demasiados casos.

### 2×2

| Método | Nivel | Pasos | Casos (motor) | Fuentes |
|---|---|---|---|---|
| Ortega (hecho) | Intermedio | Primera cara, OLL, PBL | ya en la app (OLL 7, PBL 5) | `docs/source/` |
| CLL (hecho) | Avanzado | Primera capa, CLL | ya en la app (CLL 42) | `docs/source/` |
| EG (nuevo) | Experto | Primera cara, CLL / EG-1 / EG-2 según la capa de abajo | CLL 42 (el de CLL). EG-1 43 (40 + 3 de PBL). EG-2 43 (40 + 3 de PBL). En total 128, como dice la comunidad | Speedsolving Wiki (EG); SpeedCubeDB (EG-1, EG-2) |
| LEG (nuevo) | Experto | Primera cara con la barra a la izquierda, LEG-1 | LEG-1 43 (40 + 3 de PBL) | Speedsolving Wiki (LEG-1); speedcube.quest y SpeedCubeDB (LEG-1) |
| TCLL (nuevo) | Experto | Primera capa con una esquina girada, TCLL+ / TCLL− | TCLL+ 43, TCLL− 43 | Speedsolving Wiki (TCLL); SpeedCubeDB (TCLL+, TCLL−) |
| FH | — | **Sin identificar**: no aparece ningún método 2×2 llamado «FH» en Speedsolving Wiki ni en las bases de algoritmos. Pendiente de que el usuario diga qué es | — | — |

### Pyraminx (hecho, no se añaden más)

| Método | Nivel |
|---|---|
| Por capas | Principiante |
| Keyhole | Intermedio |
| L4E intuitivo | Intermedio |
| L4E | Intermedio |
| Oka | Avanzado |
| 1-Flip | Avanzado |
| WO | Avanzado |
| Nutella | Experto |

## Fases

1. **Niveles** (hecho): la etiqueta en Inicio (desplegable de Método) y en Aprender,
   para todos los métodos que ya existen.
2. **Notación 3×3 ampliada**: M, E, S y giros anchos (r/Rw, l, u, d, f, b) en
   el motor, con tests, y en el bloque de notación de Aprender. De paso se
   comprueban con el motor los OLL y PLL de las hojas que usan M o giros anchos.
3. **Petrus** (3×3).
4. **ZZ** (3×3).
5. **Roux** (3×3).
6. **EG** (2×2): EG-1 y EG-2; reutiliza CLL.
7. **LEG y TCLL** (2×2).
8. **FH**: solo si el usuario confirma qué es.

En el selector de Método, cada cubo ordena sus métodos por nivel, de más
fácil a más difícil.
