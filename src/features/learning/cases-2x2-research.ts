/**
 * Aprender del 2×2: the methods taught from research (not from the user's
 * sheets) — EG for now. Every case says where it comes from on its card
 * («Investigado»).
 *
 * EG solves the whole cube in one algorithm once the first face is done:
 * CLL if the bottom layer is already right, EG-1 if two neighbouring
 * bottom corners are swapped, EG-2 if two diagonal ones are. The tests
 * check every algorithm with RUBIKO's engine: the bottom it expects, the
 * top shape of its name, and that each set is every case the engine
 * counts (43, as the Speedsolving Wiki says).
 */
import { invertMoves, type Move } from "@/features/cube/moves";
import type { CubeColor } from "@/features/cube/types";
import type { ResearchSource } from "@/features/pyraminx/research";
import { parseAlgorithm } from "@/features/solver2x2/algorithm";
import { ORTEGA_PBL } from "@/features/solver2x2/algorithms";
import { layerSwap } from "@/features/solver2x2/case-check";
import { faceOffset2 } from "@/features/solver2x2/facelets";
import { ORIENTATIONS, applyMoves2, solvedFacelets2 } from "@/features/solver2x2/sticker-moves";
import type { AlgorithmCase } from "./algorithm-sets";
import { CLL_GROUPS, CLL_LEARN_CASES, PRIMERA_CARA_CASES, SHEET_FRAME } from "./cases-2x2";

export const SOURCES_2X2 = {
  speedsolvingEG: {
    name: "Speedsolving Wiki · EG Method",
    url: "https://www.speedsolving.com/wiki/index.php?title=EG_Method",
  },
  speedcubedbEG1: {
    name: "SpeedCubeDB · EG-1",
    url: "https://speedcubedb.com/a/2x2/EG1",
  },
  speedcubedbEG2: {
    name: "SpeedCubeDB · EG-2",
    url: "https://speedcubedb.com/a/2x2/EG2",
  },
} satisfies Record<string, ResearchSource>;

export type Research2x2SetId = "eg-cara" | "eg-cll" | "eg-1" | "eg-2";

/** Whether the first face is done: the bottom all white and no white on top. */
export const firstFaceDown = (facelets: readonly CubeColor[]) =>
  [0, 1, 2, 3].every((n) => facelets[faceOffset2("D") + n] === "white" && facelets[faceOffset2("U") + n] !== "white");

/**
 * The case an algorithm solves, held as the algorithm starts (yellow up).
 * An algorithm that turns the whole cube may end with it held another way
 * — still solved — so the case is the algorithm undone from the solved
 * cube held the way that leaves the first face down when it starts.
 */
export function caseFacelets2(algorithm: string, done: (facelets: CubeColor[]) => boolean = firstFaceDown): CubeColor[] {
  const moves = invertMoves(parseAlgorithm(algorithm));
  const solved = applyMoves2(solvedFacelets2(), SHEET_FRAME);
  for (const hold of ORIENTATIONS) {
    const facelets = applyMoves2(applyMoves2(solved, hold), moves);
    if (done(facelets)) return facelets;
  }
  throw new Error(`«${algorithm}» no deja la primera cara abajo.`);
}

// ---------- EG-1 and EG-2 ----------

/** SpeedCubeDB's names: AS is Antisune and S, Sune. */
const GROUP: Record<string, string> = { AS: "Antisune", S: "Sune", H: "H", L: "L", Pi: "Pi", T: "T", U: "U" };

const named = (list: string): { name: string; algorithm: string }[] =>
  list
    .trim()
    .split("\n")
    .map((line) => {
      const [name, algorithm] = line.split(": ");
      const [group, n] = name.trim().split(" ");
      return { name: `${GROUP[group]} ${n}`, algorithm };
    });

