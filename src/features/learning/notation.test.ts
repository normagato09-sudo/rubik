import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LEARNING_CATEGORIES } from "./categories";
import { NOTATION_MOVES, matchesNotationMove } from "./notation";
import { countLearned, createLearningProgressStore, notationItemId } from "./progress-store";

describe("NOTATION_MOVES", () => {
  it("has the 12 diagrams of the source document, in document order", () => {
    expect(NOTATION_MOVES.map((notation) => notation.move)).toEqual([
      "D", "U", "L", "R", "F", "B", "M", "E", "S", "z", "y", "x",
    ]);
  });

  it("each move has its own existing image", () => {
    for (const notation of NOTATION_MOVES) {
      const file = join(process.cwd(), "public", notation.image);
      expect(existsSync(file), notation.image).toBe(true);
      expect(readFileSync(file).subarray(1, 4).toString()).toBe("PNG");
    }
    expect(existsSync(join(process.cwd(), "docs/source/notacion.docx"))).toBe(true);
  });

  it("the notation category is now available", () => {
    expect(LEARNING_CATEGORIES.find((category) => category.id === "notation")?.available).toBe(true);
  });
});

describe("matchesNotationMove", () => {
  const search = (query: string) =>
    NOTATION_MOVES.filter((notation) => matchesNotationMove(notation, query)).map(
      (notation) => notation.move,
    );

  it("finds a move by its letter or its inverse", () => {
    expect(search("M")).toEqual(["M"]);
    expect(search("r'")).toEqual(["R"]);
    expect(search("y")).toEqual(["y"]);
  });

  it("finds moves by their label", () => {
    expect(search("capa media")).toEqual(["M"]);
    expect(search("todo el cubo")).toEqual(["z", "y", "x"]);
  });
});

describe("notation progress", () => {
  it("counts X/12 independently of F2L", () => {
    const store = createLearningProgressStore(() => ({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }));
    const ids = NOTATION_MOVES.map((notation) => notationItemId(notation.id));
    store.getState().toggleLearned(notationItemId("r"));
    store.getState().toggleLearned("f2l-01");
    expect(countLearned(store.getState().learned, ids)).toBe(1);
    expect(ids).toHaveLength(12);
  });
});
