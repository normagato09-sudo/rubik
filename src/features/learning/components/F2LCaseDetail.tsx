"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { F2L_CATEGORY } from "../categories";
import { F2L_CASES, getAdjacentF2LCases, getF2LCase, getF2LSteps } from "../f2l-cases";
import { f2lItemId, useLearningProgress } from "../progress-store";
import { useLearningProgressHydration } from "../use-progress-hydration";
import { CheckIcon } from "./F2LCaseList";

/**
 * Read-only guide for one F2L case: diagram, algorithm and its moves as
 * numbered steps, to reproduce on a physical cube. Nothing here moves or
 * animates a cube — the only interaction is marking the case as learned.
 */
export function F2LCaseDetail({ caseId }: { caseId: string }) {
  const f2lCase = getF2LCase(caseId)!;
  const steps = getF2LSteps(f2lCase);
  const { previous, next } = getAdjacentF2LCases(caseId);
  const accent = F2L_CATEGORY.accent;

  const hydrated = useLearningProgressHydration();
  const itemId = f2lItemId(f2lCase.id);
  const isLearned = useLearningProgress((state) => state.learned[itemId] === true);
  const toggleLearned = useLearningProgress((state) => state.toggleLearned);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <Link
        href="/entrenar?abierto=f2l"
        className="flex w-fit items-center gap-1 text-sm text-navy-muted hover:text-foreground"
      >
        <ChevronRightIcon className="h-4 w-4 rotate-180" />
        Aprender
      </Link>

      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: accent }}>
            {F2L_CATEGORY.title}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Caso {f2lCase.id}</h1>
        </div>
        <span
          className="rounded-full px-3 py-1 text-sm font-semibold tabular-nums"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
          aria-label={`Caso ${f2lCase.number} de ${F2L_CASES.length}`}
        >
          {f2lCase.number}/{F2L_CASES.length}
        </span>
      </header>

      <div className="flex justify-center rounded-3xl border border-navy-border bg-navy-2 py-6">
        <Image
          src={f2lCase.image}
          alt={`Diagrama del caso F2L ${f2lCase.number}`}
          width={151}
          height={161}
          priority
          className="h-40 w-auto"
        />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-navy-muted uppercase">
          Algoritmo
        </h2>
        <p
          className="rounded-2xl border border-l-4 border-navy-border bg-navy-2 px-4 py-4 font-mono text-xl leading-snug font-semibold break-words text-foreground"
          style={{ borderLeftColor: accent }}
        >
          {f2lCase.algorithm}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="flex items-baseline justify-between text-xs font-semibold tracking-wide text-navy-muted uppercase">
          Pasos
          <span className="font-normal normal-case tabular-nums">
            {steps.length} movimientos
          </span>
        </h2>
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((move, index) => (
            <li
              key={index}
              className="flex flex-col items-center gap-0.5 rounded-xl border border-navy-border bg-navy-2 py-2.5"
            >
              <span className="text-[11px] font-medium text-navy-muted tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-xl font-semibold text-foreground">{move}</span>
            </li>
          ))}
        </ol>
      </section>

      <button
        type="button"
        onClick={() => toggleLearned(itemId)}
        disabled={!hydrated}
        aria-pressed={isLearned}
        className="flex h-13 items-center justify-center gap-2 rounded-2xl border-2 text-base font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
        style={
          isLearned
            ? { backgroundColor: accent, borderColor: accent, color: "var(--navy)" }
            : { borderColor: accent, color: accent }
        }
      >
        {isLearned && <CheckIcon className="h-5 w-5" />}
        {isLearned ? "Aprendido" : "Marcar como aprendido"}
      </button>

      <nav className="grid grid-cols-2 gap-3" aria-label="Casos F2L">
        {previous ? (
          <Link
            href={`/entrenar/f2l/${previous.id}`}
            className="flex h-12 items-center justify-center gap-1 rounded-2xl bg-navy-2 text-sm font-medium text-foreground transition-colors hover:bg-navy-3"
          >
            <ChevronRightIcon className="h-4 w-4 rotate-180" />
            Caso {previous.id}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/entrenar/f2l/${next.id}`}
            className="flex h-12 items-center justify-center gap-1 rounded-2xl bg-navy-2 text-sm font-medium text-foreground transition-colors hover:bg-navy-3"
          >
            Caso {next.id}
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
