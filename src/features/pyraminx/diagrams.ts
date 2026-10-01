/**
 * Diagrams for the Pyraminx cases the method sheets do not have, drawn
 * from the case itself (the stickers the engine gives after undoing the
 * algorithm), so a drawing can never disagree with its algorithm. Same
 * look as the sheets: the Pyraminx seen from above — front face at the
 * bottom, left and right faces up the sides, the top tip where they meet —
 * in flat saturated colors on white.
 */
import { stickerCorners, type Vec2 } from "./geometry";
import type { PyraColor } from "./moves";

/** The sheets' colors (sampled from their diagrams). */
export const SHEET_HEX: Record<PyraColor, string> = {
  green: "#00ff00",
  red: "#ff0000",
  blue: "#0000ff",
  yellow: "#ffff00",
};

const GREY = "#a6a6a6";
const LINE = "#303030";

/**
 * Where the sheets draw the tips in their 200×200 pictures (measured on
 * them): B at the top, L and R at the bottom corners, U inside, a little
 * above the middle — they look down on the Pyraminx slightly from behind.
 */
export const SHEET_VIEW = {
  B: [99.5, 31.5] as Vec2,
  L: [6.5, 168.5] as Vec2,
  R: [192.5, 168.5] as Vec2,
  U: [99, 100] as Vec2,
};

/** Each visible face as [apex, left, right] in the picture (same order as geometry.ts). */
const VISIBLE_FACES: [Vec2, Vec2, Vec2][] = [
  [SHEET_VIEW.U, SHEET_VIEW.L, SHEET_VIEW.R],
  [SHEET_VIEW.U, SHEET_VIEW.B, SHEET_VIEW.L],
  [SHEET_VIEW.U, SHEET_VIEW.R, SHEET_VIEW.B],
];

/** The picture of sticker `index` (0–26: front, left, right faces). */
export const sheetSticker = (index: number): Vec2[] =>
  stickerCorners(...VISIBLE_FACES[Math.floor(index / 9)], index % 9);

const f = (n: number) => n.toFixed(1);

/**
 * The top view of a Pyraminx: stickers in `shown` get their color (after
 * `recolor`, for sheets drawn with other colors in front), the rest are
 * grey, so the diagram points at the pieces that matter.
 */
export function topViewSvg(
  state: readonly PyraColor[],
  shown: ReadonlySet<number>,
  title: string,
  recolor: Partial<Record<PyraColor, PyraColor>> = {},
): string {
  const polygons = Array.from({ length: 27 }, (_, index) => {
    const color = recolor[state[index]] ?? state[index];
    const fill = shown.has(index) ? SHEET_HEX[color] : GREY;
    const points = sheetSticker(index).map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
    return `<polygon points="${points}" fill="${fill}" stroke="${LINE}" stroke-width="0.8" stroke-linejoin="round"/>`;
  });
  const { B, L, R } = SHEET_VIEW;
  const outline = `<polygon points="${[B, L, R].map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" fill="none" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${title}">\n<title>${title}</title>\n<rect width="200" height="200" fill="#ffffff"/>\n${polygons.join("\n")}\n${outline}\n</svg>\n`;
}
