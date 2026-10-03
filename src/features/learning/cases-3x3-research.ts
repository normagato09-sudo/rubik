/**
 * Aprender del 3×3: the methods taught from research (not from the user's
 * sheets) — Petrus for now. Every case says where it comes from on its card
 * («Investigado»). The intuitive steps (blocks, edge orientation, the rest
 * of F2L) have no algorithm sheet: their cases are the basic ones, each
 * solved by the shortest sequence RUBIKO's engine finds with the moves the
 * step allows (the tests check that nothing shorter exists).
 *
 * Held like the sheets: yellow up, white down, green front, so orange is
 * on the right and red on the left. Diagrams are drawn from the case
 * itself (generated-diagrams-3x3.ts) and the explanations are worked out
 * from its stickers.
 */
import type { CubeState, Vec3 } from "@/features/cube/types";
import type { ResearchSource } from "@/features/pyraminx/research";
import type { AlgorithmCase } from "./algorithm-sets";
import {
  caseState3,
  describePiece,
  edgeIsGood,
  facelets3,
  placeName,
  sticker3,
} from "./cube3";
import { PLL_CASES } from "./pll-cases";

export const SOURCES_3X3 = {
  speedsolvingPetrus: {
    name: "Speedsolving Wiki · Petrus Method",
    url: "https://www.speedsolving.com/wiki/index.php?title=Petrus_Method",
  },
  speedsolvingColl: {
    name: "Speedsolving Wiki · COLL",
    url: "https://www.speedsolving.com/wiki/index.php/COLL",
  },
  speedcubedbColl: {
    name: "SpeedCubeDB · COLL",
    url: "https://speedcubedb.com/a/3x3/COLL",
  },
} satisfies Record<string, ResearchSource>;

export type Research3x3SetId =
  | "petrus-222"
  | "petrus-223"
  | "petrus-eo"
  | "petrus-f2l"
  | "petrus-coll"
  | "petrus-epll";

/** The moves each intuitive step allows: they never break what is already built. */
export const STEP_MOVES: Record<"petrus-222" | "petrus-223" | "petrus-eo" | "petrus-f2l", string[]> = {
  "petrus-222": ["U", "L", "F"],
  "petrus-223": ["U", "B", "R"],
  "petrus-eo": ["R", "U", "F"],
  "petrus-f2l": ["R", "U"],
};

// ---------- the pieces of each block ----------

/** Petrus's 2×2×2 block, here at the bottom front left: white-green-red corner, its three edges and centers. */
export const BLOCK_222 = (p: Vec3) => p[0] <= 0 && p[1] <= 0 && p[2] >= 0;
/** The 2×2×3 block: the left two thirds of the first two layers. */
export const BLOCK_223 = (p: Vec3) => p[0] <= 0 && p[1] <= 0;
/** The first two layers. */
export const F2L = (p: Vec3) => p[1] <= 0;

const DFL: Vec3 = [-1, -1, 1];
const FL: Vec3 = [-1, 0, 1];
const DB: Vec3 = [0, -1, -1];
const DBL: Vec3 = [-1, -1, -1];
const BL: Vec3 = [-1, 0, -1];
const DR: Vec3 = [1, -1, 0];
const DBR: Vec3 = [1, -1, -1];
const BR: Vec3 = [1, 0, -1];
const DFR: Vec3 = [1, -1, 1];
const FR: Vec3 = [1, 0, 1];

/** The seven edges still free after the 2×2×3: the four on top and the three on the right. */
export const FREE_EDGES: Vec3[] = [
  [0, 1, 1],
  [1, 1, 0],
  [0, 1, -1],
  [-1, 1, 0],
  FR,
  BR,
  DR,
];

/**
 * What each step's case must leave solved: the block it builds. For the
 * first cases of a step that builds in stages (an edge before a pair),
 * also which piece the case places.
 */
