"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { matchesCase, type AlgorithmSetId } from "../algorithm-sets";
import { LEARNING_CATEGORIES, getCategory, type LearningCategoryId } from "../categories";
import {
  NOTATION_MOVES,
  WIDE_MOVES,
  matchesNotationMove,
  matchesWideMove,
} from "../notation";
import {
  caseItemId,
  countLearned,
  notationItemId,
  useLearningProgress,
} from "../progress-store";
import { ALGORITHM_SETS, LEARNING_STEPS, getSetInfo } from "../sets";
import { useLearningProgressHydration } from "../use-progress-hydration";
import { CaseList } from "./CaseList";
import { CategoryCard } from "./CategoryCard";
import { NotationList, WideMoveList } from "./NotationList";

const setItemIds = (setId: AlgorithmSetId) =>
  ALGORITHM_SETS[setId].map((algorithmCase) => caseItemId(setId, algorithmCase.id));

const ITEM_IDS: Record<LearningCategoryId, string[]> = {
  notation: NOTATION_MOVES.map((notation) => notationItemId(notation.id)),
  steps: LEARNING_STEPS.flatMap((step) => setItemIds(step.setId)),
  f2l: setItemIds("f2l"),
  oll: setItemIds("oll"),
  pll: setItemIds("pll"),
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

  /** What a block shows, filtered by the search ("" shows everything). */
  const content = (id: LearningCategoryId, filter: string): { count: number; node: ReactNode } => {
    if (id === "notation") {
      const accent = getCategory("notation").accent;
      const moves = NOTATION_MOVES.filter((notation) => matchesNotationMove(notation, filter));
      const wideMoves = WIDE_MOVES.filter((wide) => matchesWideMove(wide, filter));
      return {
        count: moves.length + wideMoves.length,
        node: (
          <div className="flex flex-col gap-2">
            {moves.length > 0 && (
              <NotationList
                moves={moves}
                learned={learned}
                accent={accent}
                hydrated={hydrated}
                onToggle={toggleLearned}
              />
            )}
            {wideMoves.length > 0 && <WideMoveList moves={wideMoves} accent={accent} />}
          </div>
        ),
      };
    }

    if (id === "steps") {
      const steps = LEARNING_STEPS.map((step) => ({
        ...step,
        cases: ALGORITHM_SETS[step.setId].filter((algorithmCase) =>
          matchesCase(algorithmCase, filter),
        ),
      })).filter((step) => step.cases.length > 0);
      return {
        count: steps.reduce((total, step) => total + step.cases.length, 0),
        node: (
          <div className="flex flex-col gap-4">
            {steps.map((step) => {
              const itemIds = setItemIds(step.setId);
              return (
                <div key={step.setId} className="flex flex-col gap-2">
                  <h3 className="flex items-baseline justify-between px-1 text-sm font-semibold text-foreground">
                    {getSetInfo(step.setId).title}
                    {hydrated && (
                      <span className="text-xs font-semibold text-navy-muted tabular-nums">
                        {countLearned(learned, itemIds)}/{itemIds.length}
                      </span>
                    )}
                  </h3>
                  <CaseList cases={step.cases} learned={learned} />
                </div>
              );
            })}
          </div>
        ),
      };
    }

    const cases = ALGORITHM_SETS[id].filter((algorithmCase) => matchesCase(algorithmCase, filter));
    return { count: cases.length, node: <CaseList cases={cases} learned={learned} /> };
  };

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
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="flex w-fit items-center gap-1 text-sm text-navy-muted hover:text-foreground"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180" />
          Inicio
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Aprender a resolver</h1>
      </div>

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
