/**
 * Aprender del 3×3: Roux, taught from research (Speedsolving Wiki and
 * SpeedCubeDB), held like the sheets: yellow up, white down, green front.
 *
 * - The two blocks are intuitive: their cases are the basic ones, each
 *   solved by the shortest sequence RUBIKO's engine finds with the moves
 *   the step allows (as Petrus and ZZ, cases-3x3-research.ts).
 * - CMLL: SpeedCubeDB's first algorithm of each of its 42 cases.
 * - LSE (the last six edges, with M and U only): every algorithm is the
 *   shortest the engine finds, and the tests check the cases are every
 *   one the engine counts — 11 for the orientation (4a), 7 for the left
 *   and right edges (4b; the engine finds 4 shapes, but 3 of them need a
 *   different algorithm depending on which edge is where) and 11 for the
 *   M layer (4c).
 */
import type { CubeState, Vec3 } from "@/features/cube/types";
import type { ResearchSource } from "@/features/pyraminx/research";
import type { AlgorithmCase } from "./algorithm-sets";
import {
  EDGE,
  FAMILY,
  PAIR,
  headlights,
  id,
  joinSpanish,
  stepCases,
  type StepCaseDef,
} from "./cases-3x3-research";
import { caseState3, edgeIsGood, facelets3, heldLike, locatePiece, pieceLabel, placeName, sticker3 } from "./cube3";

export const SOURCES_ROUX = {
  speedsolvingRoux: {
    name: "Speedsolving Wiki · Roux method",
    url: "https://www.speedsolving.com/wiki/index.php?title=Roux_method",
  },
  speedcubedbCmll: {
    name: "SpeedCubeDB · CMLL",
    url: "https://speedcubedb.com/a/3x3/CMLL",
  },
  speedsolvingLse: {
    name: "Speedsolving Wiki · Last Six Edges",
    url: "https://www.speedsolving.com/wiki/index.php?title=Last_Six_Edges",
  },
} satisfies Record<string, ResearchSource>;

export type RouxSetId = "roux-bloque1" | "roux-bloque2" | "roux-cmll" | "roux-eo" | "roux-ulur" | "roux-capa-m";

// ---------- the blocks ----------

const has = (...pieces: Vec3[]) => (p: Vec3) => pieces.some((q) => q[0] === p[0] && q[1] === p[1] && q[2] === p[2]);

/** The first block: the left third of the first two layers (1×2×3), with the red center. */
export const FIRST_BLOCK = (p: Vec3) => p[0] === -1 && p[1] <= 0;
/** Both blocks: the first two layers but the middle layer, which stays free for LSE. */
export const BOTH_BLOCKS = (p: Vec3) => p[0] !== 0 && p[1] <= 0;

const DL: Vec3 = [-1, -1, 0];
const DBL: Vec3 = [-1, -1, -1];
const BL: Vec3 = [-1, 0, -1];
const DFL: Vec3 = [-1, -1, 1];
const FL: Vec3 = [-1, 0, 1];
const DR: Vec3 = [1, -1, 0];
const DBR: Vec3 = [1, -1, -1];
const BR: Vec3 = [1, 0, -1];
const DFR: Vec3 = [1, -1, 1];
const FR: Vec3 = [1, 0, 1];

const FB_EDGE = has(DL, [-1, 0, 0]);
const FB_BACK = (p: Vec3) => FB_EDGE(p) || (p[0] === -1 && p[1] <= 0 && p[2] <= 0);
const SB_EDGE = (p: Vec3) => FIRST_BLOCK(p) || has(DR, [1, 0, 0])(p);
const SB_BACK = (p: Vec3) => SB_EDGE(p) || (p[0] === 1 && p[1] <= 0 && p[2] <= 0);

/** The moves each block allows: the first is built freely, the second never touches the first. */
export const ROUX_BLOCK_MOVES = { first: ["L", "U", "F", "B"], second: ["R", "U", "M", "r"] };

const first = (algorithm: string, pieces: Vec3[], goal: (p: Vec3) => boolean, keyColors: StepCaseDef["keyColors"]): StepCaseDef => ({
  algorithm,
  pieces,
  goal,
  does: pieces.length === 1 ? EDGE : PAIR,
  keyColors,
  moves: ROUX_BLOCK_MOVES.first,
});

const second = (algorithm: string, pieces: Vec3[], goal: (p: Vec3) => boolean, keyColors: StepCaseDef["keyColors"]): StepCaseDef => ({
  ...first(algorithm, pieces, goal, keyColors),
  moves: ROUX_BLOCK_MOVES.second,
});

