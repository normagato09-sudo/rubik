import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALGORITHM_FIX,
  ESQUINAS_DRAWN,
  SETS_CFOP_4X4,
  case3,
  case4,
  cfop4Cases,
  frame3,
  generatedCfop4Diagrams,
  lift3,
  type Cfop4SetId,
} from "./cases-4x4-cfop";
import { STICKERS_4, allPaired, apply4, centersSolved, parse4 } from "./cube4";

const file = (image: string) => join(process.cwd(), "public", image);

describe("CFOP on the 4×4", () => {
  it("every case is a reduced 4×4: the 3×3 case of its algorithm, lifted to the 4×4", () => {
    for (const [setId, cases] of Object.entries(cfop4Cases()) as [Cfop4SetId, ReturnType<typeof cfop4Cases>[Cfop4SetId]][]) {
      if (setId === "c4-esquinas") continue; // drawn from the sheet: checked below
      for (const kase of cases) {
        const algorithm3 = ALGORITHM_FIX[setId]?.[kase.source.id] ?? kase.source.algorithm;
        expect(allPaired(kase.start) && centersSolved(kase.start, kase.frame), `${setId} ${kase.source.id}`).toBe(true);
        expect(kase.start.join(), `${setId} ${kase.source.id}`).toBe(lift3(case3(algorithm3, frame3(setId))).join());
      }
    }
  });

  it("the 4×4 algorithm solves its case on the 4×4", () => {
    for (const cases of Object.values(cfop4Cases())) {
      for (const kase of cases.filter((k) => k.setId !== "c4-esquinas")) {
        expect(case4(kase.algorithm, kase.frame).join(), `${kase.setId} ${kase.source.id}`).toBe(kase.start.join());
      }
    }
  });

  it("two-layer turns are 3Rw: with Rw the 4×4 would not do what the 3×3 does", () => {
    const wide = Object.values(cfop4Cases()).flat().filter((kase) => /3[RLUDFB]w/.test(kase.algorithm));
    expect(wide.length).toBeGreaterThan(30);
    for (const kase of wide) {
      let same = false;
      try {
        same = case4(kase.algorithm.replace(/3([RLUDFB])w/g, "$1w"), kase.frame).join() === kase.start.join();
      } catch {
        same = false;
      }
      expect(same, `${kase.setId} ${kase.source.id}`).toBe(false);
    }
  });

  it("Esquinas: each algorithm solves its drawing, or leaves the case it says", () => {
    const cases = cfop4Cases()["c4-esquinas"];
    // The white layer: the top face and the top row of the sides.
    const whiteLayer = STICKERS_4.flatMap(({ face, row }, i) => (face === "U" || (face !== "D" && row === 0) ? [i] : []));
    for (const kase of cases) {
      const drawn = ESQUINAS_DRAWN[kase.source.id];
      expect(allPaired(kase.start) && centersSolved(kase.start, kase.frame)).toBe(true);
      const end = apply4(kase.start, parse4(`${kase.algorithm}${drawn.then.turn ? ` ${drawn.then.turn}` : ""}`));
      if (!drawn.then.case) {
        expect(whiteLayer.every((i) => end[i] === kase.frame[i]), kase.source.id).toBe(true);
      } else {
        const next = cases.find((other) => other.source.id === drawn.then.case)!;
        expect([...next.shown].every((i) => end[i] === next.start[i]), kase.source.id).toBe(true);
        expect(whiteLayer.every((i) => end[i] === kase.frame[i]), kase.source.id).toBe(false);
      }
    }
  });
});

describe("the CFOP 4×4 diagrams", () => {
  const diagrams = generatedCfop4Diagrams();
  if (process.env.WRITE_DIAGRAMS === "1") {
    for (const [image, svg] of Object.entries(diagrams)) {
      mkdirSync(dirname(file(image)), { recursive: true });
      writeFileSync(file(image), svg);
    }
  }
  it("one per case, and the files in public/learning are what the cases draw", () => {
    const cases = Object.values(SETS_CFOP_4X4).flat();
    expect(Object.keys(diagrams)).toHaveLength(cases.length);
    for (const [image, svg] of Object.entries(diagrams)) {
      expect(existsSync(file(image)), image).toBe(true);
      expect(readFileSync(file(image), "utf8").replace(/\r\n/g, "\n"), image).toBe(svg);
    }
  });
});