export interface StepCaseDef {
  algorithm: string;
  /** The pieces whose place and turn the case shows (they are colored in the diagram). */
  pieces: Vec3[];
  /** Region solved once the algorithm is done. */
  goal: (p: Vec3) => boolean;
  /** Sentence about what the case does, after the pieces are described. */
  does: string;
  /** Which color each piece's description follows. */
  keyColors: ("white" | "green" | "blue")[];
}

const PAIR = "El algoritmo junta las dos piezas y las mete en su hueco sin romper lo que ya está hecho.";
const EDGE = "El algoritmo la baja a su sitio sin romper lo que ya está hecho.";

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "La esquina … está …, con el blanco mirando …; la arista … ." */
function describePieces(state: CubeState, def: StepCaseDef): string {
  return `${cap(def.pieces.map((piece, i) => describePiece(state, piece, def.keyColors[i])).join("; "))}.`;
}

const either = (a: (p: Vec3) => boolean, ...pieces: Vec3[]) => (p: Vec3) =>
  a(p) || pieces.some((q) => q[0] === p[0] && q[1] === p[1] && q[2] === p[2]);

const PAIR_222 = (algorithm: string): StepCaseDef => ({
  algorithm,
  pieces: [DFL, FL],
  goal: BLOCK_222,
  does: PAIR,
  keyColors: ["white", "green"],
});

/** Paso 1: the last pair of the 2×2×2, with the white-red and white-green edges already in place. */
export const PETRUS_222: StepCaseDef[] = [
  PAIR_222("U' L' U L"),
  PAIR_222("U F U' F'"),
  PAIR_222("L' U L"),
  PAIR_222("F U' F'"),
];

/** Paso 2: first the white-blue edge, then the last pair. */
export const PETRUS_223: StepCaseDef[] = [
  {
    algorithm: "B2",
    pieces: [DB],
    goal: either(BLOCK_222, DB),
    does: EDGE,
    keyColors: ["white"],
  },
  {
    algorithm: "R B'",
    pieces: [DB],
    goal: either(BLOCK_222, DB),
    does: EDGE,
    keyColors: ["white"],
  },
  {
    algorithm: "B",
    pieces: [DB],
    goal: either(BLOCK_222, DB),
    does: EDGE,
    keyColors: ["white"],
  },
  {
    algorithm: "B' U' B",
    pieces: [DBL, BL],
    goal: BLOCK_223,
    does: PAIR,
    keyColors: ["white", "blue"],
  },
  {
    algorithm: "U' B' U B",
    pieces: [DBL, BL],
    goal: BLOCK_223,
    does: PAIR,
    keyColors: ["white", "blue"],
  },
];

/** Paso 4: the right side with R and U only — the white-orange edge, the back pair, the front pair. */
export const PETRUS_F2L: StepCaseDef[] = [
  {
    algorithm: "R2",
    pieces: [DR],
    goal: either(BLOCK_223, DR),
    does: EDGE,
    keyColors: ["white"],
  },
  {
    algorithm: "R",
    pieces: [DR],
    goal: either(BLOCK_223, DR),
    does: EDGE,
    keyColors: ["white"],
  },
  ...["R' U' R", "U' R' U R"].map(
    (algorithm): StepCaseDef => ({
      algorithm,
      pieces: [DBR, BR],
      goal: (p) => BLOCK_223(p) || (p[0] === 1 && p[1] <= 0 && p[2] <= 0),
      does: PAIR,
      keyColors: ["white", "blue"],
    }),
  ),
  ...["R U R'", "U R U' R'", "R U2 R' U' R U R'"].map(
    (algorithm): StepCaseDef => ({ algorithm, pieces: [DFR, FR], goal: F2L, does: PAIR, keyColors: ["white", "green"] }),
  ),
];

/** Paso 3: edge orientation. Every case is the shortest the engine finds with R, U and F. */
export const PETRUS_EO: { algorithm: string }[] = [
  { algorithm: "F R' F'" },
  { algorithm: "F R F'" },
  { algorithm: "F R2 F'" },
  { algorithm: "F' U F" },
  { algorithm: "F' U' F" },
  { algorithm: "F' U2 F" },
  { algorithm: "F R' F2 U' F" },
];

