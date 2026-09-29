import { describe, expect, it } from "vitest";
import type { CubeColor } from "@/features/cube/types";
import {
  CORNER_FACELETS_2,
  colorCounts2,
  emptyFacelets2,
  faceOffset2,
  faceletsFromCorners,
  findTurnedFaces2,
  parseFacelets2,
  pieceIssues2,
  turnFace2,
  validateFacelets2,
} from "./facelets";
import { applyMoves2, solvedFacelets2 } from "./sticker-moves";

const solved = solvedFacelets2();
const scrambled = applyMoves2(solved, ["R", "U", "F'", "R2", "U'", "F", "R'"]);

describe("2×2 stickers", () => {
  it("a solved cube held white up, green front", () => {
    expect(solved.slice(faceOffset2("U"), faceOffset2("U") + 4)).toEqual(Array(4).fill("white"));
    expect(solved.slice(faceOffset2("F"), faceOffset2("F") + 4)).toEqual(Array(4).fill("green"));
    // The reference corner: yellow-blue-orange at down-back-left.
    expect(CORNER_FACELETS_2[6].map((i) => solved[i])).toEqual(["yellow", "blue", "orange"]);
  });

  it("4 stickers of each color, 24 in all", () => {
    expect(solved).toHaveLength(24);
    expect(Object.values(colorCounts2(solved))).toEqual(Array(6).fill(4));
  });

  it("a scrambled cube is valid, not solved", () => {
    expect(validateFacelets2(scrambled)).toMatchObject({ kind: "valid", solved: false });
    expect(validateFacelets2(solved)).toMatchObject({ kind: "valid", solved: true });
  });
});

describe("live validation", () => {
  it("counts what is missing, face by face", () => {
    const partial: (CubeColor | null)[] = [...scrambled];
    partial[0] = null;
    partial[5] = null;
    const validation = validateFacelets2(partial);
    expect(validation.kind).toBe("incomplete");
    if (validation.kind !== "incomplete") return;
    expect(validation.message).toBe("Faltan 2 pegatinas por colorear.");
    expect(validation.missingByFace).toEqual([
      { face: "U", missing: 1 },
      { face: "R", missing: 1 },
    ]);
  });

  it("an empty cube has nothing wrong yet", () => {
    expect(validateFacelets2(emptyFacelets2())).toMatchObject({ kind: "incomplete", issues: [] });
  });

  it("flags a fifth sticker of a color while painting", () => {
    const partial: (CubeColor | null)[] = emptyFacelets2();
    for (let i = 0; i < 5; i++) partial[i * 4 + 1] = "red";
    const validation = validateFacelets2(partial);
    expect(validation.kind === "incomplete" && validation.issues[0].message).toMatch(/5 pegatinas de color rojo: sobra 1/);
  });

  it("wrong color counts", () => {
    const counted = [...solved];
    counted[0] = "red";
    const validation = validateFacelets2(counted);
    expect(validation.kind).toBe("count");
    expect(validation.kind === "count" && validation.message).toMatch(/3 pegatinas de color blanco y 5 de color rojo/);
  });

  it("a corner with a repeated color, marked as soon as it is painted", () => {
    const partial: (CubeColor | null)[] = emptyFacelets2();
    const [a, b] = CORNER_FACELETS_2[0];
    partial[a] = "green";
    partial[b] = "green";
    expect(pieceIssues2(partial)).toEqual([
      { message: expect.stringMatching(/arriba, delante y a la derecha tiene dos pegatinas de color verde/), stickers: [a, b] },
    ]);
  });

  it("a corner with opposite colors", () => {
    const partial: (CubeColor | null)[] = emptyFacelets2();
    const [a, b] = CORNER_FACELETS_2[4];
    partial[a] = "red";
    partial[b] = "orange";
    expect(pieceIssues2(partial)[0].message).toMatch(/rojo y naranja, que son colores opuestos/);
  });

  it("a corner seen in a mirror", () => {
    const mirrored = [...solved];
    const [a, b] = CORNER_FACELETS_2[2].slice(1);
    [mirrored[a], mirrored[b]] = [solved[b], solved[a]];
    const validation = validateFacelets2(mirrored);
    expect(validation.kind).toBe("impossible");
    expect(validation.kind === "impossible" && validation.issues[0].stickers).toEqual(CORNER_FACELETS_2[2]);
  });

  it("the same corner twice, with every color still 4 times", () => {
    // URF and ULB twice, UFL and UBR missing: the same 12 colors, two corners repeated.
    const twice = faceletsFromCorners({ cp: [0, 0, 2, 2, 4, 5, 6, 7], co: Array(8).fill(0) });
    expect(Object.values(colorCounts2(twice))).toEqual(Array(6).fill(4));
    const parsed = parseFacelets2(twice);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toMatch(/^Hay dos esquinas blanco, rojo y verde \(y falta otra esquina\)/);
    expect(parsed.stickers).toEqual([...CORNER_FACELETS_2[0], ...CORNER_FACELETS_2[1]]);
  });

  it("a twisted corner, in Spanish", () => {
    const twisted = [...solved];
    const [a, b, c] = CORNER_FACELETS_2[7];
    [twisted[a], twisted[b], twisted[c]] = [solved[c], solved[a], solved[b]];
    const validation = validateFacelets2(twisted);
    expect(validation.kind === "impossible" && validation.message).toMatch(/^Hay una esquina girada sobre sí misma/);
  });

  it("finds a face copied turned", () => {
    for (const face of ["U", "R", "F", "D", "L", "B"] as const) {
      const wrong = turnFace2(scrambled, { face, turns: 1 });
      if (validateFacelets2(wrong).kind === "valid") continue;
      const fix = findTurnedFaces2(wrong);
      if (!fix) continue;
      expect(fix.reduce(turnFace2, wrong)).toEqual(scrambled);
    }
    expect(findTurnedFaces2(scrambled)).toBeNull();
  });
});
