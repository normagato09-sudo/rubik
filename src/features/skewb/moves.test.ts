import { describe, expect, it } from "vitest";
import { SKEWB_FACES, STICKER_CENTERS, STICKER_POLYGONS, faceOf, isCenterSticker } from "./geometry";
import {
  ALL_SKEWB_MOVES,
  applySarahTokens,
  applySkewbMoves,
  applySkewbTurns,
  invertSkewbMoves,
  isSolvedSkewb,
  parseSarahAlgorithm,
  parseSkewbScramble,
  solvedSkewb,
  turnPermutation,
  wcaTurn,
  type SkewbTurn,
} from "./moves";
import { CORNER_STICKERS } from "./search";

const identity = Array.from({ length: 30 }, (_, i) => i);

describe("Skewb geometry", () => {
  it("has 30 stickers on the surface of the cube: 6 squares and 24 triangles", () => {
    expect(STICKER_POLYGONS).toHaveLength(30);
    STICKER_POLYGONS.forEach((polygon, i) => {
      expect(polygon).toHaveLength(isCenterSticker(i) ? 4 : 3);
      const face = SKEWB_FACES.indexOf(faceOf(i));
      const axis = [1, 0, 2, 1, 0, 2][face];
      const side = [1, 1, 1, -1, -1, -1][face];
      for (const point of polygon) expect(point[axis]).toBe(side);
    });
  });

  it("reads each corner's three stickers starting on U or D", () => {
    expect(CORNER_STICKERS).toHaveLength(8);
    for (const stickers of CORNER_STICKERS) expect(["U", "D"]).toContain(faceOf(stickers[0]));
    expect(new Set(CORNER_STICKERS.flat()).size).toBe(24);
  });
});

describe("Skewb moves", () => {
  it("turn 3 centers and 4 corners (15 stickers), and three turns are none", () => {
    for (const move of ALL_SKEWB_MOVES) {
      const to = turnPermutation(wcaTurn(move));
      expect(to.filter((target, i) => target !== i)).toHaveLength(15);
      to.forEach((target, i) => expect(isCenterSticker(target)).toBe(isCenterSticker(i)));
      expect(applySkewbMoves(identity, [move, move, move])).toEqual(identity);
    }
  });

  it("undo each other with '", () => {
    for (const move of ALL_SKEWB_MOVES) {
      expect(applySkewbMoves(identity, [move, ...invertSkewbMoves([move])])).toEqual(identity);
    }
  });

  it("never move the up-front-right corner (WCA)", () => {
    const ufr = CORNER_STICKERS[0];
    for (const move of ALL_SKEWB_MOVES) {
      for (const sticker of ufr) expect(turnPermutation(wcaTurn(move))[sticker]).toBe(sticker);
    }
  });

  it("turn the corner they are named after: R the bottom right, U the top, L the bottom left, B the back", () => {
    const moved = (move: "R" | "U" | "L" | "B") =>
      new Set(
        turnPermutation(wcaTurn(move))
          .map((target, i) => (target !== i && isCenterSticker(i) ? faceOf(i) : null))
          .filter(Boolean),
      );
    expect(moved("R")).toEqual(new Set(["R", "D", "B"]));
    expect(moved("U")).toEqual(new Set(["U", "L", "B"]));
    expect(moved("L")).toEqual(new Set(["D", "F", "L"]));
    expect(moved("B")).toEqual(new Set(["D", "L", "B"]));
  });

  it("turn clockwise like a 3×3: x takes the front center up, y the front to the left, z the top to the right", () => {
    const center = (face: string) => SKEWB_FACES.indexOf(face as never) * 5;
    const rotation = (r: "x" | "y" | "z"): SkewbTurn => ({ kind: "rotation", rotation: r });
    expect(faceOf(turnPermutation(rotation("x"))[center("F")])).toBe("U");
    expect(faceOf(turnPermutation(rotation("y"))[center("F")])).toBe("L");
    expect(faceOf(turnPermutation(rotation("z"))[center("U")])).toBe("R");
    // A corner turn clockwise seen from the corner: looking at up-front-right, U → R → F.
    const f = turnPermutation({ kind: "corner", corner: "UFR", clockwise: true });
    expect(faceOf(f[center("U")])).toBe("R");
    expect(faceOf(f[center("R")])).toBe("F");
    expect(STICKER_CENTERS).toHaveLength(30);
  });

  it("reads scrambles and Sarah's algorithms", () => {
    expect(parseSkewbScramble("R U' L B’ (R)")).toEqual(["R", "U'", "L", "B'", "R"]);
    expect(() => parseSkewbScramble("F")).toThrow();
    expect(parseSarahAlgorithm("y' R' F R F'")).toEqual(["y'", "R'", "F", "R", "F'"]);
    expect(() => parseSarahAlgorithm("U")).toThrow();
  });

  it("matches Sarah's site: F' L F L' is y' R' F R F', and L F' L' F is y' F R' F' R", () => {
    const start = solvedSkewb();
    const scrambled = applySkewbMoves(start, parseSkewbScramble("R U' B L' U R' B' L U' R"));
    const same = (a: string, b: string) =>
      expect(applySarahTokens(scrambled, parseSarahAlgorithm(`${a} y'`))).toEqual(
        applySarahTokens(scrambled, parseSarahAlgorithm(b)),
      );
    same("F' L F L'", "y' R' F R F'");
    same("L F' L' F", "y' F R' F' R");
  });

  it("knows a solved Skewb, held any way", () => {
    const start = solvedSkewb();
    expect(isSolvedSkewb(start)).toBe(true);
    expect(isSolvedSkewb(applySkewbMoves(start, ["R"]))).toBe(false);
    expect(isSolvedSkewb(applySkewbTurns(start, [{ kind: "rotation", rotation: "x" }]))).toBe(true);
  });
});
