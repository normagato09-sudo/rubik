/**
 * Every 2×2 diagram RUBIKO draws itself (the ones the sheets do not have),
 * by the public path it is served from. Kept out of cases-2x2.ts so the
 * app never builds them at run time: the SVG files in public/learning are
 * written from here, and generated-diagrams-2x2.test.ts checks they still
 * match (`WRITE_DIAGRAMS=1 npx vitest run generated-diagrams` rewrites them).
 */
import { CORNER_FACELETS_2 } from "@/features/solver2x2/facelets";
import { ALGORITHM_SETS } from "./sets";
import { caseFacelets } from "./cases-2x2";
import { cornerViewSvg, notationBSvg, topViewSvg } from "./diagrams-2x2";

/** Kociemba corner slots (see CORNER_FACELETS_2): URF, DLF, DRB. */
const URF = 0;
const DLF = 5;
const DRB = 7;

/**
 * First-layer cases, seen from the front-right-top corner: the corner to
 * place (above its slot) in color. For the first layer (CLL) also the
 * front and right stickers of the bottom corners already placed, since
 * their side colors must match; for the first face (Ortega) only white
 * matters, so they stay grey.
 */
function firstLayerStickers(setId: "primera-cara" | "primera-capa"): Set<number> {
  const shown = new Set(CORNER_FACELETS_2[URF]);
  if (setId === "primera-capa") {
    shown.add(CORNER_FACELETS_2[DLF][2]); // F, bottom left
    shown.add(CORNER_FACELETS_2[DRB][1]); // R, bottom right
  }
  return shown;
}

export function generatedDiagrams(): Record<string, string> {
  const diagrams: Record<string, string> = {};
  for (const setId of ["primera-cara", "primera-capa"] as const) {
    for (const kase of ALGORITHM_SETS[setId]) {
      diagrams[kase.image] = cornerViewSvg(
        caseFacelets(kase.algorithm),
        firstLayerStickers(setId),
        `Caso ${kase.name}`,
      );
    }
  }
  for (const kase of ALGORITHM_SETS.cll) {
    if (kase.image.endsWith(".svg")) {
      diagrams[kase.image] = topViewSvg(caseFacelets(kase.algorithm), `Caso ${kase.name}`);
    }
  }
  diagrams["/learning/notation-2x2/notation-2x2-b.svg"] = notationBSvg();
  return diagrams;
}
