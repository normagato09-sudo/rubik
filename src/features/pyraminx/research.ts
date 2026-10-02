/**
 * Pyraminx algorithms RUBIKO teaches from research, not from the user's
 * sheets in docs/source: each one says where it comes from, and the tests
 * (research.test.ts) check it with the engine — never copied untested.
 *
 * Everything is written for RUBIKO's usual hold (green in front, red left,
 * blue right, yellow down). In the Top First methods the block built
 * first is the big layer of the back tip (B): its center and the edges
 * LR (top back), LD and RD (bottom left and right). The last layer is
 * then the front face: its three edges FL, FR and FD.
 */
import { PYRA_COLORS, solvedPyraminx, type PyraColor } from "./moves";
import { CENTER_STICKERS, EDGE_FACES, EDGE_STICKERS } from "./pieces";

export interface ResearchSource {
  name: string;
  url: string;
}

export const SOURCES = {
  speedsolvingAlgorithms: {
    name: "Speedsolving Wiki · Pyraminx algorithms",
    url: "https://www.speedsolving.com/wiki/index.php/Pyraminx_algorithms",
  },
  speedsolvingTopFirst: {
    name: "Speedsolving Wiki · Top First",
    url: "https://www.speedsolving.com/wiki/index.php/Top_First",
  },
  speedsolvingVFirst: {
    name: "Speedsolving Wiki · V First",
    url: "https://www.speedsolving.com/wiki/index.php/V_First",
  },
  speedsolvingNotation: {
    name: "Speedsolving Wiki · Pyraminx notation",
    url: "https://www.speedsolving.com/wiki/index.php/Pyraminx_notation",
  },
  sarahL3C: {
    name: "Sarah's Cubing Site · Pyraminx Last 3 Centers (algoritmos de Odder y de Drew Brads)",
    url: "https://sarah.cubing.net/pyraminx/l3c",
  },
  drewBrads: {
    name: "Drew Brads · Pyraminx (Oka, 1-Flip, WO y Nutella), hoja de Andy Klise",
    url: "https://www.kungfoomanchu.com/guides/drew-brads-pyraminx.pdf",
  },
  keyholeGuide: {
    name: "Andy Klise · Pyraminx Keyhole Method (algoritmos de Erik Akkersdijk)",
    url: "https://www.kungfoomanchu.com/guides/andy-klise-pyraminx-keyhole.pdf",
  },
} satisfies Record<string, ResearchSource>;

export interface ResearchCase {
  /** Name the source gives the case, when it has one. */
  name?: string;
  algorithm: string;
  source: ResearchSource;
  /** How the source writes it, when RUBIKO writes it differently (same moves). */
  sourceText?: string;
  /** Set when RUBIKO worked the algorithm out with its engine, following the source's method. */
  computed?: true;
  /** The turn of the block the case still needs after the algorithm, to line it up with the rest. */
  adjust?: "B" | "B'";
  /** Set when RUBIKO also looks at the case from another side of the back tip (see turnedRoundBack). */
  turnedRound?: true;
}

/**
 * L3E — the last three edges of the Top First methods, the front face's
 * (ELL in the Speedsolving wiki): 5 cases, all checked with the engine.
 */
export const L3E_CASES: ResearchCase[] = [
  { name: "Sledgehammer", algorithm: "R' L R L'", source: SOURCES.speedsolvingAlgorithms },
  { name: "Hedgeslammer", algorithm: "L R' L' R", source: SOURCES.speedsolvingAlgorithms },
  { name: "U", algorithm: "R' L R L2' U L U'", source: SOURCES.speedsolvingAlgorithms },
  { name: "U espejo", algorithm: "L R' L' R' U' R' U", source: SOURCES.speedsolvingAlgorithms },
  { name: "Dos aristas volteadas", algorithm: "L R' L' R U' R U R'", source: SOURCES.speedsolvingAlgorithms },
];

/**
 * Keyhole, step 4: the red-blue edge that closes the back block, from
 * wherever it is (the 7 places it can be wrong). The guide writes them
 * without spaces ("L'U'LU").
 */
