/**
 * Diagrams for the 2×2 cases the method sheets do not have, drawn from the
 * case itself (the 24 stickers the 3D engine gives after undoing the
 * algorithm), so a drawing can never disagree with its algorithm. Same
 * look as the sheets: yellow on top, flat saturated colors.
 *
 * - `topViewSvg`: seen from above, like the CLL sheet — the 4 top stickers
 *   and the top row of each side as bars around them.
 * - `cornerViewSvg`: the cube seen from the front-right corner (top, front
 *   and right faces), for the first-layer cases: only the stickers that
 *   matter are colored, the rest are grey.
 * - `layersViewSvg`: the same from above, with both rows of each side, for
 *   the methods that solve the bottom layer at the end too (EG, LEG, TCLL).
 * - `notationBSvg`: B and B' in the style of the 2×2 notation sheet (which
 *   has U, D, R, L and F but not B).
 */
import type { CubeColor, Vec3 } from "@/features/cube/types";
import { FACELET_GEOMETRY_2, faceOffset2 } from "@/features/solver2x2/facelets";

/** The sheets' colors (sampled from their diagrams). */
export const SHEET_HEX: Record<CubeColor, string> = {
  white: "#ffffff",
  yellow: "#ffff02",
  red: "#ff0000",
  orange: "#ff7f01",
  blue: "#0000fd",
  green: "#00ff02",
};

const GREY = "#9a9a9a";
const LINE = "#262626";

const at = (face: "U" | "R" | "F" | "L" | "B", n: number) => faceOffset2(face) + n;

