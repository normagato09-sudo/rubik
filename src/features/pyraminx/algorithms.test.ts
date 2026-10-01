import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { L4E_CASES, POR_CAPAS_LAST_LAYER, type PyraCase } from "./algorithms";
import { applyPyraMoves, invertPyraMoves, parsePyraAlgorithm, solvedPyraminx, type PyraMove } from "./moves";
import { CENTER_STICKERS, EDGE_STICKERS, TIP_STICKERS } from "./pieces";

const LETTER = { green: "g", red: "r", blue: "b", yellow: "y" } as const;
const solved = solvedPyraminx();

/** The case an algorithm (plus its final adjustment) solves. */
const caseOf = (algorithm: string, adjust: PyraCase["adjust"] = "") =>
  applyPyraMoves(solved, invertPyraMoves([...parsePyraAlgorithm(algorithm), ...(adjust ? [adjust as PyraMove] : [])]));

/** What the sheets' diagrams show: the front, left and right faces. */
const visible = (state: readonly string[]) => state.slice(0, 27).map((c) => LETTER[c as keyof typeof LETTER]).join("");

const same = (state: readonly string[], stickers: readonly number[]) => stickers.every((i) => state[i] === solved[i]);
const FD = EDGE_STICKERS.findIndex(([a, b]) => a === 6 && b >= 27);
const bottomEdges = EDGE_STICKERS.filter(([, b]) => b >= 27);
const bottomCenters = (["L", "R", "B"] as const).flatMap((v) => CENTER_STICKERS[v]);
const tips = Object.values(TIP_STICKERS).flat();

describe("Pyraminx algorithms", () => {
  it.each([
    ["Por capas", POR_CAPAS_LAST_LAYER],
    ["L4E", L4E_CASES],
  ] as const)("%s: each one solves the case its diagram shows (with the final turn of U it lists)", (_, cases) => {
    for (const kase of cases) expect(visible(caseOf(kase.algorithm, kase.adjust)), `fila ${kase.doc}`).toBe(kase.picture);
  });

  it("Por capas: the cases have the first layer done, and only the 3 top edges left", () => {
    for (const kase of POR_CAPAS_LAST_LAYER) {
      const state = caseOf(kase.algorithm, kase.adjust);
      expect(same(state, [...bottomEdges.flat(), ...bottomCenters, ...tips]), `fila ${kase.doc}`).toBe(true);
    }
  });

  it("L4E: the cases have the V and the centers done, and the front bottom edge is one of the 4 left", () => {
    const v = bottomEdges.filter((_, i) => EDGE_STICKERS.indexOf(bottomEdges[i]) !== FD).flat();
    for (const kase of L4E_CASES) {
      const state = caseOf(kase.algorithm, kase.adjust);
      expect(same(state, [...v, ...bottomCenters, ...tips]), `fila ${kase.doc}`).toBe(true);
    }
  });

  it("the 30 L4E diagrams are all different, and so are the 5 of Por capas", () => {
    expect(new Set(L4E_CASES.map((k) => k.picture)).size).toBe(30);
    expect(new Set(POR_CAPAS_LAST_LAYER.map((k) => k.picture)).size).toBe(5);
  });

  it("the sheet's wrong algorithm really does not solve its case, whatever the final turn", () => {
    const wrong = POR_CAPAS_LAST_LAYER.filter((kase) => kase.source === "corregido");
    expect(wrong.map((kase) => kase.doc)).toEqual([5]);
    for (const kase of wrong) {
      for (const adjust of ["", "U", "U'"] as const) {
        expect(visible(caseOf(kase.docAlgorithm!, adjust))).not.toBe(kase.picture);
      }
    }
  });
});

// ---------- the algorithms are the sheets' ----------

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
    if (zip.toString("utf8", offset + 46, offset + 46 + nameLength) === entryName) {
      const dataStart = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const data = zip.subarray(dataStart, dataStart + size);
      return (method === 8 ? inflateRawSync(data) : data).toString("utf8");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${entryName} not found in ${zipPath}`);
}

/** Algorithm column of the sheet's table, by row number, with ’ normalized. */
function sheetAlgorithms(file: string): Map<number, string> {
  const xml = readZipEntry(join(process.cwd(), "docs/source", file), "word/document.xml");
  const rows = new Map<number, string>();
  for (const row of xml.split(/<w:tr[ >]/).slice(2)) {
    const cells = row.split(/<w:tc[ >]/).slice(1).map((cell) =>
      [...cell.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("").trim(),
    );
    rows.set(Number(cells[0]), cells.at(-1)!.replace(/’/g, "'"));
  }
  return rows;
}

describe("the Pyraminx algorithms come from docs/source", () => {
  it.each([
    ["Pyraminx Por capas - ultima capa.docx", POR_CAPAS_LAST_LAYER],
    ["Pyraminx L4E - ultimas 4 aristas.docx", L4E_CASES],
  ] as const)("%s", (file, cases) => {
    const sheet = sheetAlgorithms(file);
    expect(sheet.size).toBe(cases.length);
    for (const kase of cases) {
      const text = sheet.get(kase.doc);
      if (kase.source === "documento") expect(kase.docText ?? kase.algorithm, `fila ${kase.doc}`).toBe(text);
      else expect(kase.docAlgorithm, `fila ${kase.doc}`).toBe(text);
      if (kase.docText) expect(parsePyraAlgorithm(kase.docText)).toEqual(parsePyraAlgorithm(kase.algorithm));
    }
  });
});