/** The free edges that are bad in `state`. */
export const badEdges = (state: CubeState) => FREE_EDGES.filter((edge) => !edgeIsGood(state, edge));

const joinSpanish = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;

function eoExplanation(algorithm: string): string {
  const bad = badEdges(caseState3(algorithm)).map(placeName);
  const how = algorithm.startsWith("F'")
    ? "F' sube la arista mala de delante a la derecha a arriba delante, el giro de U pone allí la otra arista mala y F lo devuelve todo: cada una ha pasado una vez por un cuarto de vuelta de F, y eso es lo que les da la vuelta."
    : algorithm.split(" ").length === 3
      ? "F lleva la arista mala de arriba delante a delante a la derecha, el giro de R pone allí la otra arista mala y F' lo devuelve todo: cada una ha pasado una vez por un cuarto de vuelta de F, y eso es lo que les da la vuelta."
      : "Son dos arreglos seguidos, F R' F' y F' U' F, con sus dos giros de F del medio juntos en F2.";
  return `${bad.length} aristas malas: ${joinSpanish(bad)}. ${how} El bloque 2×2×3 sale intacto.`;
}

// ---------- COLL ----------

/** COLL from SpeedCubeDB (first algorithm of each case), plus the two cases with the corners already turned. */
export const COLL_ALGORITHMS: { name: string; algorithm: string }[] = [
  { name: "H 1", algorithm: "R U R' U R U' R' U R U2 R'" },
  { name: "H 2", algorithm: "F R U' R' U R U2 R' U' R U R' U' F'" },
  { name: "H 3", algorithm: "R U R' U R U L' U R' U' L" },
  { name: "H 4", algorithm: "y F R U R' U' R U R' U' R U R' U' F'" },
  { name: "Pi 1", algorithm: "R U2 R2 U' R2 U' R2 U2 R" },
  { name: "Pi 2", algorithm: "y F U R U' R' U R U' R2 F' R U R U' R'" },
  { name: "Pi 3", algorithm: "R' U' F' R U R' U' R' F R2 U2 R' U2 R" },
  { name: "Pi 4", algorithm: "R U R' U' R' F R2 U R' U' R U R' U' F'" },
  { name: "Pi 5", algorithm: "R U' L' U R' U L U L' U L" },
  { name: "Pi 6", algorithm: "R' F' U' F U' R U S' R' U R S" },
  { name: "U 1", algorithm: "R' U' R U' R' U2 R2 U R' U R U2 R'" },
  { name: "U 2", algorithm: "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R" },
  { name: "U 3", algorithm: "y2 R2 D R' U2 R D' R' U2 R'" },
  { name: "U 4", algorithm: "F R U' R' U R U R' U R U' R' F'" },
  { name: "U 5", algorithm: "R2 D' R U2 R' D R U2 R" },
  { name: "U 6", algorithm: "R2 D' R U R' D R U R U' R' U' R" },
  { name: "T 1", algorithm: "R U2 R' U' R U' R2 U2 R U R' U R" },
  { name: "T 2", algorithm: "R' U R U2 R' L' U R U' L" },
  { name: "T 3", algorithm: "y R' F' r U R U' r' F" },
  { name: "T 4", algorithm: "y2 F R U R' U' R U' R' U' R U R' F'" },
  { name: "T 5", algorithm: "y' r U R' U' r' F R F'" },
  { name: "T 6", algorithm: "R' U R2 D r' U2 r D' R2 U' R" },
  { name: "L 1", algorithm: "y' R U R' U R U' R' U R U' R' U R U2 R'" },
  { name: "L 2", algorithm: "R' U2 R' D' R U2 R' D R2" },
  { name: "L 3", algorithm: "y R U2 R D R' U2 R D' R2" },
  { name: "L 4", algorithm: "y F R' F' r U R U' r'" },
  { name: "L 5", algorithm: "y2 F' r U R' U' r' F R" },
  { name: "L 6", algorithm: "y r U2 R2 F R F' R U2 r'" },
  { name: "S 1", algorithm: "R U R' U R U2 R'" },
  { name: "S 2", algorithm: "y2 R U R' U R2 D R' U2 R D' R2" },
  { name: "S 3", algorithm: "L' R U R' U' L U2 R U2 R'" },
  { name: "S 4", algorithm: "y' R U R' U R U' R D R' U' R D' R2" },
  { name: "S 5", algorithm: "R U' L' U R' U' L" },
  { name: "S 6", algorithm: "y2 R U R' F' R U R' U R U2 R' F R U' R'" },
  { name: "AS 1", algorithm: "y R U2 R' U' R U' R'" },
  { name: "AS 2", algorithm: "y2 R2 D R' U R D' R' U R' U' R U' R'" },
  { name: "AS 3", algorithm: "y2 R2 D R' U2 R D' R2 U' R U' R'" },
  { name: "AS 4", algorithm: "y2 R' U' R U' R2 D' R U2 R' D R2" },
  { name: "AS 5", algorithm: "y2 r' F R F' r U R'" },
  { name: "AS 6", algorithm: "R U' R' U2 R U' R' U2 R' D' R U R' D R" },
];

