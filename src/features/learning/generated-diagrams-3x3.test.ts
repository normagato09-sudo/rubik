import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { generatedDiagrams3x3 } from "./generated-diagrams-3x3";
import { ALGORITHM_SETS } from "./sets";

const file = (image: string) => join(process.cwd(), "public", image);

describe("the 3×3 diagrams RUBIKO draws", () => {
  const diagrams = generatedDiagrams3x3();

  if (process.env.WRITE_DIAGRAMS === "1") {
    for (const [image, svg] of Object.entries(diagrams)) {
      mkdirSync(dirname(file(image)), { recursive: true });
      writeFileSync(file(image), svg);
    }
  }

  it("are one per case of the steps of Petrus, ZZ and Roux, of COLL, CMLL and LSE (EPLL, OCLL and PLL use the sheets')", () => {
    const sets = ["petrus-222", "petrus-223", "petrus-eo", "petrus-f2l", "petrus-coll", "zz-eo", "zz-linea", "zz-f2l", "roux-bloque1", "roux-bloque2", "roux-cmll", "roux-eo", "roux-ulur", "roux-capa-m"] as const;
    expect(Object.keys(diagrams).sort()).toEqual(sets.flatMap((set) => ALGORITHM_SETS[set].map((kase) => kase.image)).sort());
  });

  it("the files in public/learning are exactly what the cases draw", () => {
    for (const [image, svg] of Object.entries(diagrams)) {
      expect(existsSync(file(image)), image).toBe(true);
      // Git may check the files out with CRLF line endings on Windows.
      expect(readFileSync(file(image), "utf8").replace(/\r\n/g, "\n"), image).toBe(svg);
    }
  });
});
