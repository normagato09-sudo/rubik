import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import type { LearningCategory } from "../categories";
import { CategoryIcon } from "./CategoryIcon";
import { ProgressBar } from "./ProgressBar";

/**
 * One expandable block of the Aprender screen. Categories without real
 * content show "Próximamente" and cannot be expanded — never a made-up
 * X/Y total.
 */
export function CategoryCard({
  category,
  progress,
  expanded,
  onToggle,
  children,
}: {
  category: LearningCategory;
  /** `null` while saved progress is still loading. */
  progress: { learned: number; total: number } | null;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const { accent, available } = category;
  const panelId = `categoria-${category.id}`;

  const header = (
    <>
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
        <span className="text-sm leading-snug text-navy-muted">
          {category.description}
        </span>

        {available ? (
          <span className="mt-3 flex items-center gap-3">
            <ProgressBar
              value={progress?.learned ?? 0}
              total={progress?.total ?? 0}
              accent={accent}
              label={`Progreso de ${category.title}`}
            />
            <span
              className={`shrink-0 text-sm font-semibold tabular-nums transition-opacity ${
                progress ? "opacity-100" : "opacity-0"
              }`}
              style={{ color: accent }}
            >
              {progress ? `${progress.learned}/${progress.total}` : "0/0"}
            </span>
          </span>
        ) : (
          <span className="mt-3 w-fit rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-navy-muted uppercase">
            Próximamente
          </span>
        )}
      </span>
    </>
  );

  return (
    <section
      className="overflow-hidden rounded-3xl border bg-navy-2 transition-colors"
      style={{ borderColor: expanded ? `${accent}66` : "var(--navy-border)" }}
    >
      {available ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-navy-3/60"
        >
          {header}
          <ChevronDownIcon
            className={`mt-3 h-6 w-6 shrink-0 text-navy-muted transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        <div className="flex w-full items-start gap-4 p-5 opacity-70">{header}</div>
      )}

      {available && expanded && (
        <div id={panelId} className="border-t border-navy-border p-3">
          {children}
        </div>
      )}
    </section>
  );
}
