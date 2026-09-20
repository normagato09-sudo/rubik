import { beforeEach, describe, expect, it } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import type { Move } from "@/features/cube/moves";
import { useCubeStore } from "./cubeStore";

const solved = createSolvedCube();

function state() {
  return useCubeStore.getState();
}

/** Mimics what the 3D layer does: request a move, then report it finished. */
function performMove(move: Move) {
  state().requestMove(move);
  state().finishActiveMove();
}

beforeEach(() => {
  useCubeStore.setState({
    cubeState: createSolvedCube(),
    activeMove: null,
    moveId: 0,
    queue: [],
    scramble: null,
  });
});

describe("cubeStore resetCube", () => {
  it("keeps a solved cube solved", () => {
    state().resetCube();
    expect(state().cubeState).toEqual(solved);
  });

  it("returns to solved after a single manual move", () => {
    performMove("R");
    expect(state().cubeState).not.toEqual(solved);

    state().resetCube();
    expect(state().cubeState).toEqual(solved);
    expect(state().activeMove).toBeNull();
    expect(state().queue).toEqual([]);
  });

  it("returns to solved after several manual moves", () => {
    (["R", "U", "F'", "L2"] as Move[]).forEach(performMove);
    expect(state().cubeState).not.toEqual(solved);

    state().resetCube();
    expect(state().cubeState).toEqual(solved);
  });

  it("returns to solved after a scramble and clears it", () => {
    state().requestScramble();
    while (state().activeMove !== null) {
      state().finishActiveMove();
    }
    expect(state().scramble).not.toBeNull();
    expect(state().cubeState).not.toEqual(solved);

    state().resetCube();
    expect(state().cubeState).toEqual(solved);
    expect(state().scramble).toBeNull();
  });

  it("resets safely while a move is animating, without leaving a stale queue", () => {
    state().requestMove("R");
    state().requestMove("U");
    expect(state().activeMove).toBe("R");
    expect(state().queue).toEqual(["U"]);

    state().resetCube();

    expect(state().cubeState).toEqual(solved);
    expect(state().activeMove).toBeNull();
    expect(state().queue).toEqual([]);
  });

  it("does not break manual moves afterwards", () => {
    state().resetCube();
    performMove("R");
    expect(state().cubeState).not.toEqual(solved);
  });

  it("does not break scramble afterwards", () => {
    state().resetCube();
    state().requestScramble();
    expect(state().scramble).not.toBeNull();
    expect(state().activeMove).not.toBeNull();
  });
});
