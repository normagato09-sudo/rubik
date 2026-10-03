/**
 * Every 3×3 diagram RUBIKO draws itself, by the public path it is served
 * from. Like generated-diagrams-2x2.ts, kept out of the cases so the app
 * never builds them at run time: generated-diagrams-3x3.test.ts checks the
 * SVG files in public/learning still match (`WRITE_DIAGRAMS=1 npx vitest
 * run generated-diagrams` rewrites them).
 */
import type { CubeState, Vec3 } from "@/features/cube/types";
import { FACELET_GEOMETRY } from "@/features/solver/cube-state";
import { caseState3, facelets3, sheetSolved3, sticker3 } from "./cube3";
import {
  ALL_EDGES,
  FREE_EDGES,
  PETRUS_222,
  PETRUS_223,
  PETRUS_F2L,
  ZZ_F2L,
  ZZ_LINE,
  type StepCaseDef,
} from "./cases-3x3-research";
import { cornerViewSvg3, topViewSvg3, type CornerView } from "./diagrams-3x3";
import { ALGORITHM_SETS } from "./sets";

const solved = sheetSolved3();
const same = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** The stickers, wherever they are now, of the pieces whose home `colored` picks. */
function stickersOfPieces(state: CubeState, colored: (home: Vec3) => boolean): Set<number> {
  const shown = new Set<number>();
  FACELET_GEOMETRY.forEach(([position], index) => {
    const cubie = state.cubies.find((piece) => same(piece.position, position))!;
    const home = solved.cubies.find((piece) => piece.id === cubie.id)!.position;
    if (colored(home)) shown.add(index);
  });
  return shown;
}

/** A step's case: the pieces of the block it finishes (what is built and what it places), in color. */
function stepDiagram(def: StepCaseDef, view: CornerView, title: string): string {
  const state = caseState3(def.algorithm);
  return cornerViewSvg3(facelets3(state), stickersOfPieces(state, def.goal), def.view ?? view, title);
}

/** Edge orientation: only the edges (all of them, or the ones still free) in color. */
function edgesDiagram(algorithm: string, edges: Vec3[], title: string): string {
  const state = caseState3(algorithm);
  const shown = stickersOfPieces(state, (home) => edges.some((edge) => same(edge, home)));
  return cornerViewSvg3(facelets3(state), shown, "delante-derecha", title);
}

/** The top layer with the corners and the top of the edges: COLL does not look at the edges' sides. */
const COLL_SHOWN = new Set(
  Array.from({ length: 54 }, (_, i) => i).filter(
    (i) => !(["F", "R", "B", "L"] as const).some((face) => i === sticker3(face, 1)),
  ),
);

export function generatedDiagrams3x3(): Record<string, string> {
  const diagrams: Record<string, string> = {};
  const steps = [
    { setId: "petrus-222", defs: PETRUS_222, view: "delante-izquierda" },
    { setId: "petrus-223", defs: PETRUS_223, view: "detras-izquierda" },
    { setId: "petrus-f2l", defs: PETRUS_F2L, view: "delante-derecha" },
    { setId: "zz-linea", defs: ZZ_LINE, view: "delante-derecha" },
    { setId: "zz-f2l", defs: ZZ_F2L, view: "delante-derecha" },
  ] as const;
  for (const { setId, defs, view } of steps) {
    ALGORITHM_SETS[setId].forEach((kase, index) => {
      diagrams[kase.image] = stepDiagram(defs[index], view, `Caso ${kase.id}`);
    });
  }
  for (const kase of ALGORITHM_SETS["petrus-eo"]) diagrams[kase.image] = edgesDiagram(kase.algorithm, FREE_EDGES, `Caso ${kase.id}`);
  for (const kase of ALGORITHM_SETS["zz-eo"]) diagrams[kase.image] = edgesDiagram(kase.algorithm, ALL_EDGES, `Caso ${kase.id}`);
  for (const kase of ALGORITHM_SETS["petrus-coll"]) {
    diagrams[kase.image] = topViewSvg3(facelets3(caseState3(kase.algorithm)), `Caso ${kase.name}`, COLL_SHOWN);
  }
  return diagrams;
}
