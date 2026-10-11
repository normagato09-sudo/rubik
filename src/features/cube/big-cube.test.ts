import { describe, expect, it } from "vitest";
import { generate4x4Scramble, SCRAMBLE_4X4_LENGTH } from "@/features/scramble/generator";
import { parseBigAlgorithm } from "./algorithm";
import { createSolvedCube, layerCoords, outerCoord } from "./model";
import { applyCubeMoves, getFaceDef, inverseBigMove, layerTurn, turnsPiece, type BigMove, type Face } from "./moves";
import type { CubeColor, CubeSize, CubeState, StickerFace, Vec3 } from "./types";

const LOCAL: Record<StickerFace, Vec3> = {
  "+x": [1, 0, 0],
  "-x": [-1, 0, 0],
  "+y": [0, 1, 0],
  "-y": [0, -1, 0],
  "+z": [0, 0, 1],
  "-z": [0, 0, -1],
};

/** Every sticker as it is seen: "position|direction it faces" → color. */
function stickers(state: CubeState): Map<string, CubeColor> {
  const seen = new Map<string, CubeColor>();
  for (const cubie of state.cubies) {
    for (const sticker of cubie.stickers) {
      const [a, b, c] = LOCAL[sticker.face];
      const { x, y, z } = cubie.orientation;
      const world = [0, 1, 2].map((k) => a * x[k] + b * y[k] + c * z[k]);
      seen.set(`${cubie.position.join(",")}|${world.join(",")}`, sticker.color);
    }
  }
  return seen;
}

/** The stickers that differ from the solved cube. */
function changed(state: CubeState, size: CubeSize): string[] {
  const solved = stickers(createSolvedCube(size));
  return [...stickers(state)].filter(([key, color]) => solved.get(key) !== color).map(([key]) => key);
}

/** Every face of one color, held any way. */
function isSolved(state: CubeState): boolean {
  const byFace = new Map<string, Set<CubeColor>>();
  for (const [key, color] of stickers(state)) {
    const direction = key.split("|")[1];
    byFace.set(direction, (byFace.get(direction) ?? new Set()).add(color));
  }
  return [...byFace.values()].every((colors) => colors.size === 1);
}

const run = (size: 4 | 5, text: string) => applyCubeMoves(createSolvedCube(size), parseBigAlgorithm(text, size), size);
const same = (size: 4 | 5, a: string, b: string) => expect(stickers(run(size, a))).toEqual(stickers(run(size, b)));

const TURNS = (): BigMove[] =>
  (["R", "L", "U", "D", "F", "B"] as Face[]).flatMap((face) => {
    const lower = face.toLowerCase();
    return [face, `${face}w`, `3${face}w`, lower, `3${lower}`] as BigMove[];
  });

describe("the cube engine for every size", () => {
  it("the 2×2 and 3×3 keep their layers; the 4×4 and 5×5 get theirs", () => {
    expect(layerCoords(2)).toEqual([-1, 1]);
    expect(layerCoords(3)).toEqual([-1, 0, 1]);
    expect(layerCoords(4)).toEqual([-3, -1, 1, 3]);
    expect(layerCoords(5)).toEqual([-2, -1, 0, 1, 2]);
    expect([2, 3, 4, 5].map((size) => outerCoord(size as CubeSize))).toEqual([1, 1, 3, 2]);
  });

  it.each([
    [2, 8, 4],
    [3, 26, 9],
    [4, 56, 16],
    [5, 98, 25],
  ] as const)("a solved %i×%i has %i pieces and %i stickers of each color", (size, pieces, perColor) => {
    const cube = createSolvedCube(size);
    expect(cube.cubies).toHaveLength(pieces);
    const counts = new Map<CubeColor, number>();
    for (const color of stickers(cube).values()) counts.set(color, (counts.get(color) ?? 0) + 1);
    expect([...counts.values()]).toEqual(Array(6).fill(perColor));
    expect(isSolved(cube)).toBe(true);
  });
});

