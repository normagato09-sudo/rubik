import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { splitAlgorithm } from "./algorithm";
import {
  IMAGE_SIZE,
  caseTitle,
  getAdjacentCases,
  getSteps,
  matchesCase,
  type AlgorithmSetId,
} from "./algorithm-sets";
import { F2L_CASES } from "./f2l-cases";
import { OLL_CASES } from "./oll-cases";
import { PLL_CASES } from "./pll-cases";
import { ALGORITHM_SETS, getCase } from "./sets";

/**
 * Page 1 of docs/source/F2L_Complet.pdf as its text layer gives it
 * (`pdftotext -layout`), reading order, spaces stripped. Case 12 is not in
 * the text layer — it is baked into the page raster, where it reads
 * "U' R U R' U' R U2 R'".
 */
const F2L_PDF_TEXT_LAYER = [
  "URU'R'", "U'F'UF", "F’U’F", "RUR’",
  "RU'R'URU'R'U2", "U'R'U2RUF'U'F", "RU'R'U2F'U'F", "F'UFU2RUR'",
  "U'RU'R'URUR'", "dR'URU'R'U'R", "UF'U'FU2F'UF", "U'RUR'U'RU2R'",
  "U'RUR'URUR'", "U'RU'R'UF'U'F", "y'U'R'U2RU2R'UR", "U'RU2R'U2RU'R'",
  "RUR'U2RUR'U'RUR'", "RUR'URU2R'F'U2F", "F'U2FUF'U'F", "RU2R'U'RUR'",
  "U'F'U2FU'F'UF", "URU2R'URU'R'", "U2RUR'URU'R'", "U2F'U'FU'F'UF",
];

