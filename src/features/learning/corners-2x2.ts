/**
 * The 2×2's corners as the tests count cases (CLL, EG, LEG, TCLL), held
 * like the sheets: yellow up, white down. Each layer is read as its four
 * slots clockwise from above (front right, front left, back left, back
 * right): which corner sits there, counted around its own face, and how it
 * is turned (where its yellow or white sticker is, read clockwise from the
 * top or bottom sticker of the slot).
 *
 * A case is the same whatever U or D turn comes before (or a y, which is
 * both) and whatever U or D turn comes after, so `caseKey2` keeps only how
 * the corners of each layer sit relative to each other.
 */
import type { CubeColor } from "@/features/cube/types";
import { CORNER_FACELETS_2, faceOffset2, faceletsFromCorners } from "@/features/solver2x2/facelets";
import { applyMoves2, solvedFacelets2 } from "@/features/solver2x2/sticker-moves";
import { SHEET_FRAME } from "./cases-2x2";

const TOP = [0, 1, 2, 3];
const BOTTOM = [4, 5, 6, 7];

const sheetSolved = () => applyMoves2(solvedFacelets2(), SHEET_FRAME);

const colorsAt = (facelets: readonly CubeColor[], slot: number) => CORNER_FACELETS_2[slot].map((i) => facelets[i]);
const corner = (colors: CubeColor[]) => [...colors].sort().join();

/** Where each corner (by its colors) sits on the solved cube: its slot index within its layer. */
const HOME = (() => {
  const solved = sheetSolved();
  const home = new Map<string, number>();
  [TOP, BOTTOM].forEach((layer) => layer.forEach((slot, i) => home.set(corner(colorsAt(solved, slot)), i)));
  return home;
})();

export interface LayerCorner {
  /** The corner's place around its own face (0–3), or -1 if it belongs to the other layer. */
  piece: number;
  /** 0: yellow or white faces up or down; 1 or 2: turned one way or the other. */
  twist: number;
}

/** The four corners of a layer, slot by slot. */
export function layerCorners(facelets: readonly CubeColor[], layer: "top" | "bottom"): LayerCorner[] {
  const own = layer === "top" ? "yellow" : "white";
  return (layer === "top" ? TOP : BOTTOM).map((slot) => {
    const colors = colorsAt(facelets, slot);
    const ud = colors.findIndex((c) => c === "yellow" || c === "white");
    return { piece: colors.includes(own) ? HOME.get(corner(colors))! : -1, twist: ud };
  });
}

/** The layer as text, with its pieces counted from the first slot's, so a U turn after does not change it. */
const relative = (corners: LayerCorner[]) =>
  corners.map(({ piece, twist }) => `${piece < 0 ? "x" : (piece - corners[0].piece + 4) % 4}${twist}`).join("");

const rotate = <T,>(items: T[], k: number) => items.map((_, i) => items[(i + k) % items.length]);

/** The case, whatever U and D turns come before and after. */
export function caseKey2(facelets: readonly CubeColor[]): string {
  const top = layerCorners(facelets, "top");
  const bottom = layerCorners(facelets, "bottom");
  const tops = [0, 1, 2, 3].map((k) => relative(rotate(top, k))).sort();
  const bottoms = [0, 1, 2, 3].map((k) => relative(rotate(bottom, k))).sort();
  return `${tops[0]}|${bottoms[0]}`;
}

/** Every position with a whole white face at the bottom: any top, the bottom corners in any order. */
export function firstFaceStates(): CubeColor[][] {
  const perms = (items: number[]): number[][] =>
    items.length <= 1 ? [items] : items.flatMap((item, i) => perms(items.filter((_, j) => j !== i)).map((rest) => [item, ...rest]));
  const states: CubeColor[][] = [];
  // RUBIKO's own frame has white on top: build it there and turn it over like the sheets.
  for (const white of perms([0, 1, 2, 3])) {
    for (const yellow of perms([4, 5, 6, 7])) {
      for (let t = 0; t < 27; t++) {
        const co = [t % 3, Math.floor(t / 3) % 3, Math.floor(t / 9) % 3];
        co.push((6 - co[0] - co[1] - co[2]) % 3);
        states.push(applyMoves2(faceletsFromCorners({ cp: [...white, ...yellow], co: [0, 0, 0, 0, ...co] }), SHEET_FRAME));
      }
    }
  }
  return states;
}

/** Whether the bottom face is all white. */
export const whiteFaceDown = (facelets: readonly CubeColor[]) =>
  [0, 1, 2, 3].every((n) => facelets[faceOffset2("D") + n] === "white");

/** The top's corner shape: O, H, Pi, U, T, L, Sune or Antisune (named as SpeedCubeDB: S and AS). */
export function topShape2(facelets: readonly CubeColor[]): string {
  const top = layerCorners(facelets, "top");
  const up = top.filter((c) => c.twist === 0).length;
  const looks = TOP.flatMap((slot) => {
    const stickers = CORNER_FACELETS_2[slot];
    const yellow = stickers.find((i) => facelets[i] === "yellow")!;
    return yellow === stickers[0] ? [] : [Math.floor(yellow / 4)];
  });
  if (up === 4) return "O";
  if (up === 0) return new Set(looks).size === 2 ? "H" : "Pi";
  if (up === 1) return top.every((c) => c.twist === 0 || c.twist === SUNE_TWIST) ? "S" : "AS";
  const diagonal = (top[0].twist === 0 && top[2].twist === 0) || (top[1].twist === 0 && top[3].twist === 0);
  if (diagonal) return "L";
  return looks[0] === looks[1] ? "U" : "T";
}

/** How the Sune's three turned corners are turned. */
const SUNE_TWIST = (() => {
  // The Sune case: R U R' U R U2 R' undone from solved.
  const sune = applyMoves2(sheetSolved(), ["R", "U2", "R'", "U'", "R", "U'", "R'"]);
  return layerCorners(sune, "top").find((c) => c.twist !== 0)!.twist;
})();