/** The two COLL cases with every corner already yellow up: the T and Y perms of the user's PLL sheet. */
const COLL_ORIENTED = [
  { name: "O adyacente", pll: "T" },
  { name: "O diagonal", pll: "Y" },
];

const FAMILY: Record<string, string> = {
  H: "H: ninguna esquina tiene el amarillo arriba, y los cuatro amarillos miran a dos lados opuestos, dos a cada lado",
  Pi: "Pi: ninguna esquina tiene el amarillo arriba; dos amarillos miran al mismo lado y los otros dos, a los lados de al lado",
  U: "U: dos esquinas vecinas tienen el amarillo arriba y las otras dos lo tienen hacia el mismo lado",
  T: "T: dos esquinas vecinas tienen el amarillo arriba y las otras dos lo tienen hacia lados contrarios, hacia fuera",
  L: "L: dos esquinas opuestas en diagonal tienen el amarillo arriba",
  S: "Sune: una sola esquina tiene el amarillo arriba y las otras tres lo tienen hacia los lados, giradas en un sentido",
  AS: "Antisune: una sola esquina tiene el amarillo arriba y las otras tres lo tienen hacia los lados, giradas en el sentido contrario al Sune",
  O: "O: las cuatro esquinas ya tienen el amarillo arriba",
};

const SIDES = [
  { name: "delante", face: "F" as const },
  { name: "a la derecha", face: "R" as const },
  { name: "detrás", face: "B" as const },
  { name: "a la izquierda", face: "L" as const },
];

/** Sides whose two top corners show the same color, not yellow ("faros"). */
export function headlights(state: CubeState): string[] {
  const facelets = facelets3(state);
  return SIDES.filter(({ face }) => {
    const [a, b] = [facelets[sticker3(face, 0)], facelets[sticker3(face, 2)]];
    return a === b && a !== "yellow";
  }).map(({ name }) => name);
}

function collExplanation(name: string, algorithm: string): string {
  const family = name.split(" ")[0];
  const lights = headlights(caseState3(algorithm));
  const lightsText =
    lights.length === 0
      ? "Ningún lado tiene faros (sus dos esquinas de arriba del mismo color, que no sea amarillo)."
      : lights.length === 4
        ? "Los cuatro lados tienen faros: las esquinas ya están en su sitio entre ellas."
        : `Faros (las dos esquinas de un lado con el mismo color, que no sea amarillo): ${joinSpanish(lights)}.`;
  return `Forma de ${FAMILY[family]}. ${lightsText} Gira U hasta verlo como en el diagrama. El algoritmo orienta y coloca las cuatro esquinas sin dar la vuelta a ninguna arista; las aristas que queden cambiadas las coloca la EPLL.`;
}

// ---------- EPLL ----------

/** The four PLL cases that only move edges, from the user's PLL sheet. */
const EPLL_NAMES = ["Ua", "Ub", "H", "Z"];

