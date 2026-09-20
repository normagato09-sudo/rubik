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
    <div className={`flex flex-col gap-6 ${className}`}>
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
  );
}
