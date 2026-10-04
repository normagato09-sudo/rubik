import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { generatedDiagrams } from "./generated-diagrams-2x2";
import { ALGORITHM_SETS } from "./sets";

const file = (image: string) => join(process.cwd(), "public", image);

describe("the 2×2 diagrams RUBIKO draws", () => {
  const diagrams = generatedDiagrams();

  if (process.env.WRITE_DIAGRAMS === "1") {
    for (const [image, svg] of Object.entries(diagrams)) {
      mkdirSync(dirname(file(image)), { recursive: true });
      writeFileSync(file(image), svg);
    }
  }

  it("are the 3 + 3 first-layer cases, CLL 41–42, the B turn, and EG-1 and EG-2", () => {
    const eg = (["eg-1", "eg-2"] as const).flatMap((set) => ALGORITHM_SETS[set].map((kase) => kase.image));
    expect(eg).toHaveLength(86);
    expect(Object.keys(diagrams).filter((image) => !eg.includes(image)).sort()).toEqual([
      "/learning/cll/cll-41.svg",
      "/learning/cll/cll-42.svg",
      "/learning/notation-2x2/notation-2x2-b.svg",
      "/learning/primera-capa/primera-capa-01.svg",
      "/learning/primera-capa/primera-capa-02.svg",
      "/learning/primera-capa/primera-capa-03.svg",
      "/learning/primera-cara/primera-cara-01.svg",
      "/learning/primera-cara/primera-cara-02.svg",
      "/learning/primera-cara/primera-cara-03.svg",
    ]);
  });

  it("the files in public/learning are exactly what the cases draw", () => {
    for (const [image, svg] of Object.entries(diagrams)) {
      expect(existsSync(file(image)), image).toBe(true);
      // Git may check the files out with CRLF line endings on Windows.
      expect(readFileSync(file(image), "utf8").replace(/\r\n/g, "\n"), image).toBe(svg);
    }
  });
});
