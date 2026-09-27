/**
 * The 2×2 algorithms the solver uses, taken from the method sheets in
 * docs/source/Ortega.docx and docs/source/CLL.docx (the same ones RUBIKO
 * teaches), written exactly as there. Every one is checked with the 3D
 * engine in algorithms.test.ts against the case its diagram shows, not
 * just against whatever it happens to do.
 *
 * Where a sheet was wrong or missing a case, the standard algorithm is
 * used instead and `source` says so ("estándar"), with the sheet's own
 * text in `docAlgorithm` when there was one:
 * - Ortega OLL fila 8 (Pi): "F (R U R' U2') F'" does not orient the top.
 * - Ortega PBL fila 2 (diagonal arriba): its "R2 F2 R2" swaps a diagonal
 *   on both layers — it is used for that case (fila 3) instead.
 * - Ortega PBL fila 3 (diagonal arriba y abajo): "(R' F' R U) (R U' R' F)"
 *   untwists the top, it is not a PBL.
 * - Ortega PBL fila 5 (adyacente arriba, diagonal abajo): "R F U R U' R'
 *   F' U' R'" breaks both faces.
 * - CLL: the sheet has 40 of the 42 cases; the two with the top already
 *   oriented (only a swap left) use the Ortega PBL algorithms, which keep
 *   the bottom layer.
 *
 * `picture`: the case as its diagram shows it, seen from above with the
 * front at the bottom: the 4 top stickers (back row, then front row), then
 * the top row of the sides — back (left, right), front (left, right), left
 * (back, front), right (back, front). OLL diagrams only mark the top color
 * ("y"; "-" is any other); CLL diagrams show every color (y, w, r, o, g, b).
 */

export type AlgorithmSource = "documento" | "documento (otra fila)" | "estándar";

export interface CaseAlgorithm {
  id: string;
  name: string;
  /** Row of the sheet the case is in; null if the sheet does not have it. */
  doc: number | null;
  algorithm: string;
  source: AlgorithmSource;
  /** What the sheet says, when the solver does not use it. */
  docAlgorithm?: string;
}

export interface OllCase extends CaseAlgorithm {
  picture: string;
}

export type LayerSwap = "solved" | "adj" | "diag";

export interface PblCase extends CaseAlgorithm {
  /** Which corners the diagram swaps, top and bottom. */
  top: LayerSwap;
  bottom: LayerSwap;
}

export interface CllCase extends CaseAlgorithm {
  group: string;
  /** Diagram colors (see above), or null for the cases the sheet lacks. */
  picture: string | null;
  /** For those: the swap left on an oriented top. */
  swap?: LayerSwap;
}

/** Ortega, paso 2: los 7 casos de OLL (docs/source/Ortega.docx, filas 6–12). */
export const ORTEGA_OLL: OllCase[] = [
  { id: "sune", name: "Sune", doc: 6, algorithm: "R U R' U R U2 R'", source: "documento", picture: "--y-y--y--y-" },
  { id: "antisune", name: "Antisune", doc: 7, algorithm: "R U2 R' U' R U' R'", source: "documento", picture: "-y----y-y--y" },
  { id: "pi", name: "Pi", doc: 8, algorithm: "F R U R' U' R U R' U' F'", source: "estándar", docAlgorithm: "F (R U R' U2') F'", picture: "-----y-yyy--" },
  { id: "u", name: "U", doc: 9, algorithm: "F (R U R' U') F'", source: "documento", picture: "-y-y----yy--" },
  { id: "l", name: "L", doc: 10, algorithm: "F' R U R' U' R' F R", source: "documento", picture: "-yy----yy---" },
  { id: "t", name: "T", doc: 11, algorithm: "(R U R' U' ) R' F R F'", source: "documento", picture: "-y-yy-y-----" },
  { id: "h", name: "H", doc: 12, algorithm: "R2 U2 R U2 R2", source: "documento", picture: "----yyyy----" },
];

