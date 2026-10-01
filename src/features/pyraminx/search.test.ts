import { describe, expect, it } from "vitest";
import { generatePyraminxScramble } from "@/features/scramble/generator";
import {
  emptyPyraFacelets,
  findTurnedPyraFaces,
  turnPyraFace,
  validatePyraFacelets,
  type PyraFacelets,
} from "./facelets";
import {
  BIG_MOVES,
  SOLVED_FACE_COLORS as SOLVED_FACES,
  applyPyraMoves,
  isSolvedPyraminx,
  solvedPyraminx,
  type PyraColor,
  type PyraMove,
} from "./moves";
import { EDGE_STICKERS, TIP_STICKERS, faceColorsFromCenters } from "./pieces";
import {
  PYRA_POSITIONS,
  coordsFromColors,
  initPyraminxTables,
  moveCoords,
  solvePyraminx,
} from "./search";

const random = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
const randomBig = (length: number) => Array.from({ length }, () => random(BIG_MOVES));

describe("Pyraminx coordinates", () => {
  it("follow the stickers move by move", () => {
    for (let run = 0; run < 50; run++) {
      const moves = randomBig(15);
      let coords = coordsFromColors(solvedPyraminx(), SOLVED_FACES)!;
      moves.forEach((move) => (coords = moveCoords(coords, BIG_MOVES.indexOf(move))));
      expect(coordsFromColors(applyPyraMoves(solvedPyraminx(), moves), SOLVED_FACES)).toEqual(coords);
    }
  });

  it("reach 933 120 positions, 11 big turns away at most", () => {
    const table = initPyraminxTables();
    const counts = new Map<number, number>();
    for (const d of table) if (d !== 255) counts.set(d, (counts.get(d) ?? 0) + 1);
    expect([...counts.values()].reduce((a, b) => a + b)).toBe(PYRA_POSITIONS);
    expect(Math.max(...counts.keys())).toBe(11);
    // Known counts for the Pyraminx without tips.
    expect(counts.get(1)).toBe(8);
    expect(counts.get(2)).toBe(48);
  });
});

describe("solvePyraminx", () => {
  it("solves 300 scrambles, tips first, in at most 11 big turns + 4 tip turns", () => {
    for (let run = 0; run < 300; run++) {
      const colors = applyPyraMoves(solvedPyraminx(), generatePyraminxScramble());
      const moves = solvePyraminx(colors);
      expect(isSolvedPyraminx(applyPyraMoves(colors, moves))).toBe(true);
      const tips = moves.filter((m) => m === m.toLowerCase());
      expect(moves.slice(0, tips.length)).toEqual(tips);
      expect(tips.length).toBeLessThanOrEqual(4);
      expect(moves.length - tips.length).toBeLessThanOrEqual(11);
    }
  });

  it("is optimal: a scramble of n big turns never needs more than n", () => {
    for (let run = 0; run < 100; run++) {
      const scramble = randomBig(1 + Math.floor(Math.random() * 6));
      const moves = solvePyraminx(applyPyraMoves(solvedPyraminx(), scramble));
      expect(moves.length).toBeLessThanOrEqual(scramble.length);
    }
  });

  it("gives nothing for a solved Pyraminx and one move for one move", () => {
    expect(solvePyraminx(solvedPyraminx())).toEqual([]);
    expect(solvePyraminx(applyPyraMoves(solvedPyraminx(), ["R"]))).toEqual(["R'"]);
    expect(solvePyraminx(applyPyraMoves(solvedPyraminx(), ["b'"]))).toEqual(["b"]);
  });

  it("works however the Pyraminx is held (colors renamed by a turn of the whole puzzle)", () => {
    // Held with another face in front: the same pieces, the face colors turned round.
    const rename: Record<PyraColor, PyraColor> = { green: "red", red: "blue", blue: "green", yellow: "yellow" };
    for (let run = 0; run < 30; run++) {
      const colors = applyPyraMoves(solvedPyraminx(), generatePyraminxScramble()).map((c) => rename[c]);
      expect(validatePyraFacelets(colors).kind).toBe("valid");
      expect(isSolvedPyraminx(applyPyraMoves(colors, solvePyraminx(colors)))).toBe(true);
    }
  });
});

describe("validatePyraFacelets", () => {
  const scrambled = () => applyPyraMoves(solvedPyraminx(), generatePyraminxScramble()) as PyraFacelets;

  it("accepts real Pyraminxes and says when one is solved", () => {
    expect(validatePyraFacelets(solvedPyraminx())).toMatchObject({ kind: "valid", solved: true });
    for (let run = 0; run < 50; run++) expect(validatePyraFacelets(scrambled()).kind).toBe("valid");
  });

  it("counts what is missing, face by face", () => {
    const facelets = solvedPyraminx() as PyraFacelets;
    facelets[3] = null;
    facelets[30] = null;
    const result = validatePyraFacelets(facelets);
    expect(result).toMatchObject({ kind: "incomplete", message: "Faltan 2 pegatinas por pintar." });
    if (result.kind === "incomplete") expect(result.missingByFace).toEqual([{ face: "F", missing: 1 }, { face: "D", missing: 1 }]);
    expect(validatePyraFacelets(emptyPyraFacelets()).kind).toBe("incomplete");
  });

  it("wants 9 of each color", () => {
    const facelets = solvedPyraminx() as PyraFacelets;
    facelets[1] = "red";
    expect(validatePyraFacelets(facelets)).toMatchObject({ kind: "count" });
  });

  it("finds a tip that does not match its center", () => {
    const facelets = scrambled();
    const [a, b] = TIP_STICKERS.U;
    [facelets[a], facelets[b]] = [facelets[b], facelets[a]];
    const result = validatePyraFacelets(facelets);
    expect(result.kind).toBe("impossible");
    if (result.kind === "impossible") expect(result.message).toMatch(/punta de arriba/);
  });

  it("finds two swapped edges and a flipped edge", () => {
    const swapped = solvedPyraminx() as PyraFacelets;
    const [[a1, a2], [b1, b2]] = EDGE_STICKERS;
    [swapped[a1], swapped[b1]] = [swapped[b1], swapped[a1]];
    [swapped[a2], swapped[b2]] = [swapped[b2], swapped[a2]];
    const s = validatePyraFacelets(swapped);
    // Either the pair shows as swapped, or — if the colors no longer form real edges — as a wrong edge.
    expect(s.kind).toBe("impossible");

    const flipped = solvedPyraminx() as PyraFacelets;
    [flipped[a1], flipped[a2]] = [flipped[a2], flipped[a1]];
    const f = validatePyraFacelets(flipped);
    expect(f.kind).toBe("impossible");
    if (f.kind === "impossible") expect(f.message).toMatch(/dada la vuelta/);
  });

  it("finds a face copied turned, and turning it back fixes it", () => {
    for (let run = 0; run < 20; run++) {
      const good = scrambled();
      const turned = turnPyraFace(good, { face: "L", turns: 1 });
      const result = validatePyraFacelets(turned);
      if (result.kind === "valid") continue; // some faces look the same turned
      expect(result.kind).toBe("impossible");
      const fix = findTurnedPyraFaces(turned);
      expect(fix).not.toBeNull();
      expect(validatePyraFacelets(fix!.reduce(turnPyraFace, turned)).kind).toBe("valid");
    }
  });

  it("knows each face's color from the centers", () => {
    const colors = applyPyraMoves(solvedPyraminx(), ["R", "u", "B'"] as PyraMove[]);
    expect(faceColorsFromCenters(colors)).toEqual(SOLVED_FACES);
  });
});
