/**
 * The last layer corners as the tests count them: which corner sits in
 * each top slot and how it is turned, the case they make whatever U turn
 * comes before or after, and their shape (O, H, Pi, U, T, L, Sune,
 * Antisune). Shared by the COLL, OCLL and CMLL tests.
 */
import type { CubeState, Vec3 } from "@/features/cube/types";
import { caseState3 as unheldCase, heldLike, sheetSolved3 } from "./cube3";

const solved = sheetSolved3();
const same = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const caseState3 = (algorithm: string) => heldLike(unheldCase(algorithm));

/** The top corners, clockwise seen from above: back left, back right, front right, front left. */
export const SLOTS: Vec3[] = [
  [-1, 1, -1],
  [1, 1, -1],
  [1, 1, 1],
  [-1, 1, 1],
];

/**
 * The top corners as (which corner, how it is turned) per slot. The turn
 * counts where yellow is in a cycle of the corner's three faces that a U
 * turn carries from slot to slot (top, then the side along x or z).
 */
export function topCorners(state: CubeState): { piece: number; twist: number }[] {
  return SLOTS.map((slot) => {
    const cubie = state.cubies.find((c) => same(c.position, slot))!;
    const home = solved.cubies.find((c) => c.id === cubie.id)!.position;
    const piece = SLOTS.findIndex((s) => same(s, home));
    const cycle: Vec3[] =
      slot[0] * slot[2] > 0
        ? [[0, 1, 0], [slot[0], 0, 0], [0, 0, slot[2]]]
        : [[0, 1, 0], [0, 0, slot[2]], [slot[0], 0, 0]];
    const yellow = cubie.stickers.find((s) => s.color === "yellow")!;
    const axis = yellow.face[1] as "x" | "y" | "z";
    const sign = yellow.face[0] === "+" ? 1 : -1;
    const normal = cubie.orientation[axis].map((c) => c * sign) as unknown as Vec3;
    return { piece, twist: cycle.findIndex((n) => same(n, normal)) };
  });
}

export type Corners = { piece: number; twist: number }[];

/** The same case whatever U turn comes before (slots) or after (which corner is which). */
export function caseKey(corners: Corners): string {
  const keys: string[] = [];
  for (let before = 0; before < 4; before++) {
    for (let after = 0; after < 4; after++) {
      keys.push(
        SLOTS.map((_, i) => {
          const { piece, twist } = corners[(i + before) % 4];
          return `${(piece + after) % 4}${twist}`;
        }).join(),
      );
    }
  }
  return keys.sort()[0];
}

/** Every way the top corners can be, as the engine allows them (twists add up to a whole turn). */
export function allCornerCases(): Set<string> {
  const keys = new Set<string>();
  const perms = (items: number[]): number[][] =>
    items.length === 0 ? [[]] : items.flatMap((x) => perms(items.filter((y) => y !== x)).map((rest) => [x, ...rest]));
  for (const perm of perms([0, 1, 2, 3])) {
    for (let t = 0; t < 27; t++) {
      const twists = [t % 3, Math.floor(t / 3) % 3, Math.floor(t / 9) % 3];
      twists.push((6 - twists[0] - twists[1] - twists[2]) % 3);
      keys.add(caseKey(perm.map((piece, i) => ({ piece, twist: twists[i] }))));
    }
  }
  return keys;
}

export const SOLVED_KEY = caseKey(topCorners(solved));

const SUNE_TWIST = () => topCorners(caseState3("R U R' U R U2 R'")).find((c) => c.twist !== 0)!.twist;

/** The family of the corners' shape on top: O, H, Pi, U, T, L, S (Sune) or AS (Antisune). */
export function shapeOf(state: CubeState): string {
  const corners = topCorners(state);
  const up = corners.filter((c) => c.twist === 0).length;
  // Where the yellow of each turned corner looks.
  const looks = SLOTS.flatMap((slot) => {
    const cubie = state.cubies.find((c) => same(c.position, slot))!;
    const yellow = cubie.stickers.find((s) => s.color === "yellow")!;
    const normal = cubie.orientation[yellow.face[1] as "x" | "y" | "z"].map((c) => c * (yellow.face[0] === "+" ? 1 : -1));
    return normal[1] === 1 ? [] : [normal.join()];
  });
  if (up === 4) return "O";
  if (up === 0) return new Set(looks).size === 2 ? "H" : "Pi";
  if (up === 1) return corners.every((c) => c.twist === 0 || c.twist === SUNE_TWIST()) ? "S" : "AS";
  const diagonal = (corners[0].twist === 0 && corners[2].twist === 0) || (corners[1].twist === 0 && corners[3].twist === 0);
  if (diagonal) return "L";
  return looks[0] === looks[1] ? "U" : "T";
}