/** SpeedCubeDB's EG-1, the first algorithm of each case. */
export const EG1_ALGORITHMS = named(`
AS 1: y U2 B U' R2 F2 U' F
AS 2: U R U' R' F' U' F2 R U' R'
AS 3: F' R U R' U' R U R2 F' R
AS 4: R U' R' F' U' R U R' U' F
AS 5: y' R U R' F' U' R U R' U' R U R'
AS 6: y2 R U' R2 F R U' R' F R F'
H 1: U' R' F R2 U' R' F R U R' F'
H 2: U' F' U R U' R2 F2 R U' F
H 3: U R' F R F' U2 F R U2 R' F
H 4: U' R U R' F' R U R' U' R U R' U'
L 1: y R U' R' U R U' R2 F' R F
L 2: y' U' R' F R U' R' F R2 U R' F' U2
L 3: y R' U R2 U' R2 U' F R2 U' R'
L 4: y R' F R2 U R' F' R U2 R'
L 5: y2 R U R' F' R U R' U' F R' F' R
L 6: y2 R' U2 F R U2 R U' R2 F
Pi 1: y2 U' F U' R' F R U' F2 R U R'
Pi 2: y' R U' R2 F R2 U' R'
Pi 3: y' F R' F U' F2 R U R
Pi 4: y' R U' R' U R U' R' F R U' R'
Pi 5: R U' R2 F R U R U' R' U' R' F R F'
Pi 6: U' R' F' R U' R' F R2 U R' F' R U R'
S 1: y2 U' L F' L2 U' L F U L' U L
S 2: R U R' F2 U F R U R'
S 3: y2 F R' F' R U R' F' R2 U R'
S 4: U F' R' F R2 U R' U' F R' F' R U
S 5: y R U' R' U R U' R' U F R U' R'
S 6: R' F R2 U' R' U R U' R' F
T 1: F R U' R2 F' R U R' F' R
T 2: F' R' F R2 U R' U' R U R'
T 3: y R U' R2 F R U R U2 R'
T 4: y' U2 R' F R F' U R U' R' U F R U' R'
T 5: y' R' F' R2 U R' F' R U R'
T 6: y' U' R U' R' U2 F R U2 R' F
U 1: y U2 R U R' U R U' R2 F' R2 U R' U
U 2: U2 y R' U R' U' R U' R' U' F2 R2
U 3: F' U2 R U2 R' U2 F
U 4: y R' F R F' R' F R2 U' R'
U 5: U2 R U' R' U R U' R' U' F R U' R'
U 6: y2 R' F R U' R' F R U' R U R' F' U2
`);

/** SpeedCubeDB's EG-2, the first algorithm of each case. */
export const EG2_ALGORITHMS = named(`
AS 1: F R2 U R' U2 R U R2 U F'
AS 2: R' U' R U' R' U2 R' F2 R2
AS 3: U2 R' F R F' R U R B2 R2
AS 4: U2 F' L F L' U2 L' U2 L' B2 L2
AS 5: R' U' R U' R' U' R' F2 R F' R
AS 6: y2 R2 F2 R F R F' R U R'
H 1: R2 F U2 F2 R2 F' R2
H 2: y R2 B2 U2 R' U2 R2
H 3: R' U' R U2 R2 F' R U' F R
H 4: y' R U2 B2 R' U R U' B R'
L 1: U L2 B2 L U' L' U L F' L F
L 2: y2 F2 R2 F R U R' U' R' F R
L 3: y2 R2 U' R U2 R' U2 R U' F2 R2
L 4: y' R' U L' U2 R' F R U' R' U' F' x2
L 5: y F R' F' R U R U' R B2 R2
L 6: y2 F' R U R' U' R' F R' F2 R2
Pi 1: F U' R U2 R U' R' U R' F'
Pi 2: R U2 R2 U R' F2 R2 F'
Pi 3: U F R2 U' R2 U R2 U R2 F R2 F2 U2
Pi 4: y2 R' F R F' R U' R' U' R U' R F2 R2
Pi 5: U' R' F' R' F2 R2 U R' U2 R U
Pi 6: U R' U2 R U' R2 F2 R F R U'
S 1: R2 F2 R U R U' R' F R' F' R2 U R' U' R
S 2: R U R' U R U2 R B2 R2
S 3: R U' R' F R' F' R' F2 R2
S 4: F R' F' R U2 R U2 R B2 R2
S 5: R' U R' F R2 U' F R' F'
S 6: R2 B2 R' U' R' F R' F' R
T 1: U R' F' R U R U' R' F' R2 B2 U
T 2: y' F U' R2 U' R' U R2 F'
T 3: R' U R U2 R2 F' R U' R
T 4: R2 F2 R U' F R' F' R U R
T 5: y' R' U2 R U' R' F R' F R F' R
T 6: y R' U2 R' F2 R F2 R
U 1: R2 U2 R U R' U F' R U' R
U 2: y' F R U R' U' F R2 B2
U 3: R' F' U' R U2 R' U F R
U 4: R' F' U' F U2 L' U2 R U' L
U 5: y2 R2 B2 R' U R' U' R' F R F'
U 6: y2 R2 F2 R F' R U L F' L' F
`);

const pbl = (id: string) => ORTEGA_PBL.find((kase) => kase.id === id)!;

/** The same PBL with the cube turned over first (x2) and back at the end: it swaps the other layer. */
const upsideDown = (algorithm: string) => `x2 ${algorithm} x2`;

/**
 * The three cases with the top already oriented: the PBL of Ortega that
 * leaves the same bottom (turned over with x2 where Ortega's has the swap
 * on the other layer).
 */
const EG1_PBL = [
  { name: "Arriba bien", algorithm: upsideDown(pbl("adj").algorithm), from: pbl("adj").name, turned: true },
  { name: "Adyacente arriba", algorithm: pbl("adj-adj").algorithm, from: pbl("adj-adj").name, turned: false },
  { name: "Diagonal arriba", algorithm: upsideDown(pbl("adj-diag").algorithm), from: pbl("adj-diag").name, turned: true },
];

