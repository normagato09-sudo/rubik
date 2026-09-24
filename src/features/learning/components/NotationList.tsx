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
              width={270}
              height={100}
              className="mx-auto h-auto w-full max-w-[270px]"
            />
            <div className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-mono text-lg font-semibold text-foreground">
                  {notation.move} · {notation.move}&apos;
                </span>
                <span className="text-sm text-navy-muted">{notation.label}</span>
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

/** Lowercase moves: the letter stays lowercase, with "(2x)" beside it. */
export function WideMoveList({ moves, accent }: { moves: WideMove[]; accent: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-navy px-4 py-4">
      <h3 className="text-sm font-semibold text-foreground">Movimientos en minúscula</h3>
      <p className="text-sm text-navy-muted">
        Una letra en minúscula gira 2 capas a la vez. x, y y z no cambian: giran todo el
        cubo.
      </p>
      <ul className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {moves.map((wide) => (
          <li
            key={wide.move}
            className="flex flex-col gap-0.5 rounded-xl border border-navy-border bg-navy-2 px-3 py-2.5"
          >
            <span className="font-mono text-lg font-semibold text-foreground">
              {wide.move}{" "}
              <span className="text-sm font-semibold" style={{ color: accent }}>
                (2x)
              </span>
            </span>
            <span className="text-xs leading-snug text-navy-muted">{wide.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
