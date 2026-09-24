import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { F2L_CATEGORY } from "../categories";
import type { F2LCase } from "../f2l-cases";
import { f2lItemId } from "../progress-store";

export function F2LCaseList({
  cases,
  learned,
}: {
  cases: F2LCase[];
  learned: Record<string, true>;
}) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {cases.map((f2lCase) => {
        const isLearned = learned[f2lItemId(f2lCase.id)] === true;
        return (
          <li key={f2lCase.id}>
            <Link
              href={`/entrenar/f2l/${f2lCase.id}`}
              className="flex items-center gap-3 rounded-2xl bg-navy px-3 py-2.5 transition-colors hover:bg-navy-3 active:scale-[0.99]"
            >
              <Image
                src={f2lCase.image}
                alt={`Diagrama del caso F2L ${f2lCase.number}`}
                width={151}
                height={161}
                className="h-16 w-auto shrink-0"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-semibold tracking-wide text-navy-muted uppercase">
                  Caso {f2lCase.id}
                </span>
                <span className="font-mono text-sm leading-snug font-medium break-words text-foreground">
                  {f2lCase.algorithm}
                </span>
              </span>
              {isLearned ? (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-navy"
                  style={{ backgroundColor: F2L_CATEGORY.accent }}
                  aria-label="Aprendido"
                  role="img"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span
                  className="h-6 w-6 shrink-0 rounded-full border-2 border-navy-border"
                  aria-hidden="true"
                />
              )}
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-navy-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
