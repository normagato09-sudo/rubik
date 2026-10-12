/**
 * Diagrams for the 4×4 cases, drawn from the case itself (the 96 stickers
 * of cube4.ts, read from the engine), so a drawing can never disagree
 * with its algorithm. Same look as the 3×3 ones (diagrams-3x3.ts): the
 * sheets' flat colors, and grey for the stickers that do not matter.
 *
 * - `cornerViewSvg4`: the cube seen from one of its top corners (the top
 *   face and two sides), for the centers and the cross.
 * - `frontViewSvg4`: the front face with the rows and columns of the four
 *   faces around it, for pairing edges: both stickers of every edge piece
 *   of the front show.
 * - `topViewSvg4`: the top face with the top row of each side around it,
 *   for the parities, OLL and PLL (with the sheets' arrows).
 * - `moveSvg4`: a move and its inverse, for the notation.
 */
import type { CubeColor, Vec3 } from "@/features/cube/types";
import { SHEET_HEX } from "./diagrams-2x2";
import { STICKERS_4, sticker4, type Face4 } from "./cube4";

const GREY = "#9a9a9a";
const LINE = "#262626";

const rect = (x: number, y: number, w: number, h: number, fill: string, r: number) =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r}" fill="${fill}" stroke="${LINE}" stroke-width="1.5"/>`;

const svg = (body: string, title: string, width = 200, height = 200) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${title}">\n<title>${title}</title>\n${body}\n</svg>\n`;

const filler = (colors: readonly CubeColor[], shown?: ReadonlySet<number>) => (index: number) =>
  !shown || shown.has(index) ? SHEET_HEX[colors[index]] : GREY;

/** Which top corner the cube is seen from: the two sides that show besides the top. */
export type CornerView4 = "delante-derecha" | "delante-izquierda" | "detras-derecha";

/** Turns the cube about the vertical axis so the chosen corner faces the viewer like the front-right one. */
const TURN: Record<CornerView4, (p: Vec3) => Vec3> = {
  "delante-derecha": (p) => p,
  "delante-izquierda": ([x, y, z]) => [z, y, -x],
  "detras-derecha": ([x, y, z]) => [-z, y, x],
};

/** The cube spans -4..4 (each piece is 2 wide): front-right-top view, x right, y up, z towards the viewer's left. */
const SCALE = 11.25;
const project = ([x, y, z]: Vec3, dx = 0): [number, number] => [
  100 + dx + (x - z) * 0.866 * SCALE,
  104 + (x + z) * 0.5 * SCALE - y * SCALE,
];

