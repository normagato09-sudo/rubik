import { create } from "zustand";
import { createSolvedCube } from "@/features/cube/model";
import { applyMove } from "@/features/cube/moves";
import type { Move } from "@/features/cube/moves";
import type { CubeState } from "@/features/cube/types";
import { generateScramble } from "@/features/scramble/generator";

interface CubeStore {
  cubeState: CubeState;
  /** Move currently being animated by the 3D layer, if any. */
  activeMove: Move | null;
  /** Bumped every time a new move starts animating, so components can key off it. */
  moveId: number;
  /** Moves waiting for the current animation to finish. */
  queue: Move[];
  /**
   * The scramble currently applied to the cube, if any. Kept alongside the
   * cube state (rather than in its own store) so a future timer feature
   * can read "the scramble for this solve" from the same place the cube
   * state lives, without any extra wiring.
   */
  scramble: Move[] | null;
  requestMove: (move: Move) => void;
  /** Generates a new scramble, resets to solved, and queues it as real moves. */
  requestScramble: () => void;
  /** Called by the 3D layer once a move's animation reaches its target angle. */
  finishActiveMove: () => void;
  /**
   * Returns the cube to the solved state via the real model, discarding
   * any scramble and any move animation/queue in flight. Safe to call by
   * anything (UI button, timer, solver, ...) since it fully owns the
   * store's cube-related fields.
   */
  resetCube: () => void;
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  cubeState: createSolvedCube(),
  activeMove: null,
  moveId: 0,
  queue: [],
  scramble: null,
  requestMove: (move) => {
    const { activeMove, queue, moveId } = get();
    if (activeMove === null) {
      set({ activeMove: move, moveId: moveId + 1 });
    } else {
      set({ queue: [...queue, move] });
    }
  },
  requestScramble: () => {
    const scramble = generateScramble();
    const [first, ...rest] = scramble;
    const { moveId } = get();
    set({
      cubeState: createSolvedCube(),
      scramble,
      activeMove: first ?? null,
      moveId: first ? moveId + 1 : moveId,
      queue: rest,
    });
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
  resetCube: () => {
    set({
      cubeState: createSolvedCube(),
      scramble: null,
      activeMove: null,
      queue: [],
    });
  },
}));
