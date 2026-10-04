/**
 * Diagrams for the 3×3 cases RUBIKO teaches from research, drawn from the
 * case itself (the 54 stickers the 3D engine gives), so a drawing can
 * never disagree with its algorithm. Same look as the 2×2 ones
 * (diagrams-2x2.ts): the sheets' flat colors, yellow on top.
 *
 * - `topViewSvg3`: the top layer seen from above, with the top row of each
 *   side as bars around it — for the last-layer sets (COLL, EPLL...).
 * - `cornerViewSvg3`: the cube seen from one of its top corners (the top
 *   face and two sides), for the block and F2L steps: only the stickers
 *   that matter are colored, the rest are grey.
 */
import type { CubeColor, Vec3 } from "@/features/cube/types";
import { FACELET_GEOMETRY } from "@/features/solver/cube-state";
import { SHEET_HEX } from "./diagrams-2x2";
import { sticker3 } from "./cube3";

const GREY = "#9a9a9a";
const LINE = "#262626";

const rect = (x: number, y: number, w: number, h: number, fill: string, r: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${LINE}" stroke-width="1.5"/>`;

const svg = (body: string, title: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${title}">\n<title>${title}</title>\n${body}\n</svg>\n`;

/**
 * Seen from above with the front at the bottom: the 9 top stickers and,
 * around them, the top row of the back, front, left and right sides.
 */
export function topViewSvg3(facelets: readonly CubeColor[], title: string, shown?: ReadonlySet<number>): string {
  const fill = (index: number) => (!shown || shown.has(index) ? SHEET_HEX[facelets[index]] : GREY);
  const cells = [35, 79, 123];
  const parts: string[] = [];
  for (let n = 0; n < 9; n++) parts.push(rect(cells[n % 3], cells[Math.floor(n / 3)], 42, 42, fill(sticker3("U", n)), 6));
  for (let i = 0; i < 3; i++) {
    // From above, the back row reads right to left and the right side front to back.
    parts.push(rect(cells[i] + 3, 13, 36, 17, fill(sticker3("B", 2 - i)), 3));
    parts.push(rect(cells[i] + 3, 170, 36, 17, fill(sticker3("F", i)), 3));
    parts.push(rect(13, cells[i] + 3, 17, 36, fill(sticker3("L", i)), 3));
    parts.push(rect(170, cells[i] + 3, 17, 36, fill(sticker3("R", 2 - i)), 3));
  }
  return svg(parts.join("\n"), title);
}

/** Which top corner the cube is seen from: the two sides that show besides the top. */
export type CornerView = "delante-derecha" | "delante-izquierda" | "detras-izquierda" | "detras-derecha";

/** Turns the cube about the vertical axis so the chosen corner faces the viewer like the front-right one. */
const TURN: Record<CornerView, (p: Vec3) => Vec3> = {
  "delante-derecha": (p) => p,
  "delante-izquierda": ([x, y, z]) => [z, y, -x],
  "detras-izquierda": ([x, y, z]) => [-x, y, -z],
  "detras-derecha": ([x, y, z]) => [-z, y, x],
};

/** Front-right-top view: x right, y up, z towards the viewer's left. */
const project = ([x, y, z]: Vec3): [number, number] => [100 + (x - z) * 0.866 * 30, 104 + (x + z) * 0.5 * 30 - y * 30];

/**
 * The cube from one of its top corners. Stickers in `shown` get their
 * color, the others are grey, so the diagram points at the pieces that
 * matter.
 */
export function cornerViewSvg3(
  facelets: readonly CubeColor[],
  shown: ReadonlySet<number>,
  view: CornerView,
  title: string,
): string {
  const turn = TURN[view];
  const polygons: string[] = [];
  FACELET_GEOMETRY.forEach(([position, normal], index) => {
    const n = turn(normal);
    if (n[0] < 1 && n[1] < 1 && n[2] < 1) return; // faces away from the viewer
    const p = turn(position);
    const axis = n.findIndex((c) => c !== 0);
    const tangents = [0, 1, 2].filter((a) => a !== axis);
    // The cube spans -1.5..1.5: a sticker's center is its piece's position, pushed out to the face.
    const center = p.map((c, a) => (a === axis ? c * 1.5 : c)) as number[];
    const corner = (s: number, t: number): Vec3 => {
      const point = [...center];
      point[tangents[0]] += s * 0.45;
      point[tangents[1]] += t * 0.45;
      return point as unknown as Vec3;
    };
    const points = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)]
      .map(project)
      .map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`)
      .join(" ");
    const fill = shown.has(index) ? SHEET_HEX[facelets[index]] : GREY;
    polygons.push(`<polygon points="${points}" fill="${fill}" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`);
  });
  const outline = [
    [-1.5, 1.5, -1.5],
    [1.5, 1.5, -1.5],
    [1.5, 1.5, 1.5],
    [1.5, -1.5, 1.5],
    [-1.5, -1.5, 1.5],
    [-1.5, 1.5, 1.5],
  ]
    .map((p) => project(p as unknown as Vec3).map((c) => c.toFixed(1)).join(","))
    .join(" ");
  return svg(
    `<polygon points="${outline}" fill="#1a1a1a" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>\n${polygons.join("\n")}`,
    title,
  );
}

/** Where each face goes in the unfolded cube (in faces) and how its stickers turn to fold flat. */
const NET: Record<"U" | "R" | "F" | "D" | "L" | "B", { col: number; row: number; at: (r: number, c: number) => [number, number] }> = {
  B: { col: 1, row: 0, at: (r, c) => [2 - r, 2 - c] },
  L: { col: 0, row: 1, at: (r, c) => [c, 2 - r] },
  U: { col: 1, row: 1, at: (r, c) => [r, c] },
  R: { col: 2, row: 1, at: (r, c) => [2 - c, r] },
  F: { col: 1, row: 2, at: (r, c) => [r, c] },
  D: { col: 1, row: 3, at: (r, c) => [r, c] },
};

/**
 * The whole cube unfolded around the top face, front at the bottom: the
 * back above (upside down, as if folded back over the top), left and
 * right beside the top, then the front and the bottom. For the last six
 * edges of Roux, which live on the middle layer from the back to the
 * bottom: every one of them shows. Stickers not in `shown` are grey.
 */
export function netSvg3(facelets: readonly CubeColor[], shown: ReadonlySet<number>, title: string): string {
  const cell = 15;
  const face = cell * 3 + 3;
  const left = (200 - face * 3) / 2;
  const top = (200 - face * 4) / 2;
  const parts: string[] = [];
  for (const [name, { col, row, at }] of Object.entries(NET)) {
    for (let n = 0; n < 9; n++) {
      const [r, c] = at(Math.floor(n / 3), n % 3);
      const index = sticker3(name as keyof typeof NET, n);
      const fill = shown.has(index) ? SHEET_HEX[facelets[index]] : GREY;
      parts.push(rect(left + col * face + c * cell, top + row * face + r * cell, cell, cell, fill, 2));
    }
  }
  return svg(parts.join("\n"), title);
}