function cornerView(colors: readonly CubeColor[], shown: ReadonlySet<number> | undefined, view: CornerView4, dx = 0): string {
  const turn = TURN[view];
  const fill = filler(colors, shown);
  const polygons: string[] = [];
  STICKERS_4.forEach(({ position, normal }, index) => {
    const n = turn(normal);
    if (n[0] < 1 && n[1] < 1 && n[2] < 1) return; // faces away from the viewer
    const p = turn(position);
    const axis = n.findIndex((c) => c !== 0);
    const tangents = [0, 1, 2].filter((a) => a !== axis);
    const center = p.map((c, a) => (a === axis ? (c / 3) * 4 : c));
    const corner = (s: number, t: number): Vec3 => {
      const point = [...center];
      point[tangents[0]] += s * 0.9;
      point[tangents[1]] += t * 0.9;
      return point as unknown as Vec3;
    };
    const points = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)]
      .map((point) => project(point, dx))
      .map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`)
      .join(" ");
    polygons.push(`<polygon points="${points}" fill="${fill(index)}" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>`);
  });
  const outline = [
    [-4, 4, -4],
    [4, 4, -4],
    [4, 4, 4],
    [4, -4, 4],
    [-4, -4, 4],
    [-4, 4, 4],
  ]
    .map((p) => project(p as unknown as Vec3, dx).map((c) => c.toFixed(1)).join(","))
    .join(" ");
  return `<polygon points="${outline}" fill="#1a1a1a" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>\n${polygons.join("\n")}`;
}

/** The cube from one of its top corners; stickers not in `shown` are grey. */
export const cornerViewSvg4 = (colors: readonly CubeColor[], shown: ReadonlySet<number>, view: CornerView4, title: string) =>
  svg(cornerView(colors, shown, view), title);

/**
 * The front face (4×4) with, around it, the bottom row of the top face,
 * the top row of the bottom one and the nearest column of each side: the
 * two stickers of every edge piece of the front, as if the cube were
 * opened out around it.
 */
export function frontViewSvg4(colors: readonly CubeColor[], shown: ReadonlySet<number>, title: string): string {
  const fill = filler(colors, shown);
  const cell = 30;
  const origin = 40;
  const parts: string[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) parts.push(rect(origin + col * cell, origin + row * cell, cell - 2, cell - 2, fill(sticker4("F", row, col)), 4));
  }
  for (let k = 0; k < 4; k++) {
    parts.push(rect(origin + k * cell + 2, 14, cell - 6, 20, fill(sticker4("U", 3, k)), 3));
    parts.push(rect(origin + k * cell + 2, origin + 4 * cell + 4, cell - 6, 20, fill(sticker4("D", 0, k)), 3));
    parts.push(rect(14, origin + k * cell + 2, 20, cell - 6, fill(sticker4("L", k, 3)), 3));
    parts.push(rect(origin + 4 * cell + 4, origin + k * cell + 2, 20, cell - 6, fill(sticker4("R", k, 0)), 3));
  }
  return svg(parts.join("\n"), title);
}

/** An arrow over the top view, between two places given as [row, column] of the 4×4 top (0–3); `both`: a head at each end. */
export interface Arrow4 {
  from: [number, number];
  to: [number, number];
  both?: boolean;
}

function arrowSvg({ from, to, both }: Arrow4): string {
  const at = ([row, col]: [number, number]) => [40 + col * 30 + 14, 40 + row * 30 + 14];
  const [x1, y1] = at(from);
  const [x2, y2] = at(to);
  const length = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / length, (y2 - y1) / length];
  // Start and end a little inside the stickers, so a head does not cover the next one.
  const [ax, ay, bx, by] = [x1 + ux * 6, y1 + uy * 6, x2 - ux * 6, y2 - uy * 6];
  const head = (x: number, y: number, dx: number, dy: number) =>
    `<polygon points="${x.toFixed(1)},${y.toFixed(1)} ${(x - dx * 11 - dy * 6).toFixed(1)},${(y - dy * 11 + dx * 6).toFixed(1)} ${(x - dx * 11 + dy * 6).toFixed(1)},${(y - dy * 11 - dx * 6).toFixed(1)}" fill="${LINE}"/>`;
  const start = both ? [ax + ux * 9, ay + uy * 9] : [ax, ay];
  return [
    `<line x1="${start[0].toFixed(1)}" y1="${start[1].toFixed(1)}" x2="${(bx - ux * 9).toFixed(1)}" y2="${(by - uy * 9).toFixed(1)}" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>`,
    head(bx, by, ux, uy),
    ...(both ? [head(ax, ay, -ux, -uy)] : []),
  ].join("\n");
}

/** Seen from above with the front at the bottom: the 16 top stickers and the top row of each side around them. */
export function topViewSvg4(
  colors: readonly CubeColor[],
  title: string,
  shown?: ReadonlySet<number>,
  arrows: readonly Arrow4[] = [],
): string {
  const fill = filler(colors, shown);
  const cell = 30;
  const origin = 40;
  const parts: string[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) parts.push(rect(origin + col * cell, origin + row * cell, cell - 2, cell - 2, fill(sticker4("U", row, col)), 4));
  }
  for (let k = 0; k < 4; k++) {
    // From above, the back row reads right to left and the right side front to back.
    parts.push(rect(origin + k * cell + 2, 14, cell - 6, 20, fill(sticker4("B", 0, 3 - k)), 3));
    parts.push(rect(origin + k * cell + 2, origin + 4 * cell + 4, cell - 6, 20, fill(sticker4("F", 0, k)), 3));
    parts.push(rect(14, origin + k * cell + 2, 20, cell - 6, fill(sticker4("L", 0, k)), 3));
    parts.push(rect(origin + 4 * cell + 4, origin + k * cell + 2, 20, cell - 6, fill(sticker4("R", 0, 3 - k)), 3));
  }
  parts.push(...arrows.map(arrowSvg));
  return svg(parts.join("\n"), title);
}

const VIEW_OF: Record<Face4, CornerView4> = {
  U: "delante-derecha",
  R: "delante-derecha",
  F: "delante-derecha",
  D: "delante-derecha",
  L: "delante-izquierda",
  B: "detras-derecha",
};

/**
 * A move and its inverse, side by side: the solved cube after each one,
 * seen from the corner where the turning layers show best (L from the
 * front left, B from the back). In color, the layers that turn.
 */
export function moveSvg4(
  turned: { label: string; colors: readonly CubeColor[] }[],
  moving: ReadonlySet<number>,
  face: Face4,
  title: string,
): string {
  const parts = turned.map(({ label, colors }, k) => {
    const dx = k * 200;
    return `${cornerView(colors, moving, VIEW_OF[face], dx)}\n<text x="${100 + dx}" y="196" text-anchor="middle" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="#ffffff">${label}</text>`;
  });
  return svg(parts.join("\n"), title, 400, 205);
}
