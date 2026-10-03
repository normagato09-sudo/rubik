import Image from "next/image";
import type { NotationMove, WideMove } from "../notation";
import { notationItemId } from "../progress-store";
import { CheckIcon } from "./CheckIcon";

/**
 * Each diagram already is the whole lesson (the move and its inverse),
 * so rows have no detail screen — just the diagram and a learned toggle.
 */
export function NotationList({
  moves,
  learned,
  accent,
  hydrated,
  onToggle,
}: {
  moves: NotationMove[];
  learned: Record<string, true>;
  accent: string;
  hydrated: boolean;
  onToggle: (itemId: string) => void;
}) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {moves.map((notation) => {
        const itemId = notationItemId(notation.id);
        const isLearned = learned[itemId] === true;
        return (
          <li
            key={notation.id}
            className="flex flex-col gap-3 rounded-2xl bg-navy px-4 pt-4 pb-3"
          >
            <Image
              src={notation.image}
              alt={`Diagrama de los giros ${notation.move} y ${notation.move}'`}
              width={notation.width}
              height={notation.height}
              className="mx-auto h-auto w-full"
              style={{ maxWidth: notation.width }}
            />
            <div className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-mono text-lg font-semibold text-foreground">
                  {notation.move} · {notation.move}&apos;
                </span>
                <span className="text-sm text-navy-muted">{notation.label}</span>
                {notation.note && (
                  <span className="mt-1 text-xs leading-snug text-navy-muted/80 italic">
                    {notation.note}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onToggle(itemId)}
                disabled={!hydrated}
                aria-pressed={isLearned}
                aria-label={`${notation.move} aprendido`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors active:scale-95 disabled:opacity-50"
                style={
                  isLearned
                    ? { backgroundColor: accent, borderColor: accent, color: "var(--navy)" }
                    : { borderColor: "var(--navy-border)", color: "var(--navy-muted)" }
                }
              >
                <CheckIcon className={`h-5 w-5 ${isLearned ? "" : "opacity-40"}`} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** What each cube's list of extra moves says above them. */
const EXTRA_MOVES_TEXT = {
  "3x3": {
    title: "Movimientos en minúscula",
    text: "Una letra en minúscula gira 2 capas a la vez: la cara y la capa del medio que tiene al lado, las dos hacia donde gira la cara. Algunas hojas la escriben con w: Rw es r. Con ' va al revés y con 2 es media vuelta. x, y y z no cambian: giran todo el cubo.",
    badge: "(2x)",
  },
  pyraminx: {
    title: "Giros de cara y del Pyraminx entero",
    text: "Los usan los métodos Top First. Fw, Lw, Rw y Dw giran una cara entera: todo lo que no es la capa de la punta opuesta, un tercio de vuelta en sentido horario mirando esa cara. [U], [L], [R] y [B] giran todo el Pyraminx como su letra, sin cambiar nada: solo cambia cómo lo sujetas. Con ' van al revés.",
    badge: "",
  },
} as const;

/** 3×3: lowercase moves, with "(2x)" beside the letter. Pyraminx: face turns and whole turns. */
export function WideMoveList({
  moves,
  accent,
  cube = "3x3",
}: {
  moves: WideMove[];
  accent: string;
  cube?: keyof typeof EXTRA_MOVES_TEXT;
}) {
  const { title, text, badge } = EXTRA_MOVES_TEXT[cube];
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-navy px-4 py-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-navy-muted">{text}</p>
      <ul className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {moves.map((wide) => (
          <li
            key={wide.move}
            className="flex flex-col gap-0.5 rounded-xl border border-navy-border bg-navy-2 px-3 py-2.5"
          >
            <span className="font-mono text-lg font-semibold text-foreground">
              {wide.move}
              {badge && (
                <>
                  {" "}
                  <span className="text-sm font-semibold" style={{ color: accent }}>
                    {badge}
                  </span>
                </>
              )}
            </span>
            <span className="text-xs leading-snug text-navy-muted">{wide.label}</span>
            {wide.equals && (
              <span className="font-mono text-xs text-navy-muted">= {wide.equals}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
