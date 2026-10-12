import type { LearningCube } from "./categories";

export interface NotationMove {
  /** Lowercase move letter, used in ids and file names ("d", "m", "x"...). */
  id: string;
  /** The move as written in algorithms: "D", "M", "x"... Its inverse is `${move}'`. */
  move: string;
  /** Which layer turns — standard WCA meaning, not text from the source document. */
  label: string;
  /** Diagram of the move and its inverse, from the source document (lines recolored white). */
  image: string;
  /** Natural size of the diagram, for next/image. */
  width: number;
  height: number;
  /** Set when the diagram is not from the source document, saying so. */
  note?: string;
}

/**
 * The 12 notation diagrams of `docs/source/notacion.docx`, in document
 * order. Each diagram shows one move and its inverse (e.g. D and D').
 */
const MOVES: { move: string; label: string }[] = [
  { move: "D", label: "Cara inferior (Down)" },
  { move: "U", label: "Cara superior (Up)" },
  { move: "L", label: "Cara izquierda (Left)" },
  { move: "R", label: "Cara derecha (Right)" },
  { move: "F", label: "Cara frontal (Front)" },
  { move: "B", label: "Cara trasera (Back)" },
  { move: "M", label: "Capa media, entre L y R" },
  { move: "E", label: "Capa ecuatorial, entre U y D" },
  { move: "S", label: "Capa central, entre F y B" },
  { move: "z", label: "Giro de todo el cubo, como F" },
  { move: "y", label: "Giro de todo el cubo, como U" },
  { move: "x", label: "Giro de todo el cubo, como R" },
];

export const NOTATION_MOVES: NotationMove[] = MOVES.map(({ move, label }) => {
  const id = move.toLowerCase();
  return { id, move, label, image: `/learning/notation/notation-${id}.png`, width: 270, height: 100 };
});

/**
 * The 2×2 notation: the 5 diagrams of `docs/source/Notacion 2x2.docx`, in
 * document order (labels recolored white, like the 3×3 ones), then the
 * moves it lacks — B, drawn in the same style (diagrams-2x2.ts), and x
 * and y, which two CLL algorithms use, with the 3×3 diagrams (a whole-cube
 * turn is the same on both). No middle layers: a 2×2 does not have them.
 * Ids start with "2x2-" so their progress is kept apart from the 3×3.
 */
export const NOTATION_MOVES_2X2: NotationMove[] = [
  ...[
    { move: "U", label: "Cara superior (Up)" },
    { move: "D", label: "Cara inferior (Down)" },
    { move: "R", label: "Cara derecha (Right)" },
    { move: "L", label: "Cara izquierda (Left)" },
    { move: "F", label: "Cara frontal (Front)" },
  ].map(({ move, label }) => {
    const id = `2x2-${move.toLowerCase()}`;
    return { id, move, label, image: `/learning/notation-2x2/notation-${id}.png`, width: 200, height: 137 };
  }),
  {
    id: "2x2-b",
    move: "B",
    label: "Cara trasera (Back)",
    image: "/learning/notation-2x2/notation-2x2-b.svg",
    width: 200,
    height: 137,
    note: "Añadido: tu documento no trae B. Dibujado con su mismo estilo.",
  },
  ...[
    { move: "y", label: "Giro de todo el cubo, como U" },
    { move: "x", label: "Giro de todo el cubo, como R" },
  ].map(({ move, label }) => ({
    id: `2x2-${move}`,
    move,
    label,
    image: `/learning/notation/notation-${move}.png`,
    width: 270,
    height: 100,
    note: "Añadido: lo usan dos casos de CLL. Diagrama del 3×3 (girar todo el cubo es igual).",
  })),
];

/**
 * The Pyraminx notation: the diagrams of `docs/source/Notacion Pyraminx.docx`
 * — each big layer (U, L, R, B: the tip with its center and three edges)
 * and each tip on its own (u, l, r, b). A third of a turn, clockwise looking
 * at the tip. Ids start with "pyraminx-" so their progress is kept apart.
 */
