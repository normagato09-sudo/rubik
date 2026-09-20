import { describe, expect, it } from "vitest";
import { addCube } from "./engine";
import type { Cube } from "./types";

function makeCube(overrides: Partial<Cube> = {}): Cube {
  return { id: "id-1", type: "3x3", name: "Mi cubo", createdAt: 0, ...overrides };
}

describe("cubes engine", () => {
  it("addCube appends so the first cube created stays first", () => {
    const withFirst = addCube([], makeCube({ id: "a" }));
    const withBoth = addCube(withFirst, makeCube({ id: "b" }));
    expect(withBoth.map((cube) => cube.id)).toEqual(["a", "b"]);
  });

  it("addCube never mutates the input array", () => {
    const original: Cube[] = [];
    addCube(original, makeCube());
    expect(original).toEqual([]);
  });
});
