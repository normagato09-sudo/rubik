import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { splitAlgorithm } from "./algorithm";
import {
  F2L_CASES,
  getAdjacentF2LCases,
  getF2LCase,
  getF2LSteps,
  matchesF2LCase,
} from "./f2l-cases";

/**
 * Page 1 of docs/source/F2L_Complet.pdf as its text layer gives it
 * (`pdftotext -layout`), reading order, spaces stripped. Case 12 is not in
 * the text layer — it is baked into the page raster, where it reads
 * "U' R U R' U' R U2 R'".
 */
const PDF_TEXT_LAYER = [
  "URU'R'", "U'F'UF", "F’U’F", "RUR’",
  "RU'R'URU'R'U2", "U'R'U2RUF'U'F", "RU'R'U2F'U'F", "F'UFU2RUR'",
  "U'RU'R'URUR'", "dR'URU'R'U'R", "UF'U'FU2F'UF", "U'RUR'U'RU2R'",
  "U'RUR'URUR'", "U'RU'R'UF'U'F", "y'U'R'U2RU2R'UR", "U'RU2R'U2RU'R'",
  "RUR'U2RUR'U'RUR'", "RUR'URU2R'F'U2F", "F'U2FUF'U'F", "RU2R'U'RUR'",
  "U'F'U2FU'F'UF", "URU2R'URU'R'", "U2RUR'URU'R'", "U2F'U'FU'F'UF",
];

describe("F2L_CASES", () => {
  it("has exactly the 24 cases of the source sheet, numbered 01–24", () => {
    expect(F2L_CASES).toHaveLength(24);
    expect(F2L_CASES.map((f2lCase) => f2lCase.id)).toEqual(
      Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, "0")),
    );
  });

  it("matches the PDF algorithms exactly (only the ’ glyph normalized)", () => {
    F2L_CASES.forEach((f2lCase, i) => {
      expect(f2lCase.algorithm.replace(/ /g, "")).toBe(PDF_TEXT_LAYER[i].replace(/’/g, "'"));
    });
  });

  it("each case has its own existing static image", () => {
    const images = new Set(F2L_CASES.map((f2lCase) => f2lCase.image));
    expect(images.size).toBe(24);
    for (const image of images) {
      const file = join(process.cwd(), "public", image);
      expect(existsSync(file), image).toBe(true);
      expect(readFileSync(file).subarray(1, 4).toString()).toBe("PNG");
    }
  });

  it("the source PDF is in the project", () => {
    expect(existsSync(join(process.cwd(), "docs/source/F2L_Complet.pdf"))).toBe(true);
  });
});

describe("getF2LSteps", () => {
  it("turns every move of the algorithm into one step, in order", () => {
    expect(getF2LSteps(getF2LCase("01")!)).toEqual(["U", "R", "U'", "R'"]);
    expect(getF2LSteps(getF2LCase("10")!)).toEqual(["d", "R'", "U", "R", "U'", "R'", "U'", "R"]);
    expect(getF2LSteps(getF2LCase("15")!)).toEqual([
      "y'", "U'", "R'", "U2", "R", "U2", "R'", "U", "R",
    ]);
  });

  it("joining the steps gives back the algorithm for all 24 cases", () => {
    for (const f2lCase of F2L_CASES) {
      expect(getF2LSteps(f2lCase).join(" ")).toBe(f2lCase.algorithm);
    }
  });
});

describe("splitAlgorithm", () => {
  it("drops grouping parentheses without creating steps for them", () => {
    expect(splitAlgorithm("(R U R' U') R U2 R'")).toEqual(["R", "U", "R'", "U'", "R", "U2", "R'"]);
  });
});

describe("getAdjacentF2LCases", () => {
  it("has no previous for the first case and no next for the last", () => {
    expect(getAdjacentF2LCases("01")).toEqual({ previous: undefined, next: getF2LCase("02") });
    expect(getAdjacentF2LCases("24")).toEqual({ previous: getF2LCase("23"), next: undefined });
  });
});

describe("matchesF2LCase", () => {
  const search = (query: string) =>
    F2L_CASES.filter((f2lCase) => matchesF2LCase(f2lCase, query)).map((f2lCase) => f2lCase.id);

  it("finds a case by number", () => {
    expect(search("7")).toEqual(["07"]);
    expect(search("caso 12")).toEqual(["12"]);
  });

  it("finds cases by algorithm, ignoring spaces and letter case", () => {
    expect(search("y'")).toEqual(["15"]);
    expect(search("dr'")).toEqual(["10"]);
    expect(search("F' U2 F U")).toEqual(["19", "21"]);
  });
});
