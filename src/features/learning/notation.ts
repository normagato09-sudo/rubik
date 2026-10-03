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

export function notationMovesFor(cube: "3x3" | "2x2" | "pyraminx"): NotationMove[] {
  if (cube === "pyraminx") return NOTATION_MOVES_PYRAMINX;
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

/** "r", "r'", "Rw", "2x" or "minúscula" find the wide moves; "Fw" or "[U]" the Pyraminx ones. */
export function matchesWideMove(wide: WideMove, query: string): boolean {
  let q = query.trim().toLowerCase().replace(/’/g, "'");
  // On the 3×3 Rw is another way of writing r (the Pyraminx's Rw is its own move).
  if (/^[a-z]$/.test(wide.move)) q = q.replace(/(^|\s)([rludfb])w/g, "$1$2");
  if (q.length === 0) return true;
  if (q === "2x" || "minúscula".startsWith(q) || "minuscula".startsWith(q)) return q.length >= 2 && /^[a-z]$/.test(wide.move);
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
    return typed.every((token) => token[0] === token[0].toLowerCase() || token[0] === notation.move);
  }
  return q.length >= 3 && notation.label.toLowerCase().includes(q);
}
