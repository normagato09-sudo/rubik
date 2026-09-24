"use client";

import { useCubeStore } from "@/store/cubeStore";
import { CubeBody } from "./CubeBody";

/** Renders the live solve cube from `cubeStore`. See `CubeBody` for the actual rendering/animation logic. */
export function RubiksCube() {
  const cubeState = useCubeStore((s) => s.cubeState);
  const activeMove = useCubeStore((s) => s.activeMove);
  const moveId = useCubeStore((s) => s.moveId);
  const finishActiveMove = useCubeStore((s) => s.finishActiveMove);

  return (
    <CubeBody
      cubeState={cubeState}
      activeMove={activeMove}
      moveId={moveId}
      onMoveComplete={finishActiveMove}
    />
  );
}
