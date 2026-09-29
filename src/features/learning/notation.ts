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

export function notationMovesFor(cube: "3x3" | "2x2"): NotationMove[] {
  return cube === "2x2" ? NOTATION_MOVES_2X2 : NOTATION_MOVES;
}

export interface WideMove {
  /** Lowercase letter, as written in algorithms: "r", "u"... */
  move: string;
  label: string;
}

/**
 * A lowercase face letter turns 2 layers: that face plus the middle layer
 * next to it — shown as "r (2x)". x, y and z are whole-cube rotations, not
 * wide moves, so they are never listed here. These have no diagram in the
 * source document, so they are not counted in the notation progress.
 */
export const WIDE_MOVES: WideMove[] = [
  { move: "f", label: "F y la capa central (S)" },
  { move: "r", label: "R y la capa media (M)" },
  { move: "l", label: "L y la capa media (M)" },
  { move: "b", label: "B y la capa central (S)" },
  { move: "u", label: "U y la capa ecuatorial (E)" },
  { move: "d", label: "D y la capa ecuatorial (E)" },
];

/** "r", "r'", "2x" or "minúscula" find the wide moves. */
export function matchesWideMove(wide: WideMove, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/’/g, "'");
  if (q.length === 0) return true;
  if (q === "2x" || "minúscula".startsWith(q) || "minuscula".startsWith(q)) return q.length >= 2;
  const tokens = q.split(/\s+/);
  return tokens.every((token) => token === wide.move || token === `${wide.move}'`);
}

/** Matches "R", "r'", "R R'" or words of the label ("capa media"). */
export function matchesNotationMove(notation: NotationMove, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/’/g, "'");
  if (q.length === 0) return true;
  const letter = notation.move.toLowerCase();
  const tokens = q.split(/\s+/);
  if (tokens.every((token) => token === letter || token === `${letter}'`)) return true;
  return q.length >= 3 && notation.label.toLowerCase().includes(q);
}
