import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { applyMoves, type Move } from "@/features/cube/moves";
import type { CubeColor } from "@/features/cube/types";
import { parseAlgorithm } from "./algorithm";
import { CLL_CASES, ORTEGA_OLL, ORTEGA_PBL, type CaseAlgorithm } from "./algorithms";
import { CORNER_COLORS, faceOffset2, faceletsFromCorners, identifyCorner, isSolved2, type CornerState } from "./facelets";
import { MOVE_CUBES, multiply, solvedCube } from "@/features/solver/cubie";
import { adjustments, layerSwap } from "./case-check";
import { applyMoves2, cubeStateForSolution2, faceletsFromCubeState2, solvedFacelets2 } from "./sticker-moves";

/**
 * Every algorithm is checked against the case its sheet's diagram shows
 * (the `picture` in algorithms.ts), with the 3D move engine — not against
 * whatever the algorithm happens to do.
 */

const AUF: Move[][] = [[], ["U"], ["U2"], ["U'"]];
const ADF: Move[][] = [[], ["D"], ["D2"], ["D'"]];

/** Sticker model (built from the 3D engine; checked against it below). */
const play = (facelets: CubeColor[], moves: Move[]) => applyMoves2(facelets, moves);

/**
 * `moves` solve `state` according to the 3D engine itself: the engine
 * replays them backwards from solved and must land on exactly these stickers.
 */
const solvesIn3D = (state: CubeColor[], moves: Move[]) => cubeStateForSolution2(state, moves) !== null;

/** The first U/D adjustment around `algorithm` that solves `state`, if any. */
function withAdjustments(state: CubeColor[], algorithm: Move[], pres: Move[][], posts: (a: Move[]) => Move[][]): Move[] | null {
  for (const pre of pres) for (const post of posts(algorithm)) {
    const full = [...pre, ...algorithm, ...post];
    if (isSolved2(play(state, full))) return full;
  }
  return null;
}
const UD = AUF.flatMap((u) => ADF.map((d) => [...u, ...d]));
/** U (and D) turns after an algorithm, on the layers that were U and D before its rotations. */
const afterU = (algorithm: Move[]) => adjustments(algorithm, "U");
const afterUD = (algorithm: Move[]) =>
  adjustments(algorithm, "U").flatMap((u) => adjustments(algorithm, "D").map((d) => [...u, ...d]));

/** The 24 × 27 = 648 positions with the bottom layer solved (top corners anywhere, any twist). */
function topLayerCorners(): CornerState[] {
  const states: CornerState[] = [];
  const perms = (items: number[]): number[][] =>
    items.length <= 1 ? [items] : items.flatMap((item, i) => perms(items.filter((_, j) => j !== i)).map((rest) => [item, ...rest]));
  for (const perm of perms([0, 1, 2, 3])) {
    for (let twists = 0; twists < 27; twists++) {
      const co = [twists % 3, Math.floor(twists / 3) % 3, Math.floor(twists / 9) % 3];
      co.push((6 - co[0] - co[1] - co[2]) % 3);
      states.push({ cp: [...perm, 4, 5, 6, 7], co: [...co, 0, 0, 0, 0] });
    }
  }
  return states;
}

const topLayerStates = () => topLayerCorners().map(faceletsFromCorners);

/** Both layers oriented, corners of each layer in any order: 24 × 24 positions. */
function orientedStates(): CubeColor[][] {
  const perms = (items: number[]): number[][] =>
    items.length <= 1 ? [items] : items.flatMap((item, i) => perms(items.filter((_, j) => j !== i)).map((rest) => [item, ...rest]));
  return perms([0, 1, 2, 3]).flatMap((top) =>
    perms([4, 5, 6, 7]).map((bottom) => faceletsFromCorners({ cp: [...top, ...bottom], co: Array(8).fill(0) })),
  );
}

const at = (face: "U" | "R" | "F" | "L" | "B", n: number) => faceOffset2(face) + n;

/** The diagram's 12 stickers: top (back row, front row), then back, front, left and right sides' top rows. */
const VIEW = [at("U", 0), at("U", 1), at("U", 2), at("U", 3), at("B", 1), at("B", 0), at("F", 0), at("F", 1), at("L", 0), at("L", 1), at("R", 1), at("R", 0)];

/** OLL diagrams mark only the top color: our top is white where theirs is yellow. */
const showsOll = (facelets: CubeColor[], picture: string) =>
  VIEW.every((index, i) => (facelets[index] === "white") === (picture[i] === "y"));

const LETTER: Record<string, CubeColor> = { y: "yellow", w: "white", r: "red", o: "orange", g: "green", b: "blue" };