describe.each([4, 5] as const)("moves of the %i-layer cube", (size) => {
  const solved = stickers(createSolvedCube(size));

  it("every turn done 4 times, or followed by its inverse, changes nothing; X2 is X twice", () => {
    for (const move of [...TURNS(), "x", "y", "z"] as BigMove[]) {
      expect(stickers(run(size, `${move} ${move} ${move} ${move}`)), move).toEqual(solved);
      expect(stickers(run(size, `${move} ${inverseBigMove(move)}`)), move).toEqual(solved);
      expect(stickers(run(size, `${move}2`)), move).toEqual(stickers(run(size, `${move} ${move}`)));
    }
  });

  it("wide turns are the outer layer and the inner ones together", () => {
    same(size, "Rw", "R r");
    same(size, "3Rw", "R r 3r");
    same(size, "Uw'", "U' u'");
    same(size, "3Fw2", "F2 f2 3f2");
    same(size, "x", size === 4 ? "Rw Lw'" : "3Rw Lw'");
  });

  it("a face turn moves its whole face, an inner turn a ring of pieces, a wide turn both", () => {
    const pieces = createSolvedCube(size).cubies;
    const moved = (move: BigMove) => pieces.filter((cubie) => turnsPiece(layerTurn(move, size), cubie.position)).length;
    const face = size * size;
    const ring = 4 * (size - 1);
    expect(moved("R")).toBe(face);
    expect(moved("r")).toBe(ring);
    expect(moved("3r")).toBe(ring);
    expect(moved("Rw")).toBe(face + ring);
    expect(moved("3Rw")).toBe(face + 2 * ring);
    expect(moved("x")).toBe(pieces.length);
  });

  it("a move the cube does not have is rejected", () => {
    for (const move of ["M", "4Rw", "Rw3", "2R", "rw", "3x"]) expect(() => layerTurn(move as BigMove, size), move).toThrow();
  });
});

describe("4×4 parity algorithms, as the engine checks them", () => {
  /** The UF and UB edges: their two pieces each, on U and on F or B. */
  const upEdge = (key: string) => {
    const [x, y, z] = key.split("|")[0].split(",").map(Number);
    return y === 3 && Math.abs(x) === 1 && Math.abs(z) === 3;
  };

  it("r2 U2 r2 Uw2 r2 Uw2 (then U2) swaps the UF and UB edges and nothing else: PLL parity", () => {
    const keys = changed(run(4, "r2 U2 r2 Uw2 r2 Uw2 U2"), 4);
    // Only the side stickers of the 4 pieces of UF and UB: their U stickers are all white anyway.
    expect(keys).toHaveLength(4);
    expect(keys.every(upEdge)).toBe(true);
  });

  it("the usual OLL parity algorithm flips the UF edge and keeps the centers and the first two layers", () => {
    const after = run(4, "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'");
    const keys = changed(after, 4);
    expect(keys.length).toBeGreaterThan(0);
    // Every change is in the top layer, and none of it is a center.
    const positions = keys.map((key) => key.split("|")[0].split(",").map(Number));
    expect(positions.every(([, y]) => y === 3)).toBe(true);
    expect(positions.some(([x, , z]) => Math.abs(x) === 1 && Math.abs(z) === 1)).toBe(false);
    const seen = stickers(after);
    expect(seen.get("1,3,3|0,1,0")).not.toBe("white");
    expect(seen.get("-1,3,3|0,1,0")).not.toBe("white");
  });
});

describe("4×4 scrambles", () => {
  it("are 40 moves, never two in a row on the same axis, and undo exactly", () => {
    for (let n = 0; n < 50; n++) {
      const scramble = generate4x4Scramble();
      expect(scramble).toHaveLength(SCRAMBLE_4X4_LENGTH);
      scramble.slice(1).forEach((move, i) => expect(getFaceDef(move[0] as Face).axis).not.toBe(getFaceDef(scramble[i][0] as Face).axis));
      const scrambled = applyCubeMoves(createSolvedCube(4), scramble, 4);
      expect(isSolved(scrambled)).toBe(false);
      const undone = applyCubeMoves(scrambled, [...scramble].reverse().map(inverseBigMove), 4);
      expect(isSolved(undone)).toBe(true);
    }
  });

  it("are read back by the 4×4 reader", () => {
    const scramble = generate4x4Scramble();
    expect(parseBigAlgorithm(scramble.join(" "), 4)).toEqual(scramble);
    expect(parseBigAlgorithm("(Rw U2) x Rw' 3Rw2 r2' U ’", 4)).toEqual(["Rw", "U2", "x", "Rw'", "3Rw2", "r2", "U'"]);
  });
});
