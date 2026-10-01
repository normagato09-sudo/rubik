/**
 * The Pyraminx algorithms RUBIKO teaches, from the method sheets, written
 * exactly as there:
 * - docs/source/Pyraminx Por capas - ultima capa.docx — Por capas, last
 *   layer (5 cases).
 * - docs/source/Pyraminx L4E - ultimas 4 aristas.docx — L4E (30 cases).
 *
 * Each one is checked with the engine in algorithms.test.ts against the
 * case its diagram shows. Where a sheet is wrong, the right algorithm is
 * used and `source` says so, with the sheet's text in `docAlgorithm`:
 * - Por capas, fila 5: "(R' L R L') U R U' R'" takes its second half from
 *   fila 4; the case (fila 4 mirrored) is solved by the mirror of fila 4,
 *   "(R' L R L') U' L' U L".
 *
 * `picture`: the diagram's 27 visible stickers — the sheets draw the
 * Pyraminx from above, so the front, left and right faces, each numbered
 * as in geometry.ts — in RUBIKO's colors (g r b y: green front, red left,
 * blue right, yellow down). The Por capas sheet draws it with red in front,
 * blue left and green right, which is the same Pyraminx turned round: its
 * colors are renamed here.
 *
 * `adjust`: the turn of the top layer the case still needs after the
 * algorithm, to line it up with the rest ("" if none).
 */

export type PyraAlgorithmSource = "documento" | "corregido";

export interface PyraCase {
  /** Row of the sheet. */
  doc: number;
  algorithm: string;
  source: PyraAlgorithmSource;
  /** What the sheet says, when RUBIKO does not use it. */
  docAlgorithm?: string;
  /** Written slightly differently in the sheet (same moves). */
  docText?: string;
  picture: string;
  adjust: "" | "U" | "U'";
}

/** Por capas, último paso: las 3 aristas de arriba (5 casos). */
export const POR_CAPAS_LAST_LAYER: PyraCase[] = [
  { doc: 1, algorithm: "R U' R' U' R U' R'", source: "documento", picture: "grgrgggggrbrbrrrrrbgbgbbbbb", adjust: "" },
  { doc: 2, algorithm: "R U R' U R U R'", source: "documento", docText: "R U R' U R U R')", picture: "gbgbgggggrgrgrrrrrbrbrbbbbb", adjust: "" },
  { doc: 3, algorithm: "(L R' L' R) U' R U R'", source: "documento", picture: "grgbgggggrrrgrrrrrbgbbbbbbb", adjust: "" },
  { doc: 4, algorithm: "(L R' L' R ) U R U' R'", source: "documento", picture: "gbgggggggrbrrrrrrrbrbgbbbbb", adjust: "" },
  {
    doc: 5,
    algorithm: "(R' L R L') U' L' U L",
    source: "corregido",
    docAlgorithm: "(R' L R L' ) U R U' R'",
    picture: "gggrgggggrgrbrrrrrbbbrbbbbb",
    adjust: "",
  },
];