/** Paso 1: the white-red edge with its center, then the back pair, then the front pair. */
export const ROUX_FIRST_BLOCK: StepCaseDef[] = [
  ...["L2", "L'", "L"].map((algorithm) => first(algorithm, [DL], FB_EDGE, ["white"])),
  ...["L U L'", "B' U' B", "L' B L B'"].map((algorithm) => first(algorithm, [DBL, BL], FB_BACK, ["white", "blue"])),
  ...["L' U' L", "F U F'", "L F' L' F", "F2 L F L' F'"].map((algorithm) =>
    first(algorithm, [DFL, FL], FIRST_BLOCK, ["white", "green"]),
  ),
];

/** Paso 2: the same on the right with R, U, M and r — M brings the white-orange edge up from the middle layer. */
export const ROUX_SECOND_BLOCK: StepCaseDef[] = [
  ...["R2", "R'", "M2 U' R2", "M U' R2", "M' U' R2"].map((algorithm) => second(algorithm, [DR], SB_EDGE, ["white"])),
  ...["R' U' R", "U' R' U R", "r' U' R", "R2 U' R' U R2"].map((algorithm) =>
    second(algorithm, [DBR, BR], SB_BACK, ["white", "blue"]),
  ),
  ...["R U R'", "U R U' R'", "r U R'", "M' U R M U R'", "R U2 R' U' R U R'"].map((algorithm) =>
    second(algorithm, [DFR, FR], BOTH_BLOCKS, ["white", "green"]),
  ),
];

// ---------- CMLL ----------

