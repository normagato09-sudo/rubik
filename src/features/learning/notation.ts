export interface NotationMove {
  /** Lowercase move letter, used in ids and file names ("d", "m", "x"...). */
  id: string;
  /** The move as written in algorithms: "D", "M", "x"... Its inverse is `${move}'`. */
  move: string;
  /** Which layer turns — standard WCA meaning, not text from the source document. */
  label: string;
  /** Diagram of the move and its inverse, from the source document (lines recolored white). */
  image: string;
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
  return { id, move, label, image: `/learning/notation/notation-${id}.png` };
});

/** Matches "R", "r'", "R R'" or words of the label ("capa media"). */
export function matchesNotationMove(notation: NotationMove, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/’/g, "'");
  if (q.length === 0) return true;
  const letter = notation.move.toLowerCase();
  const tokens = q.split(/\s+/);
  if (tokens.every((token) => token === letter || token === `${letter}'`)) return true;
  return q.length >= 3 && notation.label.toLowerCase().includes(q);
}
