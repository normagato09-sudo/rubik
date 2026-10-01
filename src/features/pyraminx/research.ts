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
