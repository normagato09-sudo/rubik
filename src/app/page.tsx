"use client";

import Link from "next/link";
import { CubeMark } from "@/components/cube-mark";
import { OptionDropdown } from "@/components/ui/option-dropdown";
import { CUBES } from "@/features/trainer/cubes";
import { getSelectableMethodsForCubeType } from "@/features/trainer/methods";
import { useTrainerPreferences } from "@/features/trainer/store";

export default function HomePage() {
  const cubeId = useTrainerPreferences((state) => state.cubeId);
  const methodId = useTrainerPreferences((state) => state.methodId);
  const setCube = useTrainerPreferences((state) => state.setCube);
  const setMethod = useTrainerPreferences((state) => state.setMethod);

  return (
    <div className="relative flex min-h-[calc(100dvh-3rem)] flex-col items-center justify-center gap-10">
      {/* Subtle brand glow behind the wordmark — the only non-accent color on
          the screen, kept faint so it reads as texture, not a second CTA color. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/3 rounded-full bg-cube-blue/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-3">
        <CubeMark className="h-11 w-11" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          RUBIKO
        </h1>
      </div>

      <div className="relative flex w-full max-w-sm flex-col gap-5">
        <OptionDropdown
          label="Cubo"
          options={CUBES}
          selectedId={cubeId}
          onSelect={setCube}
          size="lg"
        />
        <OptionDropdown
          label="Método"
          options={getSelectableMethodsForCubeType(cubeId)}
          selectedId={methodId}
          onSelect={setMethod}
          size="lg"
        />
      </div>

      <Link
        // Aprender starts at Notación, then continues to F2L, OLL and PLL.
        href="/entrenar?abierto=notation"
        className="relative flex w-full max-w-sm items-center justify-center rounded-2xl bg-accent py-4 text-lg font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover active:scale-[0.98]"
      >
        Aprender
      </Link>

      <Link
        href="/solucionador"
        className="relative -mt-6 flex w-full max-w-sm items-center justify-center rounded-2xl border border-border bg-surface py-4 text-lg font-semibold text-foreground transition-all hover:border-accent/40 active:scale-[0.98]"
      >
        Solucionador
      </Link>
    </div>
  );
}
