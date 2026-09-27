/**
 * The three ways RUBIKO solves a 2×2, each as named steps:
 *
 * - "optimal": the shortest solution (R, U and F only), with the reference
 *   corner — yellow-blue-orange — kept still at down-back-left.
 * - "ortega": Primera cara → OLL → PBL.
 * - "cll": Primera capa → CLL.
 *
 * Cases are recognised by trying each algorithm of algorithms.ts (with the
 * U/D adjustments the step allows) on the stickers and keeping one that
 * really does the step, so a recognised case is always a solved one. The
 * whole solution is then replayed with the 3D engine
 * (cubeStateForSolution2) before it is returned.
 */
import { isRotation, moveVector, type Face, type Move } from "@/features/cube/moves";
import type { Vec3 } from "@/features/cube/types";
import type { CubeColor } from "@/features/cube/types";
import { COLOR_NAMES } from "@/features/solver/facelets";
import { parseAlgorithm } from "./algorithm";
import { CLL_CASES, ORTEGA_OLL, ORTEGA_PBL, type LayerSwap } from "./algorithms";
import {
  CORNER_COLORS,
  CORNER_FACELETS_2,
  OPPOSITE_COLOR,
  REFERENCE_SLOT,
  STICKERS_PER_FACE,
  faceOffset2,
  identifyCorner,
  isSolved2,
  parseFacelets2,
  type CornerState,
} from "./facelets";
import { firstFaceLength, firstLayerLength, solveFirstFace, solveFirstLayer, solveOptimal } from "./search";
import { ORIENTATIONS, applyMoves2, cubeStateForSolution2, simplifyMoves } from "./sticker-moves";

export type Method2x2 = "optimal" | "ortega" | "cll";

export const METHOD_LABELS: Record<Method2x2, string> = {
  optimal: "Óptima",
  ortega: "Método Ortega",
  cll: "Método CLL",
};

export interface SolutionStep {
  /** "Paso 2 · OLL". */
  title: string;
  /** Recognised case, if the step has one ("Sune"). */
  caseName?: string;
  /** What the step achieves, in Spanish. */
  explanation: string;
  moves: Move[];
}

export interface Solution2x2 {
  method: Method2x2;
  steps: SolutionStep[];
  moves: Move[];
}

const AUF: Move[][] = [[], ["U"], ["U2"], ["U'"]];
const ADF: Move[][] = [[], ["D"], ["D2"], ["D'"]];

const face = (facelets: readonly CubeColor[], name: "U" | "D") =>
  facelets.slice(faceOffset2(name), faceOffset2(name) + STICKERS_PER_FACE);

const uniform = (stickers: CubeColor[], color?: CubeColor) =>
  stickers.every((sticker) => sticker === (color ?? stickers[0]));

const colorName = (color: CubeColor) => COLOR_NAMES[color];

/** Written the way the player shows them: "x2 y". */
const moveText = (moves: Move[]) => moves.join(" ");

// ---------- orientation ----------

/** The rotation (x/y/z, maybe none) that puts the yellow-blue-orange corner down-back-left, yellow down. */
export function referenceOrientation(facelets: readonly CubeColor[]): Move[] {
  const found = ORIENTATIONS.find((rotation) => {
    const turned = applyMoves2(facelets, rotation);
    const { corner, twist } = identifyCorner(CORNER_FACELETS_2[REFERENCE_SLOT].map((i) => turned[i]));
    return corner === REFERENCE_SLOT && twist === 0;
  });
  if (!found) throw new Error("No se encuentra la esquina amarilla-azul-naranja.");
  return found;
}

/**
 * The corners as the search sees them with whatever corner is at
 * down-back-left as the fixed one: colors renamed so that corner reads
 * yellow-blue-orange (opposite colors stay opposite, so the cube is still
 * a real one in the usual color scheme).
 */
function cornersFromDbl(facelets: readonly CubeColor[]): CornerState {
  const [down, back, left] = CORNER_FACELETS_2[REFERENCE_SLOT].map((i) => facelets[i]);
  const [yellow, blue, orange] = CORNER_COLORS[REFERENCE_SLOT];
  const rename = new Map<CubeColor, CubeColor>([
    [down, yellow],
    [back, blue],
    [left, orange],
    [OPPOSITE_COLOR[down], OPPOSITE_COLOR[yellow]],
    [OPPOSITE_COLOR[back], OPPOSITE_COLOR[blue]],
    [OPPOSITE_COLOR[left], OPPOSITE_COLOR[orange]],
  ]);
  const parsed = parseFacelets2(facelets.map((color) => rename.get(color)!));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.corners;
}