export const NOTATION_MOVES_PYRAMINX: NotationMove[] = [
  ...[
    { move: "U", label: "Capa de arriba: la punta de arriba con su centro y sus 3 aristas" },
    { move: "L", label: "Capa de la izquierda: la punta de la izquierda con su centro y sus 3 aristas" },
    { move: "R", label: "Capa de la derecha: la punta de la derecha con su centro y sus 3 aristas" },
    { move: "B", label: "Capa de detrás: la punta de detrás con su centro y sus 3 aristas" },
  ].map(({ move, label }) => ({ move, label, file: move.toLowerCase() })),
  ...[
    { move: "u", label: "Solo la punta de arriba" },
    { move: "l", label: "Solo la punta de la izquierda" },
    { move: "r", label: "Solo la punta de la derecha" },
    { move: "b", label: "Solo la punta de detrás" },
  ].map(({ move, label }) => ({ move, label, file: `${move}-tip` })),
].map(({ move, label, file }) => {
  const id = `pyraminx-${file}`;
  return { id, move, label, image: `/learning/notation-pyraminx/notation-${id}.png`, width: 340, height: 160 };
});

/**
 * The Skewb notation of Sarah's methods (features/skewb/moves.ts): held
 * with yellow up, green in front on the left and orange in front on the
 * right, F, R and L turn the three top corners in sight, a third of a turn
 * clockwise looking at the corner. No diagram in the user's documents:
 * RUBIKO draws each move and its inverse from the engine
 * (cases-skewb.ts, `generatedSkewbDiagrams`). Ids start with "skewb-".
 */
export const NOTATION_MOVES_SKEWB: NotationMove[] = [
  { move: "F", label: "La esquina de arriba delante, entre la cara verde y la naranja, con su mitad del Skewb" },
  { move: "R", label: "La esquina de arriba a la derecha, con su mitad del Skewb" },
  { move: "L", label: "La esquina de arriba a la izquierda, con su mitad del Skewb" },
].map(({ move, label }) => {
  const id = `skewb-${move.toLowerCase()}`;
  return {
    id,
    move,
    label,
    image: `/learning/notation-skewb/notation-${id}.svg`,
    width: 400,
    height: 236,
    note: "Dibujado por RUBIKO con su motor: el Skewb resuelto, visto desde arriba, después del giro. En color, la mitad que gira.",
  };
});

export function notationMovesFor(cube: LearningCube): NotationMove[] {
  if (cube === "pyraminx") return NOTATION_MOVES_PYRAMINX;
  if (cube === "4x4") return NOTATION_MOVES_4X4;
  if (cube === "skewb") return NOTATION_MOVES_SKEWB;
  return cube === "2x2" ? NOTATION_MOVES_2X2 : NOTATION_MOVES;
}

export interface WideMove {
  /** Lowercase letter, as written in algorithms: "r", "u"... */
  move: string;
  label: string;
  /** The same turn written with single layers ("R M'"), checked on the engine by the tests. */
  equals?: string;
}

/**
 * A lowercase face letter turns 2 layers: that face plus the middle layer
 * next to it, both the way the face turns — shown as "r (2x)". Some sheets
 * write it Rw. x, y and z are whole-cube rotations, not wide moves, so they
 * are never listed here. These have no diagram in the source document, so
 * they are not counted in the notation progress.
 */
export const WIDE_MOVES: WideMove[] = [
  { move: "f", label: "F y la capa central (S)", equals: "F S" },
  { move: "r", label: "R y la capa media (M)", equals: "R M'" },
  { move: "l", label: "L y la capa media (M)", equals: "L M" },
  { move: "b", label: "B y la capa central (S)", equals: "B S'" },
  { move: "u", label: "U y la capa ecuatorial (E)", equals: "U E'" },
  { move: "d", label: "D y la capa ecuatorial (E)", equals: "D E" },
];

/**
 * The Pyraminx's wider notation, used by the Top First algorithms
 * (features/pyraminx/moves.ts reads it): face turns and turns of the whole
 * Pyraminx, as the Speedsolving wiki writes them. No diagram in the user's
 * notation document, so — like the 3×3's lowercase moves — they are listed
 * apart and not counted in the progress.
 */
export const PYRAMINX_EXTRA_MOVES: WideMove[] = [
  { move: "Fw", label: "La cara de delante: todo menos la capa de la punta de detrás" },
  { move: "Lw", label: "La cara izquierda: todo menos la capa de la punta derecha" },
  { move: "Rw", label: "La cara derecha: todo menos la capa de la punta izquierda" },
  { move: "Dw", label: "La cara de abajo: todo menos la capa de arriba" },
  { move: "[U]", label: "Todo el Pyraminx, como U" },
  { move: "[L]", label: "Todo el Pyraminx, como L" },
  { move: "[R]", label: "Todo el Pyraminx, como R" },
  { move: "[B]", label: "Todo el Pyraminx, como B" },
];