export const KEYHOLE_EDGE_CASES: ResearchCase[] = [
  { algorithm: "L' U' L U", sourceText: "L'U'LU", source: SOURCES.keyholeGuide },
  { algorithm: "U' (L R' L' R) U", sourceText: "U' (LR'L'R) U", source: SOURCES.keyholeGuide },
  { algorithm: "U (R' L R L') U'", sourceText: "U (R'LRL') U'", source: SOURCES.keyholeGuide },
  { algorithm: "R U R' U'", sourceText: "RUR'U'", source: SOURCES.keyholeGuide },
  { algorithm: "U R U' R'", sourceText: "URU'R'", source: SOURCES.keyholeGuide },
  { algorithm: "U' L' U L", sourceText: "U'L'UL", source: SOURCES.keyholeGuide },
  { algorithm: "U (R' L R L' U L' U' L) U'", sourceText: "U (R'LRL' UL'U'L) U'", source: SOURCES.keyholeGuide },
];

/**
 * Keyhole, step 3: the centers, with the guide's method — "U and Rw" with
 * the block in the left hand, which held with the block at the back (as
 * here) is U and Fw. The guide gives no list of cases, so these are the
 * basic ones, each the shortest with U and Fw (worked out with the engine).
 */
export const KEYHOLE_CENTER_CASES: ResearchCase[] = [
  { algorithm: "U", source: SOURCES.keyholeGuide, computed: true },
  { algorithm: "U'", source: SOURCES.keyholeGuide, computed: true },
  { algorithm: "Fw U' Fw'", source: SOURCES.keyholeGuide, computed: true },
  { algorithm: "Fw U Fw'", source: SOURCES.keyholeGuide, computed: true },
  { algorithm: "Fw' U' Fw", source: SOURCES.keyholeGuide, computed: true },
  { algorithm: "Fw' U Fw", source: SOURCES.keyholeGuide, computed: true },
  { algorithm: "Fw", source: SOURCES.keyholeGuide, computed: true },
  { algorithm: "Fw'", source: SOURCES.keyholeGuide, computed: true },
];

// ---------- 1-Flip and WO ----------