/**
 * The first step of Ortega / CLL: tries the cube in each of its 24
 * orientations (every corner as the fixed one) and keeps the shortest,
 * preferring the fewest whole-cube rotations on a tie.
 */
function bestFirstStep(
  facelets: readonly CubeColor[],
  length: (corners: CornerState) => number,
  solve: (corners: CornerState) => Move[],
): { rotation: Move[]; moves: Move[]; color: CubeColor } {
  let best: { rotation: Move[]; corners: CornerState; length: number; color: CubeColor } | null = null;
  for (const rotation of ORIENTATIONS) {
    const turned = applyMoves2(facelets, rotation);
    const corners = cornersFromDbl(turned);
    const steps = length(corners);
    if (!best || steps < best.length || (steps === best.length && rotation.length < best.rotation.length)) {
      best = { rotation, corners, length: steps, color: turned[CORNER_FACELETS_2[REFERENCE_SLOT][0]] };
    }
  }
  return { rotation: best!.rotation, moves: solve(best!.corners), color: best!.color };
}

function rotationNote(rotation: Move[], color: CubeColor, what: string) {
  if (rotation.length === 0) return "";
  return ` Primero gira el cubo entero (${moveText(rotation)}): así ${what} de color ${colorName(color)} se forma abajo con menos movimientos.`;
}

// ---------- recognising a case ----------

const FACE_AT: [Vec3, Face][] = [
  [[0, 1, 0], "U"],
  [[0, -1, 0], "D"],
  [[1, 0, 0], "R"],
  [[-1, 0, 0], "L"],
  [[0, 0, 1], "F"],
  [[0, 0, -1], "B"],
];

/**
 * Where the `layer` the algorithm started on ends up once its whole-cube
 * rotations are done: "x' U2 R..." leaves the old top in front, so the
 * last adjustment of that layer is an F turn, not a U turn.
 */
export function layerAfter(moves: readonly Move[], layer: Face): Face {
  let direction = FACE_AT.find(([, face]) => face === layer)![0];
  for (const move of moves) if (isRotation(move)) direction = moveVector(move, direction);
  return FACE_AT.find(([v]) => v.every((c, i) => c === direction[i]))![1];
}

/** The four ways of adjusting `layer` after `moves` (none, quarter, half, back). */
export function adjustments(moves: readonly Move[], layer: Face): Move[][] {
  const face = layerAfter(moves, layer);
  return [[], [face], [`${face}2`], [`${face}'`]] as Move[][];
}

interface Found {
  moves: Move[];
  name: string;
  /** A U turn first, to place the case as the algorithm expects (AUF). */
  auf?: boolean;
  /** Turned upside down (x2) to do the bottom swap on top. */
  flipped?: boolean;
}

/** The first of `candidates` (sorted shortest first) that passes `done`, or null. */
function shortest(candidates: readonly Found[], start: readonly CubeColor[], done: (f: CubeColor[]) => boolean): Found | null {
  return candidates.find((candidate) => done(applyMoves2(start, candidate.moves))) ?? null;
}

/** Every candidate once, shortest first (ties keep their order: no x2 before x2). */
function sortedOnce(make: () => Iterable<Found>): () => Found[] {
  let sorted: Found[] | null = null;
  return () => (sorted ??= [...make()].sort((a, b) => a.moves.length - b.moves.length));
}

const ALGORITHM_MOVES = new Map<string, Move[]>(
  [...ORTEGA_OLL, ...ORTEGA_PBL, ...CLL_CASES].map(({ algorithm }) => [algorithm, parseAlgorithm(algorithm)]),
);
const movesOf = (algorithm: string) => ALGORITHM_MOVES.get(algorithm)!;