/** The Skewb's whole turns, in Sarah's algorithms (like x, y and z on a 3×3). */
export const SKEWB_EXTRA_MOVES: WideMove[] = [
  { move: "x", label: "Todo el Skewb, como la cara naranja (delante a la derecha)" },
  { move: "y", label: "Todo el Skewb, como la cara de arriba" },
  { move: "z", label: "Todo el Skewb, como la cara verde (delante a la izquierda)" },
];

/** "r", "r'", "Rw", "2x" or "minúscula" find the wide moves; "Fw" or "[U]" the Pyraminx ones. */
export function matchesWideMove(wide: WideMove, query: string): boolean {
  let q = query.trim().toLowerCase().replace(/’/g, "'");
  // On the 3×3 Rw is another way of writing r (the Pyraminx's Rw is its own move).
  if (/^[rludfb]$/.test(wide.move)) q = q.replace(/(^|\s)([rludfb])w/g, "$1$2");
  if (q.length === 0) return true;
  if (q === "2x" || "minúscula".startsWith(q) || "minuscula".startsWith(q)) return q.length >= 2 && /^[rludfb]$/.test(wide.move);
  const tokens = q.split(/\s+/);
  const move = wide.move.toLowerCase();
  const inverse = move.endsWith("]") ? `${move.slice(0, -1)}']` : `${move}'`;
  return tokens.every((token) => token === move || token === `${move}'` || token === inverse);
}

/** Matches "R", "r'", "R R'" or words of the label ("capa media"). */
export function matchesNotationMove(notation: NotationMove, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/’/g, "'");
  if (q.length === 0) return true;
  const letter = notation.move.toLowerCase();
  const tokens = q.split(/\s+/);
  if (tokens.every((token) => token === letter || token === `${letter}'`)) {
    // On the Pyraminx "U" and "u" are different moves: an uppercase letter only finds the big one.
    const typed = query.trim().split(/\s+/);
    return typed.every((token) => token[0] === token[0].toLowerCase() || token[0] === notation.move[0]);
  }
  return q.length >= 3 && notation.label.toLowerCase().includes(q);
}

/**
 * The 4×4 notation (WCA Regulation 12a, and the usual one for the inner
 * layers): each face (R), its two outer layers (Rw) and the second layer
 * on its own (r). In RUBIKO lowercase r is only that inner layer, as the
 * parity algorithms write it. No diagram in the user's documents: RUBIKO
 * draws each move and its inverse from the engine (cases-4x4.ts,
 * `generated4x4Diagrams`). Ids start with "4x4-".
 */
export const NOTATION_MOVES_4X4: NotationMove[] = (
  [
    ["R", "r", "La cara derecha"],
    ["L", "l", "La cara izquierda"],
    ["U", "u", "La cara de arriba"],
    ["D", "d", "La cara de abajo"],
    ["F", "f", "La cara de delante"],
    ["B", "b", "La cara de detrás"],
  ] as const
).flatMap(([face, inner, label]) => [
  { move: face, file: inner, label },
  { move: `${face}w`, file: `${inner}w`, label: `${label} y la capa de al lado: las dos de fuera` },
  { move: inner, file: `${inner}-interna`, label: `Solo la segunda capa, la de al lado de ${label.replace(/^La /, "la ")}` },
]).map(({ move, file, label }) => {
  const id = `4x4-${file}`;
  return {
    id,
    move,
    label,
    image: `/learning/notation-4x4/notation-${id}.svg`,
    width: 400,
    height: 225,
    note: "Dibujado por RUBIKO con su motor: el 4×4 resuelto después del giro. En color, las capas que giran.",
  };
});

/** The 4×4's whole-cube turns (x, y, z), as on the 3×3; apart, like the 3×3's lowercase moves. */
export const CUBE4_EXTRA_MOVES: WideMove[] = [
  { move: "x", label: "Todo el cubo, como R" },
  { move: "y", label: "Todo el cubo, como U" },
  { move: "z", label: "Todo el cubo, como F" },
];
