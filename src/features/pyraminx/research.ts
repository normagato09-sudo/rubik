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
import { CENTER_STICKERS } from "./pieces";

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

/**
 * Sarah's page holds the Pyraminx with the solved "top" (a center and its
 * three edges) up. RUBIKO's Top First methods keep that block at the back,
 * so the Pyraminx is tipped over: a half turn that swaps the top and back
 * tips, the left and right tips, and the bottom and front faces. The same
 * algorithm then reads with those letters swapped (research.test.ts checks
 * the half turn really does this).
 */
const TIPPED_OVER: Record<string, string> = {
  U: "B", B: "U", L: "R", R: "L",
  u: "b", b: "u", l: "r", r: "l",
  Fw: "Dw", Dw: "Fw", Lw: "Rw", Rw: "Lw",
};

export function heldWithBlockBehind(text: string): string {
  return text
    .split(" ")
    .map((token) => {
      const match = token.match(/^([FLRD]w|[ULRBulrb])(.*)$/);
      if (!match) throw new Error(`Movimiento no válido: ${token}`);
      return `${TIPPED_OVER[match[1]]}${match[2]}`;
    })
    .join(" ");
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