/**
 * CLL diagrams are drawn yellow on top: same picture up to renaming the
 * colors — but only a renaming a real cube allows (turning it over), which
 * keeps every corner a real corner; a mirror renaming would match the
 * mirror-image case.
 */
function showsCll(facelets: CubeColor[], picture: string) {
  const to = new Map<CubeColor, CubeColor>();
  const from = new Map<CubeColor, CubeColor>();
  const consistent = VIEW.every((index, i) => {
    const ours = facelets[index];
    const theirs = LETTER[picture[i]];
    if ((to.get(ours) ?? theirs) !== theirs || (from.get(theirs) ?? ours) !== ours) return false;
    to.set(ours, theirs);
    from.set(theirs, ours);
    return true;
  });
  if (!consistent) return false;
  // The one color not in view (the bottom) goes to the one left over.
  const left = Object.values(LETTER).filter((color) => !from.has(color));
  const ours = (Object.values(LETTER) as CubeColor[]).filter((color) => !to.has(color));
  if (left.length === 1 && ours.length === 1) to.set(ours[0], left[0]);
  return CORNER_COLORS.every((corner) => identifyCorner(corner.map((color) => to.get(color)!)).corner !== -1);
}

const oriented = (facelets: CubeColor[]) =>
  (["U", "D"] as const).every((face) => {
    const stickers = facelets.slice(faceOffset2(face), faceOffset2(face) + 4);
    return stickers.every((color) => color === stickers[0]);
  });

const moves = (kase: CaseAlgorithm) => parseAlgorithm(kase.algorithm);

describe("the sticker moves match the 3D engine", () => {
  it("every algorithm gives the same stickers with both", () => {
    for (const kase of [...ORTEGA_OLL, ...ORTEGA_PBL, ...CLL_CASES]) {
      const viaEngine = faceletsFromCubeState2(applyMoves(createSolvedCube(2), moves(kase)));
      expect(play(faceletsFromCubeState2(createSolvedCube(2)), moves(kase)), kase.id).toEqual(viaEngine);
    }
  });
});

describe("Ortega · OLL", () => {
  it("has the 7 cases", () => {
    expect([...ORTEGA_OLL.map((kase) => kase.name)].sort()).toEqual(["Antisune", "H", "L", "Pi", "Sune", "T", "U"]);
    expect(new Set(ORTEGA_OLL.map((kase) => kase.name)).size).toBe(7);
  });

  it.each(ORTEGA_OLL.map((kase) => [kase.name, kase] as const))("%s orients the case its diagram shows", (_, kase) => {
    const cases = topLayerStates().filter((state) => showsOll(state, kase.picture));
    expect(cases.length).toBeGreaterThan(0);
    for (const state of cases) expect(oriented(play(state, moves(kase)))).toBe(true);
  });

  it("every way the top can be twisted is one of the 7 cases (with a U turn before)", () => {
    const used = new Set<string>();
    for (const state of topLayerStates().filter((s) => !oriented(s))) {
      const kase = ORTEGA_OLL.find((k) => AUF.some((pre) => oriented(play(state, [...pre, ...moves(k)]))));
      expect(kase).toBeDefined();
      used.add(kase!.id);
    }
    expect(used.size).toBe(7);
  }, 60_000);
});

describe("Ortega · PBL", () => {
  it.each(ORTEGA_PBL.map((kase) => [kase.name, kase] as const))("%s solves its case", (_, kase) => {
    const cases = orientedStates().filter(
      (state) => layerSwap(state, "top") === kase.top && layerSwap(state, "bottom") === kase.bottom,
    );
    expect(cases.length).toBeGreaterThan(0);
    for (const state of cases) {
      const solution = withAdjustments(state, moves(kase), UD, afterUD);
      expect(solution).not.toBeNull();
      expect(solvesIn3D(state, solution!)).toBe(true);
    }
  });

  it("covers every oriented cube (a bottom-only swap turned over with x2)", () => {
    for (const state of orientedStates()) {
      const solvable = [[], ["x2"]].some((flip) =>
        [[] as Move[], ...ORTEGA_PBL.map(moves)].some((algorithm) =>
          AUF.some((preU) =>
            ADF.some((preD) =>
              AUF.some((postU) =>
                ADF.some((postD) => isSolved2(play(state, [...(flip as Move[]), ...preU, ...preD, ...algorithm, ...postU, ...postD]))),
              ),
            ),
          ),
        ),
      );
      expect(solvable).toBe(true);
    }
  }, 60_000);
});

