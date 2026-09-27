"use client";

import { useMemo } from "react";
import { getFaceDef, isInLayer, parseMove } from "../moves";
import type { Move } from "../moves";
import type { CubeSize, Cubie as CubieState, CubeState } from "../types";
import { AnimatedLayer } from "./AnimatedLayer";
import { Cubie } from "./Cubie";

/**
 * Splits `cubeState` into the layer currently animating (if any) and the
 * rest, and renders both. Store-agnostic on purpose: `RubiksCube` feeds it
 * the live solve state from `cubeStore`, while a training screen can feed
 * it its own local state, without duplicating this split/animate logic.
 */
export function CubeBody({
  cubeState,
  activeMove,
  moveId,
  onMoveComplete,
  size = 3,
}: {
  cubeState: CubeState;
  activeMove: Move | null;
  moveId: number;
  onMoveComplete: () => void;
  size?: CubeSize;
}) {
  const { rest, affected, axis } = useMemo(() => {
    if (!activeMove) {
      return { rest: cubeState.cubies, affected: [] as CubieState[], axis: 0 as 0 | 1 | 2 };
    }
    const { face } = parseMove(activeMove);
    const { axis } = getFaceDef(face);
    const rest: CubieState[] = [];
    const affected: CubieState[] = [];
    for (const cubie of cubeState.cubies) {
      (isInLayer(face, cubie.position) ? affected : rest).push(cubie);
    }
    return { rest, affected, axis };
  }, [cubeState, activeMove]);

  return (
    <group>
      {rest.map((cubie) => (
        <Cubie key={cubie.id} cubie={cubie} size={size} />
      ))}
      {activeMove && (
        <AnimatedLayer
          key={moveId}
          move={activeMove}
          axis={axis}
          cubies={affected}
          size={size}
          onComplete={onMoveComplete}
        />
      )}
    </group>
  );
}
