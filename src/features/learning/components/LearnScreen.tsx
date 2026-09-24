"use client";

import { useState, type ReactNode } from "react";
import { matchesCase, type AlgorithmSetId } from "../algorithm-sets";
import { LEARNING_CATEGORIES, getCategory, type LearningCategoryId } from "../categories";
import { NOTATION_MOVES, matchesNotationMove, type NotationMove } from "../notation";
import {
  caseItemId,
  countLearned,
  notationItemId,
  useLearningProgress,
} from "../progress-store";
import { ALGORITHM_SETS } from "../sets";
import { useLearningProgressHydration } from "../use-progress-hydration";
import { CaseList } from "./CaseList";
import { CategoryCard } from "./CategoryCard";
import { NotationList } from "./NotationList";

const ITEM_IDS: Record<LearningCategoryId, string[]> = {
  notation: NOTATION_MOVES.map((notation) => notationItemId(notation.id)),
  f2l: ALGORITHM_SETS.f2l.map((algorithmCase) => caseItemId("f2l", algorithmCase.id)),
  oll: ALGORITHM_SETS.oll.map((algorithmCase) => caseItemId("oll", algorithmCase.id)),
  pll: ALGORITHM_SETS.pll.map((algorithmCase) => caseItemId("pll", algorithmCase.id)),
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

  const content = (id: LearningCategoryId, filter: string) => {
    if (id === "notation") {
      const moves = NOTATION_MOVES.filter((notation) => matchesNotationMove(notation, filter));
      return { count: moves.length, node: notationList(moves) };
    }
    const cases = ALGORITHM_SETS[id as AlgorithmSetId].filter((algorithmCase) =>
      matchesCase(algorithmCase, filter),
    );
    return { count: cases.length, node: <CaseList cases={cases} learned={learned} /> };
  };

  const notationList = (moves: NotationMove[]) => (
    <NotationList
      moves={moves}
      learned={learned}
      accent={getCategory("notation").accent}
      hydrated={hydrated}
      onToggle={toggleLearned}
    />
  );

  const toggle = (id: LearningCategoryId) =>
    setExpanded((current) =>
      current.includes(id) ? current.filter((open) => open !== id) : [...current, id],
    );

  const results = trimmedQuery
    ? LEARNING_CATEGORIES.map((category) => ({
        category,
        ...content(category.id, trimmedQuery),
      })).filter((result) => result.count > 0)
    : [];
  const resultCount = results.reduce((total, result) => total + result.count, 0);

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
          {results.map(({ category, node }) => (
            <SearchGroup key={category.id} title={category.title}>
              {node}
            </SearchGroup>
          ))}
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          {LEARNING_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              total={ITEM_IDS[category.id].length}
              learned={hydrated ? countLearned(learned, ITEM_IDS[category.id]) : null}
              expanded={expanded.includes(category.id)}
              onToggle={() => toggle(category.id)}
            >
              {expanded.includes(category.id) && content(category.id, "").node}
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
