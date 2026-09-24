import { describe, expect, it } from "vitest";
import { createSolvedCube } from "./model";
import { ALL_MOVES, FACES, applyMove, applyMoves, inverseMove, invertMoves } from "./moves";
import type { Move } from "./moves";

const solved = createSolvedCube();

describe("cube move engine", () => {
  it.each(FACES)("%s applied 4 times returns to the solved state", (face) => {
    let state = solved;
    for (let i = 0; i < 4; i++) state = applyMove(state, face);
    expect(state).toEqual(solved);
  });

  it.each(FACES)("%s followed by its inverse returns to the solved state", (face) => {
    const turned = applyMove(solved, face);
    const restored = applyMove(turned, `${face}'` as Move);
    expect(restored).toEqual(solved);
  });

  it.each(FACES)("%s2 applied twice returns to the solved state", (face) => {
    const move = `${face}2` as Move;
    const restored = applyMove(applyMove(solved, move), move);
    expect(restored).toEqual(solved);
  });

  it.each(FACES)("%s2 is equivalent to applying %s twice", (face) => {
    const viaDouble = applyMove(solved, `${face}2` as Move);
    const viaTwoPlain = applyMove(applyMove(solved, face), face);
    expect(viaDouble).toEqual(viaTwoPlain);
  });

  it("every move has a correct inverse", () => {
    for (const move of ALL_MOVES) {
      const turned = applyMove(solved, move);
      const restored = applyMove(turned, inverseMove(move));
      expect(restored).toEqual(solved);
    }
  });

  it("R U R' U' changes the cube state", () => {
    const scrambled = applyMoves(solved, ["R", "U", "R'", "U'"]);
    expect(scrambled).not.toEqual(solved);
  });

  it("applying the inverse sequence restores the solved state", () => {
    const scrambled = applyMoves(solved, ["R", "U", "R'", "U'"]);
    const restored = applyMoves(scrambled, ["U", "R", "U'", "R'"]);
    expect(restored).toEqual(solved);
  });

  it("a longer sequence followed by its full inverse restores the solved state", () => {
    const sequence: Move[] = ["R", "U2", "F'", "L", "D2", "B'", "R2", "U'"];
    const inverse = [...sequence].reverse().map(inverseMove);
    const scrambled = applyMoves(solved, sequence);
    const restored = applyMoves(scrambled, inverse);
    expect(restored).toEqual(solved);
  });

  describe("invertMoves", () => {
    it("undoes a sequence exactly, so applying both in order restores the solved state", () => {
      const sequence: Move[] = ["F", "U'", "R", "U"];
      const restored = applyMoves(applyMoves(solved, sequence), invertMoves(sequence));
      expect(restored).toEqual(solved);
    });

    it("reverses order and inverts each move", () => {
      expect(invertMoves(["R", "U'", "F2"])).toEqual(["F2", "U", "R'"]);
    });

    it("is its own inverse (applying it twice restores the original sequence's effect)", () => {
      const sequence: Move[] = ["R", "U", "R'", "U'"];
      const state = applyMoves(solved, sequence);
      const undone = applyMoves(state, invertMoves(sequence));
      const redone = applyMoves(undone, invertMoves(invertMoves(sequence)));
      expect(redone).toEqual(state);
    });
  });
});
