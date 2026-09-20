"use client";

import { OptionDropdown } from "@/components/ui/option-dropdown";
import { CUBES } from "@/features/trainer/cubes";
import { METHODS } from "@/features/trainer/methods";
import { useTrainerPreferences } from "@/features/trainer/store";

export function RightPanel({ className = "" }: { className?: string }) {
  const cubeId = useTrainerPreferences((state) => state.cubeId);
  const methodId = useTrainerPreferences((state) => state.methodId);
  const setCube = useTrainerPreferences((state) => state.setCube);
  const setMethod = useTrainerPreferences((state) => state.setMethod);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
        Configuración
      </h2>
      <div className="flex flex-col gap-5">
        <OptionDropdown
          label="Cubo"
          options={CUBES}
          selectedId={cubeId}
          onSelect={setCube}
        />
        <OptionDropdown
          label="Método"
          options={METHODS}
          selectedId={methodId}
          onSelect={setMethod}
        />
      </div>
    </div>
  );
}
