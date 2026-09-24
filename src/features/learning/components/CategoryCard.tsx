import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import type { LearningCategory } from "../categories";
import { CategoryIcon } from "./CategoryIcon";
import { ProgressBar } from "./ProgressBar";

/** One expandable block of the Aprender screen, with its X/Y progress. */
export function CategoryCard({
  category,
  total,
  learned,
  expanded,
  onToggle,
  children,
}: {
  category: LearningCategory;
  total: number;
  /** `null` while saved progress is still loading — never show a false count. */
  learned: number | null;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { accent } = category;
  const panelId = `categoria-${category.id}`;

  return (
    <section
      className="overflow-hidden rounded-3xl border bg-navy-2 transition-colors"
      style={{ borderColor: expanded ? `${accent}66` : "var(--navy-border)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-navy-3/60"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-navy-muted"
          style={{ backgroundColor: `${accent}1f` }}
        >
          <CategoryIcon id={category.id} accent={accent} className="h-6 w-6" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-lg leading-tight font-semibold text-foreground">
            {category.title}
          </span>
          <span className="text-sm leading-snug text-navy-muted">{category.description}</span>
          <span className="mt-3 flex items-center gap-3">
            <ProgressBar
              value={learned ?? 0}
              total={total}
              accent={accent}
              label={`Progreso de ${category.title}`}
            />
            <span
              className={`shrink-0 text-sm font-semibold tabular-nums transition-opacity ${
                learned === null ? "opacity-0" : "opacity-100"
              }`}
              style={{ color: accent }}
            >
              {learned ?? 0}/{total}
            </span>
          </span>
        </span>

        <ChevronDownIcon
          className={`mt-3 h-6 w-6 shrink-0 text-navy-muted transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div id={panelId} className="border-t border-navy-border p-3">
          {children}
        </div>
      )}
    </section>
  );
}