/** SpeedCubeDB's CMLL, the first algorithm of each case, with its name. */
export const CMLL_ALGORITHMS: { name: string; algorithm: string }[] = [
  { name: "O Adjacent", algorithm: "R U R' F' R U R' U' R' F R2 U' R'" },
  { name: "O Diagonal", algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { name: "H Columns", algorithm: "U R U R' U R U' R' U R U2 R'" },
  { name: "H Rows", algorithm: "F R U R' U' R U R' U' R U R' U' F'" },
  { name: "H Column", algorithm: "R' F2 D R2 U R2 D' F2 R" },
  { name: "H Row", algorithm: "U2 r U' r2 D' r U' r' D r2 U r'" },
  { name: "Pi Right Bar", algorithm: "F R U R' U' R U R' U' F'" },
  { name: "Pi Down Slash", algorithm: "U F R' F' R U2 R U' R' U R U2 R'" },
  { name: "Pi X", algorithm: "R' F2 D R2 U' R2 D' F2 R" },
  { name: "Pi Up Slash", algorithm: "R U2 R' U' R U R' U2 R' F R F'" },
  { name: "Pi Columns", algorithm: "U' r U' r2 D' r U r' D r2 U r'" },
  { name: "Pi Left Bar", algorithm: "U' R' U' R' F R F' R U' R' U2 R" },
  { name: "U Up Slash", algorithm: "U2 R2 D R' U2 R D' R' U2 R'" },
  { name: "U Down Slash", algorithm: "R2 D' R U2 R' D R U2 R" },
  { name: "U Bottom Row", algorithm: "R' U' R U' R' U2 R2 U R' U R U2 R'" },
  { name: "U Rows", algorithm: "U' F R2 D R' U R D' R2 U' F'" },
  { name: "U X", algorithm: "U2 r U' r' U r' D' r U' r' D r" },
  { name: "U Upper Row", algorithm: "U' F R U R' U' F'" },
  { name: "T Left Bar", algorithm: "U' R U R' U' R' F R F'" },
  { name: "T Right Bar", algorithm: "U L' U' L U L F' L' F" },
  { name: "T Rows", algorithm: "R U2 R' U' R U' R2 U2 R U R' U R" },
  { name: "T Bottom Row", algorithm: "r' U r U2 R2 F R F' R" },
  { name: "T Top Row", algorithm: "r' D' r U r' D r U' r U r'" },
  { name: "T Columns", algorithm: "U2 r U' r2 D' r U2 r' D r2 U r'" },
  { name: "Sune Left Bar", algorithm: "U R U R' U R U2 R'" },
  { name: "Sune X", algorithm: "U L' U2 L U2 r U' r' F" },
  { name: "Sune Up Slash", algorithm: "U F R' F' R U2 R U2 R'" },
  { name: "Sune Columns", algorithm: "U R U R' U' R' F R F' R U R' U R U2 R'" },
  { name: "Sune Right Bar", algorithm: "U' R U R' U R' F R F' R U2 R'" },
  { name: "Sune Down Slash", algorithm: "U r U' r' F R' F' R" },
  { name: "Anti Sune Right Bar", algorithm: "U R' U' R U' R' U2 R" },
  { name: "Anti Sune Columns", algorithm: "U2 R U R2 F' r F R U' r2 F r" },
  { name: "Anti Sune Down Slash", algorithm: "U' F' L F L' U2 L' U2 L" },
  { name: "Anti Sune X", algorithm: "U' R U2 R' U2 R' F R F'" },
  { name: "Anti Sune Up Slash", algorithm: "U' R' F R F' r U r'" },
  { name: "Anti Sune Left Bar", algorithm: "U R U2 R' F R' F' R U' R U' R'" },
  { name: "L Best", algorithm: "U' F' r U r' U' r' F r" },
  { name: "L Good", algorithm: "U2 F R' F' R U R U' R'" },
  { name: "L Pure", algorithm: "R U R' U R U' R' U R U' R' U R U2 R'" },
  { name: "L Front Commutator", algorithm: "U2 R U2 R D R' U2 R D' R2" },
  { name: "L Diagonal", algorithm: "U2 R U2 R2 F R F' R U2 R'" },
  { name: "L Back Commutator", algorithm: "U R' U2 R' D' R U2 R' D R2" },
];

/** The corner shape of a CMLL case, from the start of its name. */
export const cmllFamily = (name: string) =>
  name.startsWith("Anti Sune") ? "AS" : name.startsWith("Sune") ? "S" : name.split(" ")[0];

function cmllExplanation(name: string, algorithm: string): string {
  const lights = headlights(heldLike(caseState3(algorithm)));
  const lightsText =
    lights.length === 0
      ? "Ningún lado tiene faros (sus dos esquinas de arriba del mismo color, que no sea amarillo)."
      : lights.length === 4
        ? "Los cuatro lados tienen faros: las esquinas ya están en su sitio entre ellas."
        : `Faros (las dos esquinas de un lado con el mismo color, que no sea amarillo): ${joinSpanish(lights)}.`;
  const pre = /^U['2]? /.test(algorithm) ? " El giro de U del principio lo deja como lo usa el algoritmo." : "";
  return `Forma de ${FAMILY[cmllFamily(name)]}. ${lightsText} Gira U hasta verlo como en el diagrama.${pre} El algoritmo orienta y coloca las cuatro esquinas sin romper los dos bloques; las aristas de arriba y de la capa M pueden moverse, porque las coloca LSE.`;
}

// ---------- LSE ----------

/** The six edges of LSE: the four on top and the two of the M layer at the bottom. */
export const LSE_EDGES: Vec3[] = [
  [0, 1, 1],
  [1, 1, 0],
  [0, 1, -1],
  [-1, 1, 0],
  [0, -1, 1],
  [0, -1, -1],
];

/** LSE 4a: the 11 edge-orientation cases, each the shortest the engine finds with M and U. */
export const ROUX_EO_ALGORITHMS = [
  "M U M",
  "M' U M",
  "M2 U' M' U M",
  "M U M U' M' U M",
  "M U M' U M U M",
  "M U M U M' U M",
  "M U M' U' M U M",
  "M' U' M U2 M' U M",
  "M U2 M U2 M' U M",
  "M U2 M U2 M U M",
  "M U M U M' U M U2 M U M",
];

/**
 * LSE 4b: the yellow-red and yellow-orange edges (the 7 cases), each the
 * shortest with M and U. The last U lines them up with the corners, so it
 * depends on how the corners were left.
 */
export const ROUX_ULUR_ALGORITHMS = [
  "M2 U'",
  "M' U2 M' U'",
  "M U2 M' U'",
  "M' U2 M U'",
  "M U2 M U'",
  "M2 U' M' U2 M' U'",
  "M2 U M' U2 M' U'",
];

/** LSE 4c: the 11 ways the M layer can be, with the yellow center on top; each the shortest with M and U. */
export const ROUX_M_ALGORITHMS = [
  "U2 M U2 M'",
  "U2 M' U2 M",
  "M U2 M' U2",
  "M' U2 M U2",
  "M2 U2 M2 U2",
  "M U2 M2 U2 M",
  "M2 U2 M U2 M",
  "M2 U2 M' U2 M'",
  "M U2 M U2 M2",
  "M' U2 M' U2 M2",
  "U2 M U2 M2 U2 M U2",
];

const isBad = (state: CubeState, edge: Vec3) => !edgeIsGood(state, edge);

function eoExplanation(algorithm: string): string {
  const state = caseState3(algorithm);
  const bad = LSE_EDGES.filter((edge) => isBad(state, edge)).map(placeName);
  const top = facelets3(state)[sticker3("U", 4)] === "yellow" ? "amarillo" : "blanco";
  return `${bad.length} aristas malas: ${joinSpanish(bad)}. El centro de arriba es el ${top}. Gira U hasta verlo como en el diagrama. El algoritmo las orienta todas y deja los centros arriba y abajo; los giros de M dan la vuelta a las aristas de la capa M, y los de U eligen cuáles están allí.`;
}

const UL: Vec3 = [-1, 1, 0];
const UR: Vec3 = [1, 1, 0];

/** "la arista amarilla-roja está abajo delante". */
function whereIs(state: CubeState, home: Vec3): string {
  return `${pieceLabel(home)} está ${placeName(locatePiece(state, home).position)}`;
}

function ulurExplanation(algorithm: string): string {
  const state = caseState3(algorithm);
  return `${capitalize(whereIs(state, UL))}, y ${whereIs(state, UR)}. El algoritmo las sube juntas a la capa de arriba, una enfrente de la otra, y el último giro de U las deja a la izquierda y a la derecha, junto a sus esquinas: si en tu cubo las esquinas están giradas de otra forma, cambia ese último giro.`;
}

const M_LAYER: Vec3[] = [
  [0, 1, 1],
  [0, 1, -1],
  [0, -1, 1],
  [0, -1, -1],
];

function mExplanation(algorithm: string): string {
  const state = caseState3(algorithm);
  const moved = M_LAYER.filter((home) => !locatePiece(state, home).home).map((home) => whereIs(state, home));
  return `Con el amarillo arriba: ${joinSpanish(moved)}. Las demás ya están en su sitio. El algoritmo solo usa M y U2, así que la izquierda y la derecha no se mueven.`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// ---------- the cases as Aprender shows them ----------

export const ROUX_FIRST_BLOCK_CASES = stepCases("roux-bloque1", ROUX_FIRST_BLOCK, SOURCES_ROUX.speedsolvingRoux);
export const ROUX_SECOND_BLOCK_CASES = stepCases("roux-bloque2", ROUX_SECOND_BLOCK, SOURCES_ROUX.speedsolvingRoux);

export const ROUX_CMLL_CASES: AlgorithmCase[] = CMLL_ALGORITHMS.map(({ name, algorithm }, index) => ({
  setId: "roux-cmll",
  id: id(index),
  number: index + 1,
  name,
  algorithm,
  image: `/learning/roux-cmll/roux-cmll-${id(index)}.svg`,
  explanation: cmllExplanation(name, algorithm),
  research: SOURCES_ROUX.speedcubedbCmll,
}));

const LSE_NOTE =
  "Calculado por RUBIKO: es el más corto que encuentra su motor con M y U, los únicos giros de LSE, que no tocan los bloques.";

function lseCases(setId: "roux-eo" | "roux-ulur" | "roux-capa-m", algorithms: string[], explain: (algorithm: string) => string): AlgorithmCase[] {
  return algorithms.map((algorithm, index) => ({
    setId,
    id: id(index),
    number: index + 1,
    algorithm,
    image: `/learning/${setId}/${setId}-${id(index)}.svg`,
    explanation: explain(algorithm),
    note: LSE_NOTE,
    research: SOURCES_ROUX.speedsolvingLse,
  }));
}

export const ROUX_EO_CASES = lseCases("roux-eo", ROUX_EO_ALGORITHMS, eoExplanation);
export const ROUX_ULUR_CASES = lseCases("roux-ulur", ROUX_ULUR_ALGORITHMS, ulurExplanation);
export const ROUX_M_CASES = lseCases("roux-capa-m", ROUX_M_ALGORITHMS, mExplanation);

export const SETS_ROUX: Record<RouxSetId, AlgorithmCase[]> = {
  "roux-bloque1": ROUX_FIRST_BLOCK_CASES,
  "roux-bloque2": ROUX_SECOND_BLOCK_CASES,
  "roux-cmll": ROUX_CMLL_CASES,
  "roux-eo": ROUX_EO_CASES,
  "roux-ulur": ROUX_ULUR_CASES,
  "roux-capa-m": ROUX_M_CASES,
};
