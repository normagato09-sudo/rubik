import type { CubeColor } from "./types";

/** Classic WCA-style color scheme: white/yellow, green/blue, red/orange. */
export const CUBE_COLOR_HEX: Record<CubeColor, string> = {
  white: "#f4f4f4",
  yellow: "#ffd500",
  red: "#e8402c",
  orange: "#ff8c1a",
  blue: "#1054d6",
  green: "#009b48",
};

/** Body color of the plastic showing where a piece has no sticker. */
export const CUBE_PLASTIC_HEX = "#101014";
