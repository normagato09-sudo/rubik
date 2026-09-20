import { create } from "zustand";
import { createSolvedCube } from "@/features/cube/model";
import { applyMove } from "@/features/cube/moves";
import type { Move } from "@/features/cube/moves";
import type { CubeState } from "@/features/cube/types";

interface CubeStore {
  cubeState: CubeState;
  /** Move currently being animated by the 3D layer, if any. */
  activeMove: Move | null;
  /** Bumped every time a new move starts animating, so components can key off it. */
  moveId: number;
  /** Moves waiting for the current animation to finish. */
  queue: Move[];
  requestMove: (move: Move) => void;
  /** Called by the 3D layer once a move's animation reaches its target angle. */
  finishActiveMove: () => void;
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  cubeState: createSolvedCube(),
  activeMove: null,
  moveId: 0,
  queue: [],
  requestMove: (move) => {
    const { activeMove, queue, moveId } = get();
    if (activeMove === null) {
      set({ activeMove: move, moveId: moveId + 1 });
    } else {
      set({ queue: [...queue, move] });
    }
  },
  finishActiveMove: () => {
    const { activeMove, cubeState, queue, moveId } = get();
    if (activeMove === null) return;
    const [next, ...rest] = queue;
    set({
      cubeState: applyMove(cubeState, activeMove),
      activeMove: next ?? null,
      moveId: next ? moveId + 1 : moveId,
      queue: rest,
    });
  },
}));
