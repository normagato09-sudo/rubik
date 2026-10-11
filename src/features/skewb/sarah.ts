/**
 * Sarah Strong's Skewb method (sarah.cubing.net), the source of the three
 * methods Aprender teaches for the Skewb: the beginners', intermediate and
 * advanced variations. The algorithms are copied as the guides write them
 * — with their shorthand: S is the sledgehammer F' L F L', H the
 * hedgeslammer L F' L' F, and a letter in brackets says which face goes in
 * front on the left before starting ((g) green, (o) orange: y, (b) blue:
 * y2, (r) red: y').
 *
 * Held as in her guides: the first side (white) down, yellow on top, green
 * in front on the left and orange in front on the right, looking at the top
 * corner between them. Her F, R and L are the three top corners in sight
 * (features/skewb/moves.ts: UFR, UBR and UFL).
 */
import { SKEWB_FACES, type SkewbFace } from "./geometry";
import { applySarahTokens, applySkewbTurns, parseSarahAlgorithm, solvedSkewb, type SarahToken } from "./moves";
import type { CubeColor } from "@/features/cube/types";

export interface SarahSource {
  name: string;
  url: string;
}

export const SARAH_SOURCES = {
  method: { name: "Sarah's Cubing Site · Skewb, My Method", url: "https://sarah.cubing.net/skewb/my-method" },
  guide: { name: "Sarah's Cubing Site · Speedskewbin (guía imprimible)", url: "https://sarah.cubing.net/skewb/skewb-guide.pdf" },
  byCase: {
    name: "Sarah's Cubing Site · Advanced Variation, por casos",
    url: "https://sarah.cubing.net/skewb/advanced-variation-by-case.pdf",
  },
} satisfies Record<string, SarahSource>;

/** Solved, held as in Sarah's guides: white down, yellow up, green in front on the left. */
export const SARAH_SOLVED: CubeColor[] = applySkewbTurns(solvedSkewb(), [{ kind: "rotation", rotation: "z2" }]);

export const FACE_COLOR: Record<SkewbFace, CubeColor> = Object.fromEntries(
  SKEWB_FACES.map((face, f) => [face, SARAH_SOLVED[f * 5]]),
) as Record<SkewbFace, CubeColor>;

const BRACKET_ROTATION: Record<string, SarahToken | null> = { g: null, o: "y", b: "y2", r: "y'" };

/**
 * Writes one of the guides' algorithms out in full: "Sy2H (o)" becomes
 * "y F' L F L' y2 L F' L' F". Plain algorithms ("R' F R F' (y2) R' F R F'")
 * come back unchanged, but for their brackets; "(F' L F L')2" is repeated.
 */