/** Top and bottom: how many sides have that layer's two stickers matching (4 solved, 1 adjacent swap, 0 diagonal). */
export function layerSwap(facelets: readonly CubeColor[], layer: "top" | "bottom"): LayerSwap {
  const row = layer === "top" ? 0 : 2;
  const matching = (["F", "R", "B", "L"] as const).filter((side) => {
    const o = faceOffset2(side) + row;
    return facelets[o] === facelets[o + 1];
  }).length;
  return matching === 4 ? "solved" : matching === 0 ? "diag" : "adj";
}

const SWAP_LABEL: Record<LayerSwap, string> = { solved: "bien", adj: "adyacente", diag: "diagonal" };

const ollCandidates = sortedOnce(function* (): Generator<Found> {
  for (const kase of ORTEGA_OLL) {
    for (const pre of AUF) {
      yield { moves: simplifyMoves([...pre, ...movesOf(kase.algorithm)]), name: kase.name, auf: pre.length > 0 };
    }
  }
});

const pblCandidates = sortedOnce(function* (): Generator<Found> {
  const algorithms = [{ name: "", moves: [] as Move[] }, ...ORTEGA_PBL.map((kase) => ({ name: kase.name, moves: movesOf(kase.algorithm) }))];
  for (const flip of [[], ["x2"]] as Move[][]) {
    for (const algorithm of algorithms) {
      for (const preU of AUF) {
        for (const preD of algorithm.moves.length ? ADF : [[]]) {
          for (const postU of adjustments(algorithm.moves, "U")) {
            for (const postD of adjustments(algorithm.moves, "D")) {
              yield {
                moves: simplifyMoves([...flip, ...preU, ...preD, ...algorithm.moves, ...postU, ...postD]),
                name: algorithm.name,
                flipped: flip.length > 0,
              };
            }
          }
        }
      }
    }
  }
});

const cllCandidates = sortedOnce(function* (): Generator<Found> {
  yield* AUF.map((moves) => ({ moves, name: "" }));
  for (const kase of CLL_CASES) {
    const algorithm = movesOf(kase.algorithm);
    for (const pre of AUF) {
      for (const post of adjustments(algorithm, "U")) {
        yield { moves: simplifyMoves([...pre, ...algorithm, ...post]), name: kase.name };
      }
    }
  }
});

// ---------- the methods ----------

function optimalSteps(facelets: readonly CubeColor[]): SolutionStep[] {
  const rotation = referenceOrientation(facelets);
  const turned = applyMoves2(facelets, rotation);
  const parsed = parseFacelets2(turned);
  if (!parsed.ok) throw new Error(parsed.error);
  const moves = solveOptimal(parsed.corners);
  const steps: SolutionStep[] = [];
  if (rotation.length > 0) {
    steps.push({
      title: "Coloca el cubo",
      explanation: `Gira el cubo entero (${moveText(rotation)}) hasta que la esquina amarilla-azul-naranja quede abajo, detrás y a la izquierda, con el amarillo abajo: así la copiaste de otra forma.`,
      moves: rotation,
    });
  }
  steps.push({
    title: "Solución óptima",
    explanation: `La secuencia más corta posible: ${moves.length} movimiento${moves.length === 1 ? "" : "s"}, solo con R, U y F. La esquina amarilla-azul-naranja no se mueve en ningún momento: úsala de guía.`,
    moves,
  });
  return steps;
}