const EPLL_EXPLANATIONS: Record<string, string> = {
  Ua: "Las esquinas están bien y una arista también. El algoritmo mueve las otras tres una posición cada una, en sentido antihorario mirando desde arriba.",
  Ub: "Las esquinas están bien y una arista también. El algoritmo mueve las otras tres una posición cada una, en sentido horario mirando desde arriba.",
  H: "Las esquinas están bien y las aristas se cambian con la de enfrente: delante con detrás, izquierda con derecha.",
  Z: "Las esquinas están bien y las aristas se cambian con una de al lado, dos a dos.",
};

// ---------- the cases as Aprender shows them ----------

const id = (index: number) => String(index + 1).padStart(2, "0");

const COMPUTED_NOTE = (moves: string[]) =>
  `Calculado por RUBIKO: es el más corto que encuentra su motor con ${joinSpanish(moves)}, los giros que no rompen lo que ya está hecho.`;

function stepCases(setId: "petrus-222" | "petrus-223" | "petrus-f2l", defs: StepCaseDef[]): AlgorithmCase[] {
  return defs.map((def, index) => ({
    setId,
    id: id(index),
    number: index + 1,
    algorithm: def.algorithm,
    image: `/learning/${setId}/${setId}-${id(index)}.svg`,
    explanation: `${describePieces(caseState3(def.algorithm), def)} ${def.does}`,
    note: COMPUTED_NOTE(STEP_MOVES[setId]),
    research: SOURCES_3X3.speedsolvingPetrus,
  }));
}

export const PETRUS_222_CASES = stepCases("petrus-222", PETRUS_222);
export const PETRUS_223_CASES = stepCases("petrus-223", PETRUS_223);
export const PETRUS_F2L_CASES = stepCases("petrus-f2l", PETRUS_F2L);

export const PETRUS_EO_CASES: AlgorithmCase[] = PETRUS_EO.map(({ algorithm }, index) => ({
  setId: "petrus-eo",
  id: id(index),
  number: index + 1,
  algorithm,
  image: `/learning/petrus-eo/petrus-eo-${id(index)}.svg`,
  explanation: eoExplanation(algorithm),
  note: COMPUTED_NOTE(STEP_MOVES["petrus-eo"]),
  research: SOURCES_3X3.speedsolvingPetrus,
}));

const pll = (name: string) => PLL_CASES.find((kase) => kase.name === name)!;

export const PETRUS_COLL_CASES: AlgorithmCase[] = [
  ...COLL_ALGORITHMS.map(({ name, algorithm }) => ({ name, algorithm, research: SOURCES_3X3.speedcubedbColl })),
  ...COLL_ORIENTED.map(({ name, pll: perm }) => ({
    name,
    algorithm: pll(perm).algorithm,
    research: SOURCES_3X3.speedsolvingColl,
    note: `Es la ${perm} de tu hoja de PLL: con las esquinas ya orientadas, COLL solo tiene que colocarlas.`,
  })),
].map((kase, index) => ({
  setId: "petrus-coll",
  id: id(index),
  number: index + 1,
  ...kase,
  image: `/learning/petrus-coll/petrus-coll-${id(index)}.svg`,
  explanation: collExplanation(kase.name, kase.algorithm),
}));

export const PETRUS_EPLL_CASES: AlgorithmCase[] = EPLL_NAMES.map((name, index) => ({
  setId: "petrus-epll",
  id: id(index),
  number: index + 1,
  name,
  algorithm: pll(name).algorithm,
  image: pll(name).image,
  explanation: EPLL_EXPLANATIONS[name],
  note: `El mismo algoritmo y diagrama que la ${name} de tu hoja de PLL.`,
}));

export const SETS_3X3_RESEARCH: Record<Research3x3SetId, AlgorithmCase[]> = {
  "petrus-222": PETRUS_222_CASES,
  "petrus-223": PETRUS_223_CASES,
  "petrus-eo": PETRUS_EO_CASES,
  "petrus-f2l": PETRUS_F2L_CASES,
  "petrus-coll": PETRUS_COLL_CASES,
  "petrus-epll": PETRUS_EPLL_CASES,
};