const EG2_PBL = [
  { name: "Arriba bien", algorithm: upsideDown(pbl("diag").algorithm), from: pbl("diag").name, turned: true },
  { name: "Adyacente arriba", algorithm: pbl("adj-diag").algorithm, from: pbl("adj-diag").name, turned: false },
  { name: "Diagonal arriba", algorithm: pbl("diag-diag").algorithm, from: pbl("diag-diag").name, turned: false },
];

const SIDE_NAME: Record<"F" | "R" | "B" | "L", string> = { F: "delante", R: "a la derecha", B: "detrás", L: "a la izquierda" };

/** Sides of a layer whose two stickers match. */
function bars(facelets: readonly CubeColor[], row: 0 | 2): ("F" | "R" | "B" | "L")[] {
  return (["F", "R", "B", "L"] as const).filter((side) => facelets[faceOffset2(side) + row] === facelets[faceOffset2(side) + row + 1]);
}

function bottomText(facelets: readonly CubeColor[]): string {
  const swap = layerSwap(facelets, "bottom");
  if (swap === "solved") return "Abajo, todo está bien.";
  if (swap === "diag") return "Abajo hay dos esquinas en diagonal cambiadas: ningún lado tiene sus dos pegatinas de abajo iguales.";
  return `Abajo hay dos esquinas vecinas cambiadas: el lado con sus dos pegatinas de abajo iguales (la barra) está ${SIDE_NAME[bars(facelets, 2)[0]]}.`;
}

function topText(facelets: readonly CubeColor[], group: string): string {
  if (group !== "Orientada") return CLL_GROUPS[group];
  const swap = layerSwap(facelets, "top");
  const what = swap === "solved" ? "y ya están en su sitio entre ellas" : swap === "adj" ? "y hay dos vecinas cambiadas" : "y hay dos en diagonal cambiadas";
  return `Las cuatro esquinas de arriba ya tienen el amarillo arriba ${what}.`;
}

function egExplanation(algorithm: string, group: string): string {
  const facelets = caseFacelets2(algorithm);
  const parts = [topText(facelets, group), bottomText(facelets)];
  parts.push("Gira U y D (o todo el cubo) hasta verlo como en el diagrama: el algoritmo resuelve las dos capas a la vez.");
  const rotation = parseAlgorithm(algorithm).find((move: Move) => "xyz".includes(move[0]));
  if (rotation && !algorithm.startsWith("x2 ")) parts.push(`Lleva ${rotation}, un giro de todo el cubo.`);
  parts.push("Al terminar, gira U y D si hace falta para alinearlas.");
  return parts.join(" ");
}

const id = (index: number) => String(index + 1).padStart(2, "0");

function egCases(setId: "eg-1" | "eg-2", algorithms: { name: string; algorithm: string }[], pbls: typeof EG1_PBL, source: ResearchSource): AlgorithmCase[] {
  return [
    ...algorithms.map(({ name, algorithm }) => ({ name, algorithm, group: name.split(" ")[0], research: source, note: undefined })),
    ...pbls.map(({ name, algorithm, from, turned }) => ({
      name,
      algorithm,
      group: "Orientada",
      research: SOURCES_2X2.speedsolvingEG,
      note: `Es la PBL «${from}» de Ortega${turned ? ", con el cubo dado la vuelta (x2) al principio y al final: así cambia la capa de abajo en vez de la de arriba" : ""}.`,
    })),
  ].map(({ group, note, ...kase }, index) => ({
    setId,
    id: id(index),
    number: index + 1,
    ...kase,
    image: `/learning/${setId}/${setId}-${id(index)}.svg`,
    explanation: egExplanation(kase.algorithm, group),
    ...(note ? { note } : {}),
  }));
}

export const EG_CARA_CASES: AlgorithmCase[] = PRIMERA_CARA_CASES.map((kase) => ({
  ...kase,
  setId: "eg-cara",
  note: `${kase.note} Es el mismo paso que en Ortega.`,
}));

export const EG_CLL_CASES: AlgorithmCase[] = CLL_LEARN_CASES.map((kase) => ({
  ...kase,
  setId: "eg-cll",
  note: kase.note ? `${kase.note} Es la CLL del método CLL.` : "El mismo algoritmo y diagrama que en el método CLL.",
}));

export const EG1_CASES = egCases("eg-1", EG1_ALGORITHMS, EG1_PBL, SOURCES_2X2.speedcubedbEG1);
export const EG2_CASES = egCases("eg-2", EG2_ALGORITHMS, EG2_PBL, SOURCES_2X2.speedcubedbEG2);

export const SETS_2X2_RESEARCH: Record<Research2x2SetId, AlgorithmCase[]> = {
  "eg-cara": EG_CARA_CASES,
  "eg-cll": EG_CLL_CASES,
  "eg-1": EG1_CASES,
  "eg-2": EG2_CASES,
};