export function expandSarah(text: string): string {
  const bracket = text.match(/\(([gobr])\)\s*$/);
  const body = bracket ? text.slice(0, bracket.index) : text;
  const repeated = body.replace(/\(([^()]*)\)2/g, "$1 $1").replace(/[()]/g, " ");
  const tokens: string[] = [];
  const pre = bracket ? BRACKET_ROTATION[bracket[1]] : null;
  if (pre) tokens.push(pre);
  for (const part of repeated.split(/\s+/).filter(Boolean)) {
    if (/^[FRL]'?$/.test(part) || /^[xyz](2|')?$/.test(part)) {
      tokens.push(part);
      continue;
    }
    // Shorthand: S, H and rotations written together ("Sy2Hy'S").
    const pieces = part.match(/S|H|[xyz](?:2|')?/g);
    if (!pieces || pieces.join("") !== part) throw new Error(`No se puede leer: ${part}`);
    for (const piece of pieces) {
      if (piece === "S") tokens.push("F'", "L", "F", "L'");
      else if (piece === "H") tokens.push("L", "F'", "L'", "F");
      else tokens.push(piece);
    }
  }
  return tokens.join(" ");
}

/**
 * Which face the guide calls "front" for x and z. Sarah writes that her
 * rotations are FCN's, but the guide uses two: the advanced variation's
 * z turns like the front-left face (green, F here), as RUBIKO does,
 * while the last centers of the beginners' variation ("do a z or z'",
 * and its x') only work — and only match her pictures, with white in
 * front on the left and yellow at the back on the right — if "front" is
 * the front-right face: her z is RUBIKO's x there, and her x is z'.
 */
export type SarahFrame = "front-left" | "front-right";

const FRONT_RIGHT: Partial<Record<SarahToken, SarahToken>> = { x: "z'", "x'": "z", x2: "z2", z: "x", "z'": "x'", z2: "x2" };

/** One of the guides' algorithms in RUBIKO's notation, move by move. */
export const sarahTokens = (text: string, frame: SarahFrame = "front-left"): SarahToken[] =>
  parseSarahAlgorithm(expandSarah(text)).map((token) => (frame === "front-right" ? (FRONT_RIGHT[token] ?? token) : token));

/** The same, as text: what the card shows. */
export const inRubikoNotation = (text: string, frame: SarahFrame = "front-left") => sarahTokens(text, frame).join(" ");

/** The first side: the white center and the four bottom corners (their three stickers each). */
export const FIRST_SIDE: number[] = [15, 16, 17, 18, 19, ...[1, 2, 4, 5].flatMap((f) => [f * 5 + 3, f * 5 + 4])];

/** The top corners' stickers: U 1–4 and the top two triangles of each side face. */
export const TOP_CORNERS: number[] = [1, 2, 3, 4, ...[1, 2, 4, 5].flatMap((f) => [f * 5 + 1, f * 5 + 2])];

export const CENTERS: number[] = [0, 5, 10, 15, 20, 25];

const key = (state: readonly CubeColor[]) => state.join();

/** The 24 ways of holding the solved Skewb (whole turns of it). */
export const ORIENTATIONS: CubeColor[][] = (() => {
  const found = new Map([[key(SARAH_SOLVED), SARAH_SOLVED]]);
  const queue = [SARAH_SOLVED];
  for (let head = 0; head < queue.length; head++) {
    for (const rotation of ["x", "y", "z"] as const) {
      const next = applySarahTokens(queue[head], [rotation]);
      if (!found.has(key(next))) {
        found.set(key(next), next);
        queue.push(next);
      }
    }
  }
  return queue;
})();

export const isSolvedAnyWay = (state: readonly CubeColor[]) => ORIENTATIONS.some((solved) => key(solved) === key(state));

const inverseToken = (token: SarahToken): SarahToken =>
  (token.endsWith("2") ? token : token.endsWith("'") ? token.slice(0, -1) : `${token}'`) as SarahToken;

export const invertSarah = (tokens: readonly SarahToken[]): SarahToken[] => [...tokens].reverse().map(inverseToken);

/**
 * The position an algorithm solves, held as in the guides (first side
 * down, in its place): the algorithm undone from the solved Skewb, held
 * however the algorithm leaves it. Null if it never keeps the first side.
 */
export function caseOf(tokens: readonly SarahToken[], goal: (state: CubeColor[]) => boolean = isSolvedAnyWay): CubeColor[] | null {
  const undo = invertSarah(tokens);
  for (const solved of ORIENTATIONS) {
    const state = applySarahTokens(solved, undo);
    if (FIRST_SIDE.every((i) => state[i] === SARAH_SOLVED[i]) && goal(applySarahTokens(state, tokens))) return state;
  }
  return null;
}

// ---------- the advanced variation: L2L, the last two layers at once ----------

/**
 * The 134 cases of the advanced variation as the by-case guide lists them:
 * by the top corners' shape (Pi or Peanut) and where the yellow center is,
 * 12 per group, and the last 5 centers (L5C). Exactly as written there, in
 * reading order; null where the guide has "-" (five sledgehammers or more:
 * "learn optimal algs") or only "Setup to U perm" / "Setup to Z perm".
 */
export const L2L_BY_CASE: { group: string; algorithms: (string | null)[] }[] = [
  {
    group: "Peanut - center on U",
    algorithms: ["SySyH (g)", "Hy'Hy'S (o)", "Sy'Sy'H (r)", "HyHyS (b)", "Hy'Sy'S (b)", "SyHyH (r)", "HySyS (o)", "Sy'Hy'H (g)", "SSy'SS (g)", null, null, null],
  },
  {
    group: "Pi - center on U",
    algorithms: ["Sy'Sy'S (g)", "SySyS (b)", "HyHyH (g)", "Hy'Hy'H (b)", "SSy2zSy2S (o)", "SSz'Sy2S (o)", "SSy2zSy2S (o)", "SSy2z'Sy2S (o)", "SS (o)", null, null, "Sy2Sy2H (r)"],
  },
  {
    group: "Peanut - center on FR",
    algorithms: ["Hy'H (g)", "SyH (b)", "Sy'SS (o)", "Sy2HySS (r)", "HyHy2S (g)", "Sy'Hy2S (b)", "SyHy'S (r)", "Sy'SyS (r)", "Hy'HyHy'H (b)", "SyHy'SyH (g)", "Sy2Sy'Sy'S (o)", "Sy2SyHyS (o)"],
  },
  {
    group: "Peanut - center on FL",
    algorithms: ["SyS (o)", "Hy'S (r)", "Hy'SS (g)", "Hy2Sy'SS (b)", "SySy2H (o)", "HySy2H (r)", "Hy'SyH (b)", "HyHy'H (b)", "SySy'SyS (r)", "Hy'SyHy'S (o)", "Sy2SyHyH (g)", "Sy2Sy'Sy'H (g)"],
  },
  {
    group: "Peanut - center on BR",
    algorithms: ["HyH (r)", "Sy'H (o)", "SySS (b)", "Sy2Hy'SS (g)", "SyHy2S (o)", "SyHy'S (r)", "Hy'Hy2S (r)", "SySy'S (g)", "HyHy'HyH (o)", "Sy'HySy'H (r)", "Sy2SySyS (b)", "Sy2Sy'Hy'S (b)"],
  },
  {
    group: "Peanut - center on BL",
    algorithms: ["Sy'S (b)", "HyS (g)", "HySS (r)", "Hy2SySS (o)", "Hy'Sy2H (g)", "Sy'Sy2H (b)", "HySy'H (o)", "Hy'HyH (o)", "Sy'SySy'S (g)", "HySy'HyS (b)", "Sy2Sy'HyH (r)", "Sy2SySyH (r)"],
  },
  {
    group: "Pi - center on F",
    algorithms: ["Sy'HyH (b)", "Sy'Sy'H (b)", "Sy'SSS (r)", "HySSS (o)", "SySy2S (r)", "Hy'Sy2S (o)", "Sy'SySy'H (o)", "HyHy'HyS (r)", "Sy2HySyS (g)", "Hy2Sy'Hy'H (g)", "SSySy2S (o)", null],
  },
  {
    group: "Pi - center on B",
    algorithms: ["SyHy'H (g)", "Sy'SyH (g)", "SySSS (r)", "Hy'SSS (o)", "Sy'Sy2S (r)", "HySy2S (o)", "SySy'SyH (o)", "Hy'HyHy'S (r)", "Sy2Hy'Sy'S (b)", "Hy2SyHyH (b)", "SSy'Sy2S (o)", null],
  },
  {
    group: "Pi - center on R",
    algorithms: ["H (o)", "Hy2S (r)", "Hy'z'Sy2S (o)", "HyzSy2S (o)", "Sy'z'Sy2S (r)", "Sy'zSy2S (r)", "Hy'zSy2S (o)", "Hyz'Sy2S (o)", "Hz'Sy2S (o)", "HzSy2S (o)", "SySy'HyS (g)", "Sy'SyHy'S (b)"],
  },
  {
    group: "Pi - center on L",
    algorithms: ["S (r)", "Sy2H (o)", "SyzSy2S (r)", "Hy2z'Sy2S (o)", "Sy2zSy2S (r)", "Sy2z'Sy2S (r)", "Syz'Sy2S (r)", "Hy2zSy2S (o)", "SzSy2S (r)", "Sz'Sy2S (r)", "HyHy'SyH (b)", "Hy'HySy'H (g)"],
  },
  {
    group: "L5C (Last 5 Centers)",
    algorithms: ["zSy2S (g)", null, null, null, null, null, null, null, "SSS (o)", null, null, null, null, null],
  },
];

/**
 * The same algorithms as the printable guide groups them, by how they
 * work, with its group names. Exactly as written there, in reading order
 * (it has "SSy2z Sy2S (o)" twice, like the by-case guide).
 */
export const L2L_BY_ALGORITHM: { group: string; algorithms: string[] }[] = [
  {
    group: "Short 'n Easy Cases",
    algorithms: ["S (r)", "H (o)", "SS (o)", "SyS (o)", "Sy2H (o)", "Hy2S (r)", "Sy'H (o)", "Sy'S (b)", "HyH (r)", "Hy'H (g)", "HyS (g)", "SyH (b)", "Hy'S (r)"],
  },
  { group: "Reducing to Vertical U Perm", algorithms: ["Sy Sy2S (r)", "Sy' Sy2S (r)", "Hy' Sy2S (o)", "Hy Sy2S (o)", "Sy2 Sy2S (r)"] },
  {
    group: "Reducing to Horizontal CCW U Perm (From Pi)",
    algorithms: ["Sz' Sy2S (r)", "Syz' Sy2S (r)", "Sy'z' Sy2S (r)", "Sy2z' Sy2S (r)", "Hz' Sy2S (o)", "Hyz' Sy2S (o)", "Hy'z' Sy2S (o)", "Hy2z' Sy2S (o)"],
  },
  {
    group: "Reducing to Horizontal CW U Perm (From Pi)",
    algorithms: ["Sz Sy2S (r)", "Syz Sy2S (r)", "Sy'z Sy2S (r)", "Sy2z Sy2S (r)", "Hz Sy2S (o)", "Hy2z Sy2S (o)", "Hyz Sy2S (o)", "Hy'z Sy2S (o)"],
  },
  { group: "Peanut + Triple Sledge Case", algorithms: ["Sy SS (b)", "Sy' SS (o)", "Hy' SS (g)", "Hy SS (r)"] },
  { group: "Pi + Easy Horizontal U Perms", algorithms: ["SySyS (b)", "Sy'Sy'S (g)", "Hy'Hy'H (b)", "HyHyH (g)"] },
  {
    group: "Peanut + Horizontal U Perms",
    algorithms: ["SySyH (g)", "Sy'Sy'H (r)", "SyHyH (r)", "Sy'Hy'H (g)", "Hy'Hy'S (o)", "HySyS (o)", "HyHyS (b)", "Hy'Sy'S (b)"],
  },
  { group: "Pi + Z Perm Conjugates", algorithms: ["Sy'SyH (g)", "Sy'Sy'H (b)", "SyHy'H (g)", "Sy'HyH (b)"] },
  {
    group: "Peanut + Z Perm Conjugates",
    algorithms: ["SySy'S (g)", "Sy'SyS (r)", "Hy'HyH (o)", "HyHy'H (b)", "SyHy'S (r)", "Hy'SyH (b)", "Sy'HyS (g)", "HySy'H (o)"],
  },
  {
    group: "Peanut + U Perm Conjugates",
    algorithms: ["SySy2H (o)", "Sy'Sy2H (b)", "SyHy2S (o)", "Sy'Hy2S (b)", "HyHy2S (g)", "Hy'Sy2H (g)", "Hy'Hy2S (r)", "HySy2H (r)"],
  },
  {
    group: "Actual Pure Pi and U perm",
    algorithms: ["SSy2z Sy2S (o)", "SSz' Sy2S (o)", "SSy2z Sy2S (o)", "SSy2z' Sy2S (o)", "SSy Sy2S (o)", "SSy' Sy2S (o)"],
  },
  { group: "Reduce to Pure Pi (From Peanut)", algorithms: ["Sy2Hy SS (r)", "Sy2Hy' SS (g)", "Hy2Sy' SS (b)", "Hy2Sy SS (o)"] },
  { group: "Reduce to Triple Sledge (From Pi)", algorithms: ["Sy SSS (r)", "Sy' SSS (r)", "Hy' SSS (o)", "Hy SSS (o)"] },
  {
    group: "Peanut + Wat Perm",
    algorithms: ["Sy2SySyS (b)", "Sy2Sy'Sy'S (o)", "Sy2Sy'HyH (r)", "Sy2SyHyH (g)", "Sy2SySyH (r)", "Sy2Sy'Hy'S (b)", "Sy2Sy'Sy'H (g)", "Sy2SyHyS (o)"],
  },
  {
    group: "Peanut + Swirl Perm",
    algorithms: ["SySy'SyS (r)", "Sy'SySy'S (g)", "Hy'HyHy'H (b)", "HyHy'HyH (o)", "SyHy'SyH (g)", "HySy'HyS (b)", "Sy'HySy'H (r)", "Hy'SyHy'S (o)"],
  },
  {
    group: "Pi + Swirl Perm",
    algorithms: ["SySy'SyH (o)", "Sy'SySy'H (o)", "Hy'HyHy'S (r)", "HyHy'HyS (r)", "SySy'HyS (g)", "HyHy'SyH (b)", "Sy'SyHy'S (b)", "Hy'HySy'H (g)"],
  },
  { group: "Pi + Wat Perm", algorithms: ["Sy2HySyS (g)", "Sy2Hy'Sy'S (b)", "Hy2Sy'Hy'H (g)", "Hy2SyHyH (b)"] },
  { group: "Suck Cases", algorithms: ["SS y' SS (g)"] },
  { group: "L5C", algorithms: ["z S y2 S (g)", "SSS (o)"] },
];

// ---------- the beginners' and intermediate variations ----------

/** Step 1, the last corner of the first side when a solved one has to come out: the guide's two positions. */
export const LAST_CORNER = ["L F' L'", "R' F R"];

/** Beginners' step 2, the top corners: Pi and the other shape, each with its alternative. */
export const TOP_CORNER_CASES = [
  { shape: "pi", algorithm: "F' L F L'", alternative: "(y2) L F' L' F" },
  { shape: "peanut", algorithm: "R' F R F' (y) R' F R F'", alternative: "L F' L' F (y') L F' L' F" },
] as const;

/** Beginners' step 3, the yellow center up. */
export const U_CENTER = { algorithm: "R' F R F' (y2) R' F R F'", alternative: "F R' F' R (y2) F R' F' R" };

/** Beginners' step 4 (also the intermediate's last step): the other four centers, after z or z'. */
export const LAST_CENTERS = [
  { algorithm: "R' F R F' (y2) R' F R F'", alternative: "F R' F' R (y2) F R' F' R" },
  {
    algorithm: "R' F R F' (y2) R' F R F' (y2 x') R' F R F' (y2) R' F R F'",
    alternative: "F R' F' R (y2) F R' F' R (y2 x') F R' F' R (y2) F R' F' R",
  },
  {
    algorithm: "R' F R F' (y2) R' F R F' (z2 x') R' F R F' (y2) R' F R F'",
    alternative: "F R' F' R (y2) F R' F' R (z2 x') F R' F' R (y2) F R' F' R",
  },
];

/**
 * The intermediate's step 2, the opposite side (top corners and the yellow
 * center at once): category 1 solves it; categories 2 and 3 are one
 * sledgehammer or hedgeslammer that turns the case into one of category 1
 * (or 2). The guide's order and its alternatives ("or").
 */
export const OPPOSITE_SIDE_CASES: { category: 1 | 2 | 3; shape: "pi" | "peanut"; algorithms: string[] }[] = [
  { category: 1, shape: "pi", algorithms: ["F' L F L'"] },
  { category: 1, shape: "pi", algorithms: ["(y2) L F' L' F"] },
  { category: 1, shape: "pi", algorithms: ["(y2) (F' L F L')2", "(L F' L' F)2"] },
  { category: 2, shape: "peanut", algorithms: ["R' F R F'", "(y2) R' F R F'"] },
  { category: 2, shape: "peanut", algorithms: ["R' F R F'", "(y2) F R' F' R"] },
  { category: 2, shape: "peanut", algorithms: ["L F' L' F", "(y2) L F' L' F"] },
  { category: 2, shape: "peanut", algorithms: ["L F' L' F", "(y2) F' L F L'"] },
  { category: 3, shape: "pi", algorithms: ["R' F R F'", "F R' F' R"] },
  { category: 3, shape: "pi", algorithms: ["(y2) R' F R F'", "(y2) F R' F' R"] },
  { category: 3, shape: "peanut", algorithms: ["R' F R F'", "(y) R' F R F'", "(y') F R' F' R", "(y2) F R' F' R"] },
];
