/**
 * What the tests (and Aprender's case data) need to check a 2×2 case:
 * which layer an algorithm leaves where, the U/D adjustments around it,
 * and whether a layer's corners are in place, swapped with a neighbor or
 * swapped across the diagonal.
 */
import { isRotation, moveVector, type Face, type Move } from "@/features/cube/moves";
import type { CubeColor, Vec3 } from "@/features/cube/types";
import type { LayerSwap } from "./algorithms";
import { faceOffset2 } from "./facelets";

const FACE_AT: [Vec3, Face][] = [
  [[0, 1, 0], "U"],
  [[0, -1, 0], "D"],
  [[1, 0, 0], "R"],
  [[-1, 0, 0], "L"],
  [[0, 0, 1], "F"],
  [[0, 0, -1], "B"],
];

/**
 * Where the `layer` an algorithm started on ends up once its whole-cube
 * rotations are done: "x' U2 R..." leaves the old top in front, so the
 * last adjustment of that layer is an F turn, not a U turn.
 */
export function layerAfter(moves: readonly Move[], layer: Face): Face {
  let direction = FACE_AT.find(([, face]) => face === layer)![0];
  for (const move of moves) if (isRotation(move)) direction = moveVector(move, direction);
  return FACE_AT.find(([v]) => v.every((c, i) => c === direction[i]))![1];
}

/** The four ways of adjusting `layer` after `moves` (none, quarter, half, back). */
export function adjustments(moves: readonly Move[], layer: Face): Move[][] {
  const face = layerAfter(moves, layer);
  return [[], [face], [`${face}2`], [`${face}'`]] as Move[][];
}

/** A layer: how many sides have its two stickers matching (4 solved, 1 adjacent swap, 0 diagonal). */
export function layerSwap(facelets: readonly CubeColor[], layer: "top" | "bottom"): LayerSwap {
  const row = layer === "top" ? 0 : 2;
  const matching = (["F", "R", "B", "L"] as const).filter((side) => {
    const o = faceOffset2(side) + row;
    return facelets[o] === facelets[o + 1];
  }).length;
  return matching === 4 ? "solved" : matching === 0 ? "diag" : "adj";
}
