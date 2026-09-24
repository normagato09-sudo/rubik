"use client";

import { useState, type ReactNode } from "react";
import { LEARNING_CATEGORIES, type LearningCategoryId } from "../categories";
import { F2L_CASES, matchesF2LCase } from "../f2l-cases";
import { NOTATION_MOVES, matchesNotationMove } from "../notation";
import {
  countLearned,
  f2lItemId,
  notationItemId,
  useLearningProgress,
} from "../progress-store";
import { useLearningProgressHydration } from "../use-progress-hydration";
import { CategoryCard } from "./CategoryCard";
import { F2LCaseList } from "./F2LCaseList";
import { NotationList } from "./NotationList";

const F2L_ITEM_IDS = F2L_CASES.map((f2lCase) => f2lItemId(f2lCase.id));
const NOTATION_ITEM_IDS = NOTATION_MOVES.map((notation) => notationItemId(notation.id));
const NOTATION_ACCENT = LEARNING_CATEGORIES.find((category) => category.id === "notation")!.accent;

const PROGRESS_ITEMS: Partial<Record<LearningCategoryId, string[]>> = {
  notation: NOTATION_ITEM_IDS,
  f2l: F2L_ITEM_IDS,
};

export function LearnScreen({
  initialExpanded = [],
}: {
  initialExpanded?: LearningCategoryId[];
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<LearningCategoryId[]>(initialExpanded);
  const hydrated = useLearningProgressHydration();
  const learned = useLearningProgress((state) => state.learned);
  const toggleLearned = useLearningProgress((state) => state.toggleLearned);

  const trimmedQuery = query.trim();
  const f2lResults = F2L_CASES.filter((f2lCase) => matchesF2LCase(f2lCase, trimmedQuery));
  const notationResults = NOTATION_MOVES.filter((notation) =>
    matchesNotationMove(notation, trimmedQuery),
  );
  const resultCount = f2lResults.length + notationResults.length;

  const notationList = (moves: typeof NOTATION_MOVES) => (
    <NotationList
      moves={moves}
      learned={learned}
      accent={NOTATION_ACCENT}
      hydrated={hydrated}
      onToggle={toggleLearned}
    />
  );

  const progressFor = (id: LearningCategoryId) => {
    const itemIds = PROGRESS_ITEMS[id];
    if (!itemIds || !hydrated) return null;
    return { learned: countLearned(learned, itemIds), total: itemIds.length };
  };

  const toggle = (id: LearningCategoryId) =>
    setExpanded((current) =>
      current.includes(id) ? current.filter((open) => open !== id) : [...current, id],
    );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Aprender a resolver</h1>

      <label className="relative block">
        <span className="sr-only">Buscar algoritmos</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-navy-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar algoritmos..."
          autoComplete="off"
          spellCheck={false}
          className="h-13 w-full rounded-2xl border border-navy-border bg-navy-2 pr-4 pl-12 text-base text-foreground placeholder:text-navy-muted focus:border-accent focus:outline-none"
        />
      </label>

      {trimmedQuery ? (
        <section className="flex flex-col gap-4" aria-live="polite">
          <p className="text-sm text-navy-muted">
            {resultCount === 0
              ? `Sin resultados para “${trimmedQuery}”`
              : `${resultCount} ${resultCount === 1 ? "resultado" : "resultados"}`}
          </p>
          {notationResults.length > 0 && (
            <SearchGroup title="Notación del Cubo">{notationList(notationResults)}</SearchGroup>
          )}
          {f2lResults.length > 0 && (
            <SearchGroup title="F2L (CFOP)">
              <F2LCaseList cases={f2lResults} learned={learned} />
            </SearchGroup>
          )}
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          {LEARNING_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              progress={progressFor(category.id)}
              expanded={expanded.includes(category.id)}
              onToggle={() => toggle(category.id)}
            >
              {category.id === "notation" && notationList(NOTATION_MOVES)}
              {category.id === "f2l" && <F2LCaseList cases={F2L_CASES} learned={learned} />}
            </CategoryCard>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-navy-muted uppercase">{title}</h2>
      <div className="rounded-3xl border border-navy-border bg-navy-2 p-3">{children}</div>
    </div>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