/** Reads one file out of a .docx (a zip) using only its central directory. */
function readZipEntry(zipPath: string, entryName: string): string {
  const zip = readFileSync(zipPath);
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let offset = zip.readUInt32LE(eocd + 16);
  for (let i = 0; i < zip.readUInt16LE(eocd + 10); i++) {
    const method = zip.readUInt16LE(offset + 10);
    const size = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const local = zip.readUInt32LE(offset + 42);
    const name = zip.toString("utf8", offset + 46, offset + 46 + nameLength);
    if (name === entryName) {
      const dataStart = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const data = zip.subarray(dataStart, dataStart + size);
      return (method === 8 ? inflateRawSync(data) : data).toString("utf8");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${entryName} not found in ${zipPath}`);
}

/** Rows of the docx table as [caseCell, algorithmCell], header skipped. */
function docxTableRows(file: string): [string, string][] {
  const xml = readZipEntry(join(process.cwd(), "docs/source", file), "word/document.xml");
  const rows = xml.split(/<w:tr[ >]/).slice(2);
  return rows.map((row) => {
    const cells = row.split("<w:tc>").slice(1).map((cell) =>
      [...cell.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((match) => match[1]).join("").trim(),
    );
    return [cells[0], cells[2]];
  });
}

const SETS: [AlgorithmSetId, number][] = [
  ["f2l", 24],
  ["oll", 57],
  ["pll", 21],
];

describe.each(SETS)("%s cases", (setId, count) => {
  const cases = ALGORITHM_SETS[setId];

  it(`has exactly ${count} cases, numbered from 01`, () => {
    expect(cases).toHaveLength(count);
    expect(cases.map((algorithmCase) => algorithmCase.id)).toEqual(
      Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, "0")),
    );
  });

  it("each case has its own existing static image", () => {
    const images = new Set(cases.map((algorithmCase) => algorithmCase.image));
    expect(images.size).toBe(count);
    for (const image of images) {
      const file = join(process.cwd(), "public", image);
      expect(existsSync(file), image).toBe(true);
      expect(readFileSync(file).subarray(1, 4).toString()).toBe("PNG");
    }
    expect(IMAGE_SIZE[setId].width).toBeGreaterThan(0);
  });

  it("every step comes from the algorithm, in order", () => {
    for (const algorithmCase of cases) {
      expect(getSteps(algorithmCase).join(" ")).toBe(algorithmCase.algorithm.replace(/ '/g, "'"));
    }
  });

  it("has no previous for the first case and no next for the last", () => {
    const last = cases[cases.length - 1];
    expect(getAdjacentCases(cases, "01")).toEqual({ previous: undefined, next: cases[1] });
    expect(getAdjacentCases(cases, last.id)).toEqual({
      previous: cases[cases.length - 2],
      next: undefined,
    });
  });
});

describe("source fidelity", () => {
  it("F2L matches the PDF algorithms exactly (only the ’ glyph normalized)", () => {
    F2L_CASES.forEach((algorithmCase, i) => {
      expect(algorithmCase.algorithm.replace(/ /g, "")).toBe(
        F2L_PDF_TEXT_LAYER[i].replace(/’/g, "'"),
      );
    });
  });

  it("OLL matches docs/source/oll.docx row by row", () => {
    const rows = docxTableRows("oll.docx");
    expect(rows).toHaveLength(OLL_CASES.length);
    rows.forEach(([number, algorithm], i) => {
      expect(Number(number)).toBe(OLL_CASES[i].number);
      expect(OLL_CASES[i].algorithm).toBe(algorithm);
    });
  });

  it("PLL matches docs/source/pll.docx row by row, names included", () => {
    const rows = docxTableRows("pll.docx");
    expect(rows).toHaveLength(PLL_CASES.length);
    rows.forEach(([cell, algorithm], i) => {
      expect(cell.replace(/\s+/g, " ")).toBe(`${PLL_CASES[i].number} - ${PLL_CASES[i].name}`);
      expect(PLL_CASES[i].algorithm).toBe(algorithm);
    });
  });

  it("the source files are in the project", () => {
    for (const file of ["F2L_Complet.pdf", "oll.docx", "pll.docx"]) {
      expect(existsSync(join(process.cwd(), "docs/source", file)), file).toBe(true);
    }
  });
});

describe("splitAlgorithm", () => {
  it("keeps each move as written, one step per move", () => {
    expect(getSteps(getCase("f2l", "10")!)).toEqual(["d", "R'", "U", "R", "U'", "R'", "U'", "R"]);
    expect(getSteps(getCase("f2l", "15")!)).toEqual([
      "y'", "U'", "R'", "U2", "R", "U2", "R'", "U", "R",
    ]);
    expect(getSteps(getCase("oll", "01")!).slice(0, 3)).toEqual(["R", "U2'", "R2'"]);
  });

  it("drops grouping parentheses without creating steps for them", () => {
    expect(splitAlgorithm("(R U R' U') R U2 R'")).toEqual(["R", "U", "R'", "U'", "R", "U2", "R'"]);
  });

  it("attaches a detached prime to the move before it (PLL Rb: `U2 '`)", () => {
    const rb = getCase("pll", "14")!;
    expect(rb.algorithm).toContain("U2 '");
    expect(getSteps(rb)).toEqual([
      "R'", "U2", "R", "U2'", "R'", "F", "R", "U", "R'", "U'", "R'", "F'", "R2", "U'",
    ]);
  });
});

describe("matchesCase", () => {
  const search = (setId: AlgorithmSetId, query: string) =>
    ALGORITHM_SETS[setId]
      .filter((algorithmCase) => matchesCase(algorithmCase, query))
      .map((algorithmCase) => algorithmCase.id);

  it("finds a case by number", () => {
    expect(search("f2l", "7")).toEqual(["07"]);
    expect(search("oll", "caso 57")).toEqual(["57"]);
  });

  it("finds cases by algorithm, ignoring spaces and letter case", () => {
    expect(search("f2l", "y'")).toEqual(["15"]);
    expect(search("f2l", "F' U2 F U")).toEqual(["19", "21"]);
  });

  it("finds PLL cases by name", () => {
    expect(search("pll", "T")).toEqual(["08"]);
    expect(search("pll", "t perm")).toEqual(["08"]);
    expect(search("pll", "g")).toEqual(["16", "17", "18", "19"]);
  });

  it("titles include the source name when there is one", () => {
    expect(caseTitle(getCase("f2l", "07")!)).toBe("Caso 07");
    expect(caseTitle(getCase("pll", "08")!)).toBe("Caso 08 · T");
  });
});