describe("CLL", () => {
  it("has the 42 cases, each once", () => {
    expect(CLL_CASES).toHaveLength(42);
    expect(new Set(CLL_CASES.map((kase) => kase.id)).size).toBe(42);
  });

  it.each(CLL_CASES.map((kase) => [kase.name, kase] as const))("%s solves the case its diagram shows", (_, kase) => {
    const cases = topLayerStates().filter((state) =>
      kase.picture
        ? showsCll(state, kase.picture)
        : oriented(state) && layerSwap(state, "top") === kase.swap && !isSolved2(state),
    );
    expect(cases.length).toBeGreaterThan(0);
    // A diagram shows only the top layer, so a symmetric one (the H cases)
    // matches two views a U2 apart; the sheet's algorithm solves at least
    // one exactly as drawn (its own U turn included) and the other after a U turn.
    if (kase.picture) expect(cases.some((state) => withAdjustments(state, moves(kase), [[]], afterU))).toBeTruthy();
    for (const state of cases) {
      // The sheet's algorithms already start with their U turn; the ones it lacks may need one.
      const solution = withAdjustments(state, moves(kase), AUF, afterU);
      expect(solution).not.toBeNull();
      expect(solvesIn3D(state, solution!)).toBe(true);
    }
  });

  it("there are exactly 42 cases, and the algorithms cover all of them", () => {
    const states = topLayerStates();
    // A position is g (moves from solved); solving it with a U turn before
    // (another view) and after (top against bottom) means U^b · g · U^a is the same case.
    const turnsU = [null, 0, 1, 2].map((m) => (m === null ? solvedCube() : MOVE_CUBES[m]));
    const canonical = (g: CornerState) =>
      turnsU
        .flatMap((b) => turnsU.map((a) => {
          const full = multiply(multiply(b, { ...solvedCube(), ...g }), a);
          return faceletsFromCorners(full).join();
        }))
        .sort()[0];
    const solvedKey = faceletsFromCorners(solvedCube()).join();
    const classes = new Set(topLayerCorners().map(canonical));
    classes.delete(canonical(solvedCube()));
    expect(solvedKey).toBe(solvedFacelets2().join());
    expect(classes.size).toBe(42);

    const used = new Set<string>();
    for (const state of states.filter((s) => !AUF.some((post) => isSolved2(applyMoves2(s, post))))) {
      const kase = CLL_CASES.find((k) => withAdjustments(state, moves(k), AUF, afterU));
      expect(kase).toBeDefined();
      used.add(kase!.id);
    }
    expect(used.size).toBe(42);
  }, 60_000);
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

/** Algorithm column of the sheet's table, by row number, with ’ and repeated spaces normalized. */
function sheetAlgorithms(file: string): Map<number, string> {
  const xml = readZipEntry(join(process.cwd(), "docs/source", file), "word/document.xml");
  const rows = new Map<number, string>();
  for (const row of xml.split(/<w:tr[ >]/).slice(2)) {
    const cells = row.split(/<w:tc[ >]/).slice(1).map((cell) =>
      [...cell.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("").trim(),
    );
    rows.set(Number(cells[0]), cells.at(-1)!.replace(/’/g, "'").replace(/\s+/g, " "));
  }
  return rows;
}

describe("the algorithms come from docs/source", () => {
  it.each([
    ["Ortega.docx", [...ORTEGA_OLL, ...ORTEGA_PBL]],
    ["CLL.docx", CLL_CASES],
  ] as const)("%s", (file, cases) => {
    const sheet = sheetAlgorithms(file);
    const texts = [...sheet.values()];
    for (const kase of cases) {
      if (kase.source === "documento") expect(kase.algorithm, kase.id).toBe(sheet.get(kase.doc!));
      if (kase.source === "documento (otra fila)") {
        expect(texts.concat([...sheetAlgorithms("Ortega.docx").values()]), kase.id).toContain(kase.algorithm);
      }
      if (kase.docAlgorithm) expect(kase.docAlgorithm, kase.id).toBe(sheet.get(kase.doc!));
    }
  });

  it("the sheets' own wrong algorithms really are wrong (so replacing them was needed)", () => {
    const pi = ORTEGA_OLL.find((kase) => kase.id === "pi")!;
    const piCases = topLayerStates().filter((state) => showsOll(state, pi.picture));
    expect(piCases.some((state) => oriented(play(state, parseAlgorithm(pi.docAlgorithm!))))).toBe(false);

    for (const kase of ORTEGA_PBL.filter((k) => k.docAlgorithm)) {
      const cases = orientedStates().filter(
        (state) => layerSwap(state, "top") === kase.top && layerSwap(state, "bottom") === kase.bottom,
      );
      const works = cases.every((state) =>
        AUF.some((preU) =>
          ADF.some((preD) =>
            AUF.some((postU) =>
              ADF.some((postD) => isSolved2(play(state, [...preU, ...preD, ...parseAlgorithm(kase.docAlgorithm!), ...postU, ...postD]))),
            ),
          ),
        ),
      );
      expect(works, kase.id).toBe(false);
    }
  });
});
