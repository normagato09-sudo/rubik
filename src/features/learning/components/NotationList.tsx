import Image from "next/image";
import type { NotationMove } from "../notation";
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
