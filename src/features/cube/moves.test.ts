import { describe, expect, it } from "vitest";
import { createSolvedCube } from "./model";
import { parseCubeAlgorithm } from "./algorithm";
import { ALL_MOVES, EVERY_MOVE, FACES, SLICES, WIDES, applyMove, applyMoves, inverseMove, invertMoves, isRotation } from "./moves";
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

describe("2×2 and whole-cube rotations", () => {
  const solved2 = createSolvedCube(2);

  it("a 2×2 has the 8 corners of a 3×3, same ids and stickers", () => {
    const corners3 = solved.cubies.filter((cubie) => cubie.stickers.length === 3);
    expect(solved2.cubies).toEqual(corners3);
  });

  it.each(FACES)("on a 2×2, %s four times, and %s then its inverse, return to solved", (face) => {
    expect(applyMoves(solved2, [face, face, face, face])).toEqual(solved2);
    expect(applyMoves(solved2, [face, inverseMove(face)])).toEqual(solved2);
  });

  it("a face turn moves the same corners on a 2×2 as on a 3×3", () => {
    const sequence: Move[] = ["R", "U", "F'", "L2", "D", "B'"];
    const corners = (state: typeof solved) => state.cubies.filter((cubie) => cubie.stickers.length === 3);
    expect(applyMoves(solved2, sequence)).toEqual({ cubies: corners(applyMoves(solved, sequence)) });
  });

  it.each(["x", "y", "z"] as Move[])("%s moves every corner, and is undone by its inverse", (rotation) => {
    const turned = applyMove(solved2, rotation);
    turned.cubies.forEach((cubie, i) => expect(cubie.position).not.toEqual(solved2.cubies[i].position));
    expect(applyMove(applyMove(solved, rotation), inverseMove(rotation))).toEqual(solved);
  });

  it("on a 2×2, x is R and L' together, y is U and D', z is F and B'", () => {
    const sameOnCorners = (a: Move[], b: Move[]) =>
      expect(applyMoves(solved2, a)).toEqual(applyMoves(solved2, b));
    sameOnCorners(["x"], ["R", "L'"]);
    sameOnCorners(["y"], ["U", "D'"]);
    sameOnCorners(["z"], ["F", "B'"]);
  });

  it("face turns and the scramble move list never include rotations", () => {
    expect(ALL_MOVES.some(isRotation)).toBe(false);
    expect(EVERY_MOVE.filter(isRotation)).toEqual(["x", "x'", "x2", "y", "y'", "y2", "z", "z'", "z2"]);
  });
});

describe("middle layers and wide turns", () => {
  const after = (moves: Move[], size: 2 | 3 = 3) => applyMoves(createSolvedCube(size), moves);
  const same = (a: string, b: string) => expect(after(parseCubeAlgorithm(a)), `${a} = ${b}`).toEqual(after(parseCubeAlgorithm(b)));

  it("each is the face turns and a rotation of the whole cube it stands for", () => {
    // M turns as L, E as D, S as F; r is R with the middle layer, and so on.
    same("M", "R L' x'");
    same("E", "U D' y'");
    same("S", "F' B z");
    same("r", "L x");
    same("l", "R x'");
    same("u", "D y");
    same("d", "U y'");
    same("f", "B z");
    same("b", "F z'");
    same("r", "R M'");
  });

  it("four quarter turns are nothing, the prime undoes it and 2 is two quarter turns", () => {
    for (const turn of [...SLICES, ...WIDES]) {
      same(`${turn} ${turn} ${turn} ${turn}`, "");
      same(`${turn} ${turn}'`, "");
      same(`${turn}2`, `${turn} ${turn}`);
    }
  });

  it("the H perm with M only moves the four top edges", () => {
    // Centers may end up spun in place, which a 3×3 cannot show: only the other pieces count.
    const isCenter = (id: string) => id.split(",").filter((c) => c === "0").length === 2;
    const moved = after(parseCubeAlgorithm("M2 U M2 U2 M2 U M2")).cubies.filter(
      (cubie, i) => !isCenter(cubie.id) && JSON.stringify(cubie) !== JSON.stringify(solved.cubies[i]),
    );
    expect(moved.map((cubie) => cubie.id).sort()).toEqual(["-1,1,0", "0,1,-1", "0,1,1", "1,1,0"]);
  });

  it("on a 2×2 there is no middle layer: M does nothing and r is R", () => {
    expect(after(["M"], 2)).toEqual(after([], 2));
    expect(after(["r"], 2)).toEqual(after(["R"], 2));
  });
});

describe("parseCubeAlgorithm", () => {
  it("reads Rw as r, R2' as R2, drops parentheses and joins a detached prime", () => {
    expect(parseCubeAlgorithm("(Rw U Rw') M2' U2 '")).toEqual(["r", "U", "r'", "M2", "U2"]);
  });

  it("rejects what the engine cannot turn", () => {
    expect(() => parseCubeAlgorithm("R Q")).toThrow("Movimiento no válido: Q");
  });
});
