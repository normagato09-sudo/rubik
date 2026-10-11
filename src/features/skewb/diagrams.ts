/**
 * Diagrams of the Skewb cases, drawn by RUBIKO from the case itself (the
 * stickers the engine gives), so a drawing can never disagree with its
 * algorithm. The Skewb is unfolded around one face: that face in the
 * middle and the four sides around it, each folded out flat. The picture
 * is turned 45° so the corner you look at when holding it the way of the
 * guides (F in Sarah's notation) points down, towards you.
 *
 * - `topNetSvg`: the top face (yellow once solved) and the sides, for
 *   everything after the first side.
 * - `bottomNetSvg`: the bottom face seen from below and the sides, for the
 *   first side.
 *
 * Same look as the other diagrams of Aprender: flat colors on white, grey
 * where the stickers do not matter.
 */
import type { CubeColor } from "@/features/cube/types";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import { SKEWB_FACES, type SkewbFace } from "./geometry";

type Vec2 = readonly [number, number];

const GREY = "#a6a6a6";
const LINE = "#303030";
const WHITE_STICKER = "#ffffff";

/** Where each face goes in the net (its top-left corner, faces 1×1) and which way its right and up point there. */
type Net = Partial<Record<SkewbFace, { at: Vec2; right: Vec2; up: Vec2 }>>;

/** Top face in the middle, seen from above with the back at the top; each side's top edge against it. */
const TOP_NET: Net = {
  U: { at: [0, 0], right: [1, 0], up: [0, -1] },
  F: { at: [0, 1], right: [1, 0], up: [0, -1] },
  R: { at: [1, 0], right: [0, -1], up: [-1, 0] },
  B: { at: [0, -1], right: [-1, 0], up: [0, 1] },
  L: { at: [-1, 0], right: [0, 1], up: [1, 0] },
};

/** Bottom face in the middle, seen from below with the front at the top; each side's bottom edge against it. */
const BOTTOM_NET: Net = {
  D: { at: [0, 0], right: [1, 0], up: [0, -1] },
  F: { at: [0, -1], right: [1, 0], up: [0, -1] },
  R: { at: [1, 0], right: [0, 1], up: [1, 0] },
  B: { at: [0, 1], right: [-1, 0], up: [0, 1] },
  L: { at: [-1, 0], right: [0, -1], up: [-1, 0] },
};

/** Corner triangles 1–4 (up-left, up-right, down-right, down-left) and the center, as [right, up] in -1…1. */
const STICKER_SHAPES: [number, number][][] = [
  [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ],
  ...[
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ].map(([r, u]) => [
    [r, u],
    [r, 0],
    [0, u],
  ] as [number, number][]),
];

const f = (n: number) => n.toFixed(1);

/** The net's stickers as SVG polygons, in a 200×200 box. */
function netPolygons(net: Net, corner: Vec2, state: readonly CubeColor[], shown: ReadonlySet<number>): string[] {
  // Turn the net so `corner` (a corner of the middle face, from its center) points straight down.
  const angle = Math.PI / 2 - Math.atan2(corner[1], corner[0]);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const SIZE = 200;
  const FACE = 64;
  const place = ([x, y]: Vec2): Vec2 => {
    const dx = x - 0.5;
    const dy = y - 0.5;
    return [SIZE / 2 + FACE * (dx * cos - dy * sin), SIZE / 2 + FACE * (dx * sin + dy * cos)];
  };
  const polygons: string[] = [];
  for (const face of SKEWB_FACES) {
    const frame = net[face];
    if (!frame) continue;
    const f0 = SKEWB_FACES.indexOf(face) * 5;
    const middle: Vec2 = [frame.at[0] + 0.5, frame.at[1] + 0.5];
    STICKER_SHAPES.forEach((shape, n) => {
      const index = f0 + n;
      const color = state[index];
      const fill = shown.has(index) ? (color === "white" ? WHITE_STICKER : CUBE_COLOR_HEX[color]) : GREY;
      const points = shape
        .map(([r, u]) =>
          place([middle[0] + (r * frame.right[0] + u * frame.up[0]) / 2, middle[1] + (r * frame.right[1] + u * frame.up[1]) / 2]),
        )
        .map(([x, y]) => `${f(x)},${f(y)}`)
        .join(" ");
      polygons.push(`<polygon points="${points}" fill="${fill}" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/>`);
    });
  }
  return polygons;
}

function netSvg(net: Net, corner: Vec2, state: readonly CubeColor[], shown: ReadonlySet<number>, title: string): string {
  const polygons = netPolygons(net, corner, state, shown);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${title}">\n<title>${title}</title>\n<rect width="200" height="200" fill="#ffffff"/>\n${polygons.join("\n")}\n</svg>\n`;
}

/** The top face and the sides: the corner between the front-left and front-right faces at the bottom. */
export const topNetSvg = (state: readonly CubeColor[], shown: ReadonlySet<number>, title: string) =>
  netSvg(TOP_NET, [0.5, 0.5], state, shown, title);

/** The bottom face from below and the sides: the same front corner, now at the bottom face, at the bottom. */
export const bottomNetSvg = (state: readonly CubeColor[], shown: ReadonlySet<number>, title: string) =>
  netSvg(BOTTOM_NET, [0.5, -0.5], state, shown, title);

/**
 * A move of the notation: the top face and the sides after the move and
 * after its inverse, side by side, each with its name under it. Stickers
 * not in `shown` are grey (the half that does not turn).
 */
export function moveSvg(turned: { label: string; state: readonly CubeColor[] }[], shown: ReadonlySet<number>, title: string): string {
  const width = 200 * turned.length;
  const parts = turned.map(({ label, state }, k) => {
    const polygons = netPolygons(TOP_NET, [0.5, 0.5], state, shown);
    return `<g transform="translate(${k * 200} 0)">\n${polygons.join("\n")}\n<text x="100" y="222" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${LINE}">${label}</text>\n</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 236" width="${width}" height="236" role="img" aria-label="${title}">\n<title>${title}</title>\n<rect width="${width}" height="236" fill="#ffffff"/>\n${parts.join("\n")}\n</svg>\n`;
}