/** An algorithm with its letters swapped by `swap`: moves, tips, face turns and whole turns. */
function relabel(text: string, swap: Record<string, string>): string {
  return text
    .split(" ")
    .map((token) => {
      const whole = token.match(/^\[([ULRB])('?)\]$/);
      if (whole) return `[${swap[whole[1]]}${whole[2]}]`;
      const match = token.match(/^([FLRD]w|[ULRBulrb])(.*)$/);
      if (!match) throw new Error(`Movimiento no válido: ${token}`);
      return `${swap[match[1]]}${match[2]}`;
    })
    .join(" ");
}

/**
 * Sarah's page and Drew Brads' sheet hold the Pyraminx with the solved
 * "top" (a center and its three edges) up. RUBIKO's Top First methods keep
 * that block at the back, so the Pyraminx is tipped over: a half turn that
 * swaps the top and back tips, the left and right tips, and the bottom and
 * front faces. The same algorithm then reads with those letters swapped,
 * whole turns too ([U] is [B]); research.test.ts checks the half turn
 * really does this.
 */
const TIPPED_OVER: Record<string, string> = {
  U: "B", B: "U", L: "R", R: "L",
  u: "b", b: "u", l: "r", r: "l",
  Fw: "Dw", Dw: "Fw", Lw: "Rw", Rw: "Lw",
};

export const heldWithBlockBehind = (text: string) => relabel(text, TIPPED_OVER);

/**
 * The same algorithm after turning the whole Pyraminx round the back tip
 * ([B]) `turns` times: the block stays at the back, its three slots take
 * each other's place. Oka and Nutella are looked at this way so their
 * free slot or their solved edge is at the top back, as in Keyhole.
 */
const TURNED_ROUND_BACK: Record<string, string> = {
  U: "R", L: "U", R: "L", B: "B",
  u: "r", l: "u", r: "l", b: "b",
  Fw: "Fw", Lw: "Rw", Rw: "Dw", Dw: "Lw",
};

export function turnedRoundBack(text: string, turns: number): string {
  let result = text;
  for (let k = 0; k < turns; k++) result = relabel(result, TURNED_ROUND_BACK);
  return result;
}

/**
 * A case of Sarah's page: her text, held with the block at the back, and
 * the final turn of the block it needs (her U, which becomes B).
 */
const fromSarah = ([sourceText, adjust]: [string, ("B" | "B'")?]): ResearchCase => ({
  algorithm: heldWithBlockBehind(sourceText),
  sourceText,
  source: SOURCES.sarahL3C,
  ...(adjust ? { adjust } : {}),
});

/**
 * WO, step 3 (L3C): the three front centers with the block whole, in one
 * algorithm — Sarah's first set (Odder's), 10 cases plus the skip.
 */
export const WO_L3C_CASES: ResearchCase[] = (
  [
    ["R' L' R' L R"],
    ["L R L R' L'"],
    ["R L R L R' L' R"],
    ["R' L R' L' R L'"],
    ["L R' L R L' R"],
    ["R' L R L' R' L' R'"],
    ["B' U R U L'", "B"],
    ["B U' L' U' R", "B'"],
    ["L R' L Dw L U L", "B"],
    ["R' L R' Dw' R' U' R'", "B'"],
  ] as [string, ("B" | "B'")?][]
).map(fromSarah);

/**
 * 1-Flip, step 3 (L3C): the three front centers and the block's flipped
 * edge at once — Sarah's second set (from Drew Brads' tutorial). Her page
 * gives no algorithm for the case with the centers already done ("GLHF"):
 * the one here is the shortest the engine finds.
 */
export const ONE_FLIP_L3C_CASES: ResearchCase[] = [
  ...(
    [
      ["R' U R L R' L'", "B'"],
      ["L U' L' R' L R", "B"],
      ["R' Dw R L' R' L R", "B'"],
      ["R' U L'", "B'"],
      ["L U' R", "B"],
      ["R' L' R' L U L'", "B'"],
      ["R' U' B U' L'", "B'"],
      ["L U B' U R", "B"],
      ["R' U' B' U' L'", "B'"],
      ["L U B U R", "B"],
    ] as [string, ("B" | "B'")?][]
  ).map(fromSarah),
  { name: "GLHF", algorithm: "R U R' U L' U L", source: SOURCES.sarahL3C, computed: true },
];

/**
 * WO and 1-Flip, step 2: the block's third edge (red-blue, top back), from
 * each of the 7 places it can be wrong, with the front centers free — the
 * shortest with U, L, R and B (worked out with the engine). 1-Flip puts it
 * in the wrong way round on purpose, and the same moves do it: there the
 * 7 places are counted from the flipped edge, so each case is another one.
 */
export const THIRD_EDGE_CASES: ResearchCase[] = ["U'", "U", "L' U L", "R U' R'", "B L' B'", "B' R B", "B' R' B U'"].map(
  (algorithm) => ({ algorithm, source: SOURCES.speedsolvingTopFirst, computed: true }),
);

/**
 * The same Pyraminx with its colors renamed so the back center is in its
 * place: how it looks from the side where the block is home. A case whose
 * algorithm turns the whole Pyraminx (Fw) is drawn this way, so the block
 * is always at the back in its own colors. Renaming colors like this is
 * turning the Pyraminx round, so it is the same case.
 */
export function seenWithBlockHome(state: readonly PyraColor[]): PyraColor[] {
  const solved = solvedPyraminx();
  const rename = new Map<PyraColor, PyraColor>(CENTER_STICKERS.B.map((i) => [state[i], solved[i]]));
  // The back center shows three colors; the fourth is the front face's.
  rename.set(PYRA_COLORS.find((color) => !rename.has(color))!, solved[0]);
  return state.map((color) => rename.get(color)!);
}

// ---------- Oka and Nutella ----------

/**
 * A case of Drew Brads' sheet: his text, held with the block at the back
 * and seen from the side the method's step needs, with the final turn of
 * the block it needs.
 */
const fromDrew = ([sourceText, turns, adjust]: [string, number, ("B" | "B'")?]): ResearchCase => ({
  algorithm: turnedRoundBack(heldWithBlockBehind(sourceText), turns),
  sourceText,
  source: SOURCES.drewBrads,
  ...(adjust ? { adjust } : {}),
  ...(turns > 0 ? { turnedRound: true as const } : {}),
});

const EDGE = (name: string) => EDGE_FACES.findIndex((faces) => faces.join("") === name);

/** `state` with edge `piece` moved to `slot` (flipped or not); whatever was there takes the piece's old place. */
export function withEdge(state: readonly PyraColor[], piece: number, slot: number, flip: boolean): PyraColor[] {
  const solved = solvedPyraminx();
  const colors = (k: number) => EDGE_STICKERS[k].map((i) => state[i]);
  const own = new Set(EDGE_STICKERS[piece].map((i) => solved[i]));
  const from = EDGE_STICKERS.findIndex((_, k) => colors(k).every((color) => own.has(color)));
  const next = [...state];
  const moved = EDGE_STICKERS[piece].map((i) => solved[i]);
  if (flip) moved.reverse();
  const displaced = colors(slot);
  EDGE_STICKERS[slot].forEach((i, j) => (next[i] = moved[j]));
  if (from !== slot) EDGE_STICKERS[from].forEach((i, j) => (next[i] = displaced[j]));
  return next;
}

/** What Oka's step 2 builds: blue-yellow solved, the red-blue edge bottom left with blue on the left face. */
export const OKA_EDGE_GOAL = withEdge(solvedPyraminx(), EDGE("LR"), EDGE("LD"), true);

/** What Nutella's step 2 builds: red-blue solved, the red-yellow and blue-yellow edges in each other's slot. */
export const NUTELLA_EDGE_GOAL = withEdge(
  withEdge(solvedPyraminx(), EDGE("LD"), EDGE("RD"), false),
  EDGE("RD"),
  EDGE("LD"),
  false,
);

const computed = (source: ResearchSource) => (algorithm: string): ResearchCase => ({ algorithm, source, computed: true });

/**
 * Oka, step 2: with the blue-yellow edge solved (bottom right), the
 * red-blue edge — the "Oka edge" — goes in the wrong slot, bottom left,
 * the right way round for that slot (blue on the left face, red below):
 * its own slot, top back, stays free. From each of the 9 places it can
 * be, the shortest with U, L, R and B (worked out with the engine; the
 * front centers are free here).
 */
export const OKA_EDGE_CASES: ResearchCase[] = [
  "L'",
  "L",
  "U' L'",
  "U L'",
  "R' L R",
  "B R' B'",
  "B' U B",
  "B L B' L'",
  "B' U' B L'",
].map(computed(SOURCES.speedsolvingTopFirst));

/**
 * Oka, step 4: the Oka edge home and the third edge into the slot it
 * leaves, in one go, with the centers solved. Drew Brads' sheet has 6
 * (one of them, mirrored, works for both sides); the engine counts 16
 * places for the third edge — 8 with the Oka edge bottom left, 8 with it
 * bottom right — so the other 9 are the shortest it finds.
 */
export const OKA_FINISH_CASES: ResearchCase[] = [
  // The Oka edge bottom left, the blue-yellow edge solved.
  ...([
    ["U' R U R'", 1],
    ["L' U L [U']", 1, "B'"],
    ["R' L' R U L U'", 1],
    ["U' R' U R' U' R U R", 1],
  ] as [string, number, ("B" | "B'")?][]).map(fromDrew),
  ...["B' U' B U", "B R B R' B", "B R' B R B", "L B L' B'"].map(computed(SOURCES.drewBrads)),
  // The Oka edge bottom right, the red-yellow edge solved (the mirror).
  ...([
    ["U L' U' L", 2],
    ["R U' R' [U]", 2, "B"],
    ["U' R' U R' U' R U R", 2],
  ] as [string, number, ("B" | "B'")?][]).map(fromDrew),
  ...["B U B' U'", "B' L' B' L B'", "B' L B' L' B'", "R' B' R B", "R' U L R L' U'"].map(computed(SOURCES.drewBrads)),
];

/**
 * Nutella, step 2: with the red-blue edge solved (top back), the other two
 * block edges go in each other's slot. With the blue-yellow one already
 * bottom left, the red-yellow one goes bottom right: from each of the 7
 * places it can be, the shortest with U, L, R and B (worked out with the
 * engine; the front centers are free here).
 */
export const NUTELLA_EDGE_CASES: ResearchCase[] = ["R'", "R", "U' R U", "L R' L'", "B U' B'", "B' L B", "B' L' B R'"].map(
  computed(SOURCES.speedsolvingTopFirst),
);

/**
 * Nutella, step 3: the three front centers and the two swapped edges in
 * one algorithm. Drew Brads' sheet gives only the good cases (8); the
 * engine counts 27.
 */
export const NUTELLA_L3C_CASES: ResearchCase[] = (
  [
    ["R L R L'", 0],
    ["R' L' Dw' R'", 0, "B"],
    ["L R' L' R'", 0],
    ["R Dw L R", 0, "B'"],
    ["L U [U] R' L R", 1, "B'"],
    ["R' U' [U'] L R' L'", 2, "B"],
    ["L R L U B", 0, "B'"],
    ["R' L' R' U' B'", 0, "B"],
  ] as [string, number, ("B" | "B'")?][]
).map(fromDrew);
