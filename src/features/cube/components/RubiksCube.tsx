"use client";

import { useMemo } from "react";
import { useCubeStore } from "@/store/cubeStore";
import { getFaceDef, parseMove } from "../moves";
import type { Cubie as CubieState } from "../types";
import { AnimatedLayer } from "./AnimatedLayer";
import { Cubie } from "./Cubie";

/**
 * Renders the cube from the shared store state. When a move is animating,
 * the affected layer's pieces are rendered inside a rotating group while
 * the rest render normally; once the animation finishes, the store's
 * state already reflects the final positions/orientations.
 */
export function RubiksCube() {
  const cubeState = useCubeStore((s) => s.cubeState);
  const activeMove = useCubeStore((s) => s.activeMove);
  const moveId = useCubeStore((s) => s.moveId);
  const finishActiveMove = useCubeStore((s) => s.finishActiveMove);

  const { rest, affected, axis } = useMemo(() => {
    if (!activeMove) {
      return { rest: cubeState.cubies, affected: [] as CubieState[], axis: 0 as 0 | 1 | 2 };
    }
    const { face } = parseMove(activeMove);
    const { axis, layer } = getFaceDef(face);
    const rest: CubieState[] = [];
    const affected: CubieState[] = [];
    for (const cubie of cubeState.cubies) {
      (cubie.position[axis] === layer ? affected : rest).push(cubie);
    }
    return { rest, affected, axis };
  }, [cubeState, activeMove]);

  return (
    <group>
      {rest.map((cubie) => (
        <Cubie key={cubie.id} cubie={cubie} />
      ))}
      {activeMove && (
        <AnimatedLayer
          key={moveId}
          move={activeMove}
          axis={axis}
          cubies={affected}
          onComplete={finishActiveMove}
        />
      )}
    </group>
  );
}