/** Ortega, paso 3: los 5 casos de PBL (docs/source/Ortega.docx, filas 1–5). */
export const ORTEGA_PBL: PblCase[] = [
  { id: "adj", name: "Adyacente arriba", doc: 1, algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'", source: "documento", top: "adj", bottom: "solved" },
  { id: "diag", name: "Diagonal arriba", doc: 2, algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'", source: "estándar", docAlgorithm: "R2 F2 R2", top: "diag", bottom: "solved" },
  { id: "diag-diag", name: "Diagonal arriba y abajo", doc: 3, algorithm: "R2 F2 R2", source: "documento (otra fila)", docAlgorithm: "(R' F' R U) (R U' R' F)", top: "diag", bottom: "diag" },
  { id: "adj-adj", name: "Adyacente arriba y abajo", doc: 4, algorithm: "R2 U' R2 U2 F2 U' R2", source: "documento", top: "adj", bottom: "adj" },
  { id: "adj-diag", name: "Adyacente arriba y diagonal abajo", doc: 5, algorithm: "R U' R F2 R' U R'", source: "estándar", docAlgorithm: "R F U R U' R' F' U' R'", top: "adj", bottom: "diag" },
];

/** CLL, paso 2: los 42 casos (docs/source/CLL.docx, filas 1–40, más los 2 que faltan). */
export const CLL_CASES: CllCase[] = [
  { id: "sune-1", name: "Sune 1", group: "Sune", doc: 1, algorithm: "R U R' U R U2 R'", source: "documento", picture: "rbyoyogybryg" },
  { id: "sune-2", name: "Sune 2", group: "Sune", doc: 2, algorithm: "(U') R' F R2 F' U' R' U' R2 U R'", source: "documento", picture: "rgyoyrbyboyg" },
  { id: "sune-3", name: "Sune 3", group: "Sune", doc: 3, algorithm: "F R' F' R U2 R U2 R'", source: "documento", picture: "bgyoyrryobyg" },
  { id: "sune-4", name: "Sune 4", group: "Sune", doc: 4, algorithm: "R U' R' F R' F' R", source: "documento", picture: "gbyoyoryrbyg" },
  { id: "sune-5", name: "Sune 5", group: "Sune", doc: 5, algorithm: "(U2) R U' R U' R' U R' U' F R' F'", source: "documento", picture: "boyryggyoryb" },
  { id: "sune-6", name: "Sune 6", group: "Sune", doc: 6, algorithm: "R' F2 R U2 R U' R' F", source: "documento", picture: "obygyorygbyr" },
  { id: "antisune-1", name: "Antisune 1", group: "Antisune", doc: 7, algorithm: "R' U' R U' R' U2 R", source: "documento", picture: "yorgbyyorgby" },
  { id: "antisune-2", name: "Antisune 2", group: "Antisune", doc: 8, algorithm: "R U2 R' F R' F' R U' R U' R'", source: "documento", picture: "ygboryybgroy" },
  { id: "antisune-3", name: "Antisune 3", group: "Antisune", doc: 9, algorithm: "(U2) F' R U R' U2 R' F2 R", source: "documento", picture: "yrbgoyyobrgy" },
  { id: "antisune-4", name: "Antisune 4", group: "Antisune", doc: 10, algorithm: "(U2) R' F R F' R U R'", source: "documento", picture: "yrgboyyrbogy" },
  { id: "antisune-5", name: "Antisune 5", group: "Antisune", doc: 11, algorithm: "(U) R U R2 F' R F R U' R2 F R", source: "documento", picture: "yobrgyygorby" },
  { id: "antisune-6", name: "Antisune 6", group: "Antisune", doc: 12, algorithm: "(U2) R U2 R' U2 R' F R F'", source: "documento", picture: "ygrboyyrbgoy" },
  { id: "pi-1", name: "Pi 1", group: "Pi", doc: 13, algorithm: "R U' R2 U R2 U R2 U' R", source: "documento", picture: "grbroyoyyygb" },
  { id: "pi-2", name: "Pi 2", group: "Pi", doc: 14, algorithm: "(U') R' U' R' F R F' R U' R' U2 R", source: "documento", picture: "gogroyryyybb" },
  { id: "pi-3", name: "Pi 3", group: "Pi", doc: 15, algorithm: "(U2) R' F R F' R U' R' U' R U' R'", source: "documento", picture: "ororbygyyygb" },
  { id: "pi-4", name: "Pi 4", group: "Pi", doc: 16, algorithm: "(U') R U' R U' R' U R' F R2 F'", source: "documento", picture: "roorgygyyybb" },
  { id: "pi-5", name: "Pi 5", group: "Pi", doc: 17, algorithm: "R U2 R' U' R U R' U2 R' F R F'", source: "documento", picture: "oggrbyryyyob" },
  { id: "pi-6", name: "Pi 6", group: "Pi", doc: 18, algorithm: "(U2) L' U2 L U L' U' L U2 L F' L' F", source: "documento", picture: "brobrygyyygo" },
  { id: "u-1", name: "U 1", group: "U", doc: 19, algorithm: "F R U R' U' F'", source: "documento", picture: "ryrygoboyygb" },
  { id: "u-2", name: "U 2", group: "U", doc: 20, algorithm: "(U') R U R2' U' R U2 R' U2' R U' R", source: "documento", picture: "bygyrbrgyyoo" },
  { id: "u-3", name: "U 3", group: "U", doc: 21, algorithm: "(U') F R U R' U2 F' R U' R' F", source: "documento", picture: "oyoybggbyyrr" },
  { id: "u-4", name: "U 4", group: "U", doc: 22, algorithm: "F R' F' R U' R U' R' U2 R U' R'", source: "documento", picture: "bygyroroyygb" },
  { id: "u-5", name: "U 5", group: "U", doc: 23, algorithm: "(U) R U' R2 F R F' R U R' U' R U R'", source: "documento", picture: "byoyrbgryyog" },
  { id: "u-6", name: "U 6", group: "U", doc: 24, algorithm: "(U) R' U R' F R F' R U2 R' U R", source: "documento", picture: "byoyrggoyyrb" },
  { id: "l-1", name: "L 1", group: "L", doc: 25, algorithm: "F R U' R' U' R U R' F'", source: "documento", picture: "ygbygryooryb" },
  { id: "l-2", name: "L 2", group: "L", doc: 26, algorithm: "F R' F' R U R U' R'", source: "documento", picture: "ybgyroybgoyr" },
  { id: "l-3", name: "L 3", group: "L", doc: 27, algorithm: "R U2 R2 F R F' R U2 R'", source: "documento", picture: "yobyrgyogryb" },
  { id: "l-4", name: "L 4", group: "L", doc: 28, algorithm: "(U) R' U R' U2 R U' R' U R U' R2", source: "documento", picture: "ygoygrybobyr" },
  { id: "l-5", name: "L 5", group: "L", doc: 29, algorithm: "(U') R U' R' U R U' R' F R' F' R2 U R'", source: "documento", picture: "yggyorybboyr" },
  { id: "l-6", name: "L 6", group: "L", doc: 30, algorithm: "R' U' R U2 R' F R' F' R U' R", source: "documento", picture: "ybbygoyroryg" },
  { id: "t-1", name: "T 1", group: "T", doc: 31, algorithm: "R U R' U' R' F R F'", source: "documento", picture: "byryyoyboggr" },
  { id: "t-2", name: "T 2", group: "T", doc: 32, algorithm: "(U2) L' U' L U R U' R' F", source: "documento", picture: "oybyybyrgrog" },
  { id: "t-3", name: "T 3", group: "T", doc: 33, algorithm: "(U') R U F R' F' R U2 R U2 R2", source: "documento", picture: "oyryybybggor" },
  { id: "t-4", name: "T 4", group: "T", doc: 34, algorithm: "(U') R' U R' U2 R U2 R' U R2 U' R'", source: "documento", picture: "gygyyryorobb" },
  { id: "t-5", name: "T 5", group: "T", doc: 35, algorithm: "(U2) R U R' U2 R U R' U R' F R F'", source: "documento", picture: "gygyybybroor" },
  { id: "t-6", name: "T 6", group: "T", doc: 36, algorithm: "(U) R' U R U2 R2 F R F' R", source: "documento", picture: "ryoyyoyrbbgg" },
  { id: "h-1", name: "H 1", group: "H", doc: 37, algorithm: "R2 U2 R U2 R2", source: "documento", picture: "bgbgyyyyoror" },
  { id: "h-2", name: "H 2", group: "H", doc: 38, algorithm: "x' U2 R U2 R2 F2 R U2", source: "documento", picture: "ggbbyyyyrroo" },
  { id: "h-3", name: "H 3", group: "H", doc: 39, algorithm: "y' R U R' U R U R' F R' F' R", source: "documento", picture: "bgrryyyyogob" },
  { id: "h-4", name: "H 4", group: "H", doc: 40, algorithm: "(U) F R2 U' R2 U' R2 U R2 F'", source: "documento", picture: "rgogyyyybbor" },
  { id: "pll-adj", name: "Solo intercambio adyacente", group: "Orientada", doc: null, algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'", source: "documento (otra fila)", picture: null, swap: "adj" },
  { id: "pll-diag", name: "Solo intercambio diagonal", group: "Orientada", doc: null, algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'", source: "estándar", picture: null, swap: "diag" },
];