/** L4E, último paso: las 4 aristas que faltan (30 casos). */
export const L4E_CASES: PyraCase[] = [
  { doc: 1, algorithm: "(R' L R L') U (R' L R L') U (R' L R L')", source: "documento", picture: "grgbggyggrbrgrrrrrbgbrbbbbb", adjust: "U" },
  { doc: 2, algorithm: "(L R' L' R) U (L R' L' R)", source: "documento", picture: "gbggggyggrgrrrrrrrbrbbbbbbb", adjust: "U'" },
  { doc: 3, algorithm: "(R' L R L') U' (R' L R L')", source: "documento", picture: "gggrggyggrrrbrrrrrbbbgbbbbb", adjust: "U" },
  { doc: 4, algorithm: "U' (R' L R L') (R U' R')", source: "documento", picture: "ggggggyggrbrrrrrrrbbbrbbbbb", adjust: "U'" },
  { doc: 5, algorithm: "U' (R U' R') (L' U' L)", source: "documento", picture: "grgrggyggrgrbrrrrrbgbbbbbbb", adjust: "" },
  { doc: 6, algorithm: "U (L' U L) (R U R')", source: "documento", picture: "gbgbggyggrrrgrrrrrbrbgbbbbb", adjust: "" },
  { doc: 7, algorithm: "U L' U' L", source: "documento", picture: "gygrgggggrrrgrrrrrbgbbbbbbb", adjust: "" },
  { doc: 8, algorithm: "U' R U R'", source: "documento", picture: "gbgygggggrrrgrrrrrbgbbbbbbb", adjust: "" },
  { doc: 9, algorithm: "L R' L' R", source: "documento", picture: "gyggggbggrrrgrrrrrbrbbbbbbb", adjust: "" },
  { doc: 10, algorithm: "R' L R L'", source: "documento", picture: "gggyggrggrrrbrrrrrbgbbbbbbb", adjust: "" },
  { doc: 11, algorithm: "R' L R L2' U L", source: "documento", picture: "gggggggggrrryrrrrrbrbbbbbbb", adjust: "U'" },
  { doc: 12, algorithm: "L R' L' R2 U' R'", source: "documento", picture: "gggggggggrrrbrrrrrbybbbbbbb", adjust: "U" },
  { doc: 13, algorithm: "R U' R'", source: "documento", picture: "gggrggbggrrryrrrrrbgbbbbbbb", adjust: "U" },
  { doc: 14, algorithm: "L' U L", source: "documento", picture: "gbggggrggrrrgrrrrrbybbbbbbb", adjust: "U'" },
  { doc: 15, algorithm: "(R U R') U (R' L R L')", source: "documento", picture: "ggggggbggrbryrrrrrbrbrbbbbb", adjust: "U" },
  { doc: 16, algorithm: "(L' U' L) U' (L R' L' R)", source: "documento", picture: "ggggggrggrbrbrrrrrbybrbbbbb", adjust: "U'" },
  { doc: 17, algorithm: "U (L' U L) U' (R U R')", source: "documento", picture: "gggrgggggrbryrrrrrbgbrbbbbb", adjust: "U" },
  { doc: 18, algorithm: "U' (R U' R') U (L' U' L)", source: "documento", picture: "gbgggggggrbrgrrrrrbybrbbbbb", adjust: "U'" },
  { doc: 19, algorithm: "(R U R') U (L' U L)", source: "documento", picture: "gygrggbggrbrgrrrrrbgbrbbbbb", adjust: "" },
  { doc: 20, algorithm: "(L' U' L) U' (R U' R')", source: "documento", picture: "gbgyggrggrbrgrrrrrbgbrbbbbb", adjust: "" },
  { doc: 21, algorithm: "U (R' L R L') U (L' U L)", source: "documento", picture: "gygggggggrbrgrrrrrbrbrbbbbb", adjust: "" },
  { doc: 22, algorithm: "U' (L R' L' R) U' (R U' R')", source: "documento", picture: "gggygggggrbrbrrrrrbgbrbbbbb", adjust: "" },
  { doc: 23, algorithm: "U R U' R2' L R L'", source: "documento", picture: "ggggggrggrgrbrrrrrbrbybbbbb", adjust: "" },
  { doc: 24, algorithm: "U' L' U L2 R' L' R", source: "documento", picture: "ggggggbggryrbrrrrrbrbgbbbbb", adjust: "" },
  { doc: 25, algorithm: "U' (L' U' L) U (R U R')", source: "documento", picture: "gbggggbggrgrgrrrrrbrbybbbbb", adjust: "" },
  { doc: 26, algorithm: "U (R U R') U' (L' U' L)", source: "documento", picture: "gggrggrggryrbrrrrrbgbgbbbbb", adjust: "" },
  { doc: 27, algorithm: "U (R U' R') U' (R U R')", source: "documento", picture: "gbgrggrggrgrgrrrrrbgbybbbbb", adjust: "" },
  { doc: 28, algorithm: "U' (L' U L) U (L' U' L)", source: "documento", picture: "gbgrggbggryrgrrrrrbgbgbbbbb", adjust: "" },
  { doc: 29, algorithm: "U' (L' U L) (R U' R')", source: "documento", picture: "gggrggbggrgrbrrrrrbgbybbbbb", adjust: "U" },
  { doc: 30, algorithm: "U (R U' R') (L' U L)", source: "documento", picture: "gbggggrggryrgrrrrrbrbgbbbbb", adjust: "U'" },
];

/** Colors of the Por capas sheet's diagrams (red front) → RUBIKO's (green front). */
export const POR_CAPAS_SHEET_COLORS = { red: "green", blue: "red", green: "blue", yellow: "yellow" } as const;