const rect = (x: number, y: number, w: number, h: number, fill: string, r: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${LINE}" stroke-width="1.5"/>`;

const svg = (width: number, height: number, body: string, title: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${title}">\n<title>${title}</title>\n${body}\n</svg>\n`;

/**
 * Seen from above with the front at the bottom: top stickers back row then
 * front row, and bars for the back (left, right), front (left, right),
 * left (back, front) and right (back, front) sides — the CLL sheet's layout.
 */
export function topViewSvg(facelets: readonly CubeColor[], title: string): string {
  const hex = (index: number) => SHEET_HEX[facelets[index]];
  const cells = [35, 101];
  const parts = [
    ...[0, 1, 2, 3].map((n) => rect(cells[n % 2], cells[n >> 1], 63, 63, hex(at("U", n)), 8)),
    rect(cells[0] + 3, 13, 57, 17, hex(at("B", 1)), 3),
    rect(cells[1] + 3, 13, 57, 17, hex(at("B", 0)), 3),
    rect(cells[0] + 3, 169, 57, 17, hex(at("F", 0)), 3),
    rect(cells[1] + 3, 169, 57, 17, hex(at("F", 1)), 3),
    rect(13, cells[0] + 3, 17, 57, hex(at("L", 0)), 3),
    rect(13, cells[1] + 3, 17, 57, hex(at("L", 1)), 3),
    rect(169, cells[0] + 3, 17, 57, hex(at("R", 1)), 3),
    rect(169, cells[1] + 3, 17, 57, hex(at("R", 0)), 3),
  ];
  return svg(200, 200, parts.join("\n"), title);
}

/**
 * Like `topViewSvg`, but each side shows both its rows: the inner bar is
 * the top row and the outer bar the bottom row, so the bottom layer shows
 * too — for EG, LEG and TCLL, where the bottom is not solved yet.
 */
export function layersViewSvg(facelets: readonly CubeColor[], title: string): string {
  const hex = (index: number) => SHEET_HEX[facelets[index]];
  const cells = [47, 101];
  const size = 52;
  const parts = [0, 1, 2, 3].map((n) => rect(cells[n % 2], cells[n >> 1], size, size, hex(at("U", n)), 7));
  // Each side, seen from above: [inner (top row), outer (bottom row)], each listed left to right or back to front.
  const sides = [
    { inner: [at("B", 1), at("B", 0)], outer: [at("B", 3), at("B", 2)], bar: (k: number, i: number) => [cells[i] + 3, k === 0 ? 30 : 13, size - 6, 14] },
    { inner: [at("F", 0), at("F", 1)], outer: [at("F", 2), at("F", 3)], bar: (k: number, i: number) => [cells[i] + 3, k === 0 ? 156 : 173, size - 6, 14] },
    { inner: [at("L", 0), at("L", 1)], outer: [at("L", 2), at("L", 3)], bar: (k: number, i: number) => [k === 0 ? 30 : 13, cells[i] + 3, 14, size - 6] },
    { inner: [at("R", 1), at("R", 0)], outer: [at("R", 3), at("R", 2)], bar: (k: number, i: number) => [k === 0 ? 156 : 173, cells[i] + 3, 14, size - 6] },
  ];
  for (const { inner, outer, bar } of sides) {
    [inner, outer].forEach((row, k) => row.forEach((index, i) => {
      const [x, y, w, h] = bar(k, i);
      parts.push(rect(x, y, w, h, hex(index), 3));
    }));
  }
  return svg(200, 200, parts.join("\n"), title);
}

/** Front-right-top view: x right, y up, z towards the viewer's left. */
const project = ([x, y, z]: Vec3): [number, number] => [
  100 + (x - z) * 0.866 * 44,
  104 + (x + z) * 0.5 * 44 - y * 44,
];

const VISIBLE_FACES = ["U", "F", "R"] as const;

/**
 * The cube from its front-right-top corner. Stickers in `shown` get their
 * color, the others are grey, so the diagram points at the pieces that
 * matter.
 */
export function cornerViewSvg(facelets: readonly CubeColor[], shown: ReadonlySet<number>, title: string): string {
  const polygons: string[] = [];
  for (const face of VISIBLE_FACES) {
    for (let n = 0; n < 4; n++) {
      const index = faceOffset2(face) + n;
      const [position, normal] = FACELET_GEOMETRY_2[index];
      const axis = normal.findIndex((c) => c !== 0);
      const tangents = [0, 1, 2].filter((a) => a !== axis);
      const center = position.map((c, a) => (a === axis ? c : c * 0.5)) as number[];
      const corner = (s: number, t: number): Vec3 => {
        const point = [...center];
        point[tangents[0]] += s * 0.44;
        point[tangents[1]] += t * 0.44;
        return point as unknown as Vec3;
      };
      const points = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)]
        .map(project)
        .map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`)
        .join(" ");
      const fill = shown.has(index) ? SHEET_HEX[facelets[index]] : GREY;
      polygons.push(`<polygon points="${points}" fill="${fill}" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`);
    }
  }
  const outline = [
    [-1, 1, -1],
    [1, 1, -1],
    [1, 1, 1],
    [1, -1, 1],
    [-1, -1, 1],
    [-1, 1, 1],
  ]
    .map((p) => project(p as unknown as Vec3).map((c) => c.toFixed(1)).join(","))
    .join(" ");
  return svg(
    200,
    200,
    `<polygon points="${outline}" fill="#1a1a1a" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>\n${polygons.join("\n")}`,
    title,
  );
}

/** A round arrow like the notation sheet's F: ~250° of arc with a triangular head. */
function roundArrow(cx: number, cy: number, clockwise: boolean): string {
  const r = 31;
  const deg = Math.PI / 180;
  // Screen angles (y down): like the sheet, the tail sits just off the bottom
  // and the head just below the middle of the far side, ~280° of arc.
  const [from, to] = clockwise ? [105, 385] : [75, -205];
  const point = (a: number) => [cx + r * Math.cos(a * deg), cy + r * Math.sin(a * deg)];
  const [x0, y0] = point(from);
  const [x1, y1] = point(to);
  const sign = clockwise ? 1 : -1;
  const tangent = [-Math.sin(to * deg) * sign, Math.cos(to * deg) * sign];
  const normal = [Math.cos(to * deg), Math.sin(to * deg)];
  const head = [
    [x1 + tangent[0] * 14, y1 + tangent[1] * 14],
    [x1 + normal[0] * 10, y1 + normal[1] * 10],
    [x1 - normal[0] * 10, y1 - normal[1] * 10],
  ];
  const f = (n: number) => n.toFixed(1);
  return [
    `<path d="M ${f(x0)} ${f(y0)} A ${r} ${r} 0 1 ${clockwise ? 1 : 0} ${f(x1)} ${f(y1)}" fill="none" stroke="#111" stroke-width="6"/>`,
    `<polygon points="${head.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" fill="#111"/>`,
  ].join("\n");
}

/**
 * B and B' in the style of the 2×2 notation sheet, which draws F and F'
 * as the turning layer in white, tilted, over the rest of the cube in
 * grey, with a round arrow. B is the back layer, so here the tilted white
 * square is behind the grey front and shows at its corners. Seen from the
 * front, B turns the other way than F, so B has the arrow of F' and B'
 * the arrow of F.
 * Labels are white, like the sheet's once recolored for the dark app.
 */
export function notationBSvg(): string {
  const panel = (cx: number, label: string, clockwise: boolean) => {
    const cy = 91;
    const half = 39;
    const square = (fill: string) =>
      `<rect x="${cx - half}" y="${cy - half}" width="${half * 2}" height="${half * 2}" fill="${fill}" stroke="#262626" stroke-width="2"/>`;
    return [
      `<text x="${cx}" y="29" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" fill="#ffffff">${label}</text>`,
      `<g transform="rotate(${clockwise ? 12 : -12} ${cx} ${cy})">${square("#ffffff")}</g>`,
      square("#a0a0a0"),
      `<line x1="${cx}" y1="${cy - half}" x2="${cx}" y2="${cy + half}" stroke="#262626" stroke-width="1.5"/>`,
      `<line x1="${cx - half}" y1="${cy}" x2="${cx + half}" y2="${cy}" stroke="#262626" stroke-width="1.5"/>`,
      roundArrow(cx, cy, clockwise),
    ].join("\n");
  };
  return svg(200, 137, [panel(45, "B", false), panel(155, "B’", true)].join("\n"), "Giros B y B'");
}
