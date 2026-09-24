import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { IMAGE_SIZE, caseTitle, type AlgorithmCase } from "../algorithm-sets";
import { caseItemId } from "../progress-store";
import { getSetInfo } from "../sets";
import { CheckIcon } from "./CheckIcon";

/** Cases of one set (a learning step, F2L, OLL or PLL); each row opens its read-only detail. */
export function CaseList({
  cases,
  learned,
}: {
  cases: AlgorithmCase[];
  learned: Record<string, true>;
}) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {cases.map((algorithmCase) => {
        const { setId, id } = algorithmCase;
        const isLearned = learned[caseItemId(setId, id)] === true;
        const { title: setTitle, accent } = getSetInfo(setId);
        return (
          <li key={id}>
            <Link
              href={`/entrenar/${setId}/${id}`}
              className="flex items-center gap-3 rounded-2xl bg-navy px-3 py-2.5 transition-colors hover:bg-navy-3 active:scale-[0.99]"
            >
              <Image
                src={algorithmCase.image}
                alt={`Diagrama del ${caseTitle(algorithmCase)} de ${setTitle}`}
                {...IMAGE_SIZE[setId]}
                className="h-16 w-16 shrink-0 rounded-lg object-contain"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-semibold tracking-wide text-navy-muted uppercase">
                  {caseTitle(algorithmCase)}
                </span>
                <span className="font-mono text-sm leading-snug font-medium break-words text-foreground">
                  {algorithmCase.algorithm}
                </span>
              </span>
              {isLearned ? (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-navy"
                  style={{ backgroundColor: accent }}
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