function ortegaSteps(facelets: readonly CubeColor[]): SolutionStep[] {
  const first = bestFirstStep(facelets, firstFaceLength, solveFirstFace);
  const step1 = [...first.rotation, ...first.moves];
  const afterFace = applyMoves2(facelets, step1);
  const bottom = first.color;
  const top = OPPOSITE_COLOR[bottom];

  const oriented = (f: CubeColor[]) => uniform(face(f, "U"), top) && uniform(face(f, "D"), bottom);
  const oll = oriented(afterFace)
    ? { moves: [] as Move[], name: "" }
    : shortest(ollCandidates(), afterFace, oriented);
  if (!oll) throw new Error("Caso de OLL no reconocido.");
  const afterOll = applyMoves2(afterFace, oll.moves);

  const pblName = `${SWAP_LABEL[layerSwap(afterOll, "top")]} arriba, ${SWAP_LABEL[layerSwap(afterOll, "bottom")]} abajo`;
  const pbl = shortest(pblCandidates(), afterOll, isSolved2);
  if (!pbl) throw new Error("Caso de PBL no reconocido.");

  return [
    {
      title: "Paso 1 · Primera cara",
      caseName: `color ${colorName(bottom)}`,
      explanation:
        `Forma abajo una cara entera de color ${colorName(bottom)}; los lados todavía no tienen que coincidir. Es la cara que se consigue con menos movimientos.` +
        rotationNote(first.rotation, bottom, "la cara"),
      moves: step1,
    },
    {
      title: "Paso 2 · OLL",
      caseName: oll.moves.length ? `caso ${oll.name}` : "ya orientada",
      explanation: oll.moves.length
        ? `Orienta la capa de arriba: al terminar, toda la cara de arriba es de color ${colorName(top)} (la de abajo sigue siendo de color ${colorName(bottom)}).${oll.auf ? " El primer giro de U coloca el caso como en el algoritmo." : ""}`
        : `La cara de arriba ya es toda de color ${colorName(top)}: este paso no necesita movimientos.`,
      moves: oll.moves,
    },
    {
      title: "Paso 3 · PBL",
      caseName: pbl.name
        ? `caso ${pbl.name}${pbl.flipped ? " (dando la vuelta al cubo)" : ""}`
        : pbl.moves.length
          ? "solo ajustar U y D"
          : "ya resuelto",
      explanation: pbl.name
        ? `Coloca las esquinas de arriba y de abajo en su sitio (intercambio: ${pblName}) y ajusta U y D: el cubo queda resuelto.${pbl.flipped ? " Empieza con x2: el intercambio que falta está abajo, así que se da la vuelta al cubo para hacerlo arriba." : ""}`
        : pbl.moves.length
          ? "Las esquinas ya están bien colocadas entre sí: solo falta girar U o D para terminar."
          : "Las esquinas ya están en su sitio: el cubo está resuelto.",
      moves: pbl.moves,
    },
  ];
}

function cllSteps(facelets: readonly CubeColor[]): SolutionStep[] {
  const first = bestFirstStep(facelets, firstLayerLength, solveFirstLayer);
  const step1 = [...first.rotation, ...first.moves];
  const afterLayer = applyMoves2(facelets, step1);
  const cll = shortest(cllCandidates(), afterLayer, isSolved2);
  if (!cll) throw new Error("Caso de CLL no reconocido.");
  const top = OPPOSITE_COLOR[first.color];

  return [
    {
      title: "Paso 1 · Primera capa",
      caseName: `color ${colorName(first.color)}`,
      explanation:
        `Completa la capa de abajo: su cara entera de color ${colorName(first.color)} y los lados de cada esquina coincidiendo con sus vecinas.` +
        rotationNote(first.rotation, first.color, "la capa"),
      moves: step1,
    },
    {
      title: "Paso 2 · CLL",
      caseName: cll.name ? `caso ${cll.name}` : "solo ajustar U",
      explanation: cll.name
        ? `Orienta y coloca a la vez las cuatro esquinas de arriba (las de color ${colorName(top)} arriba), con el giro de U antes y después que haga falta: el cubo queda resuelto.`
        : "Las esquinas de arriba ya están bien entre sí: basta con girar U para terminar.",
      moves: cll.moves,
    },
  ];
}

/**
 * Solves a valid 2×2 (its 24 stickers) with the chosen method. Throws if
 * the stickers are not a real cube, or — which the tests rule out — if
 * the result did not survive the 3D-engine check.
 */
export function solve2x2(facelets: readonly CubeColor[], method: Method2x2): Solution2x2 {
  const parsed = parseFacelets2([...facelets]);
  if (!parsed.ok) throw new Error(parsed.error);
  const steps =
    method === "optimal" ? optimalSteps(facelets) : method === "ortega" ? ortegaSteps(facelets) : cllSteps(facelets);
  const moves = steps.flatMap((step) => step.moves);
  if (!cubeStateForSolution2(facelets, moves)) {
    throw new Error("La solución calculada no resuelve el cubo.");
  }
  return { method, steps, moves };
}

/** Face turns only (rotations are not moves of a layer), for counts shown to the user. */
export const countTurns = (moves: Move[]) => moves.filter((move) => !isRotation(move)).length;
