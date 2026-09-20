import type { StickerFace } from "../types";

/**
 * Position direction and rotation needed to place a flat plane (which
 * defaults to facing +z) against each local face of a cubie.
 */
export const STICKER_TRANSFORM: Record<
  StickerFace,
  { direction: [number, number, number]; rotation: [number, number, number] }
> = {
  "+x": { direction: [1, 0, 0], rotation: [0, Math.PI / 2, 0] },
  "-x": { direction: [-1, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  "+y": { direction: [0, 1, 0], rotation: [-Math.PI / 2, 0, 0] },
  "-y": { direction: [0, -1, 0], rotation: [Math.PI / 2, 0, 0] },
  "+z": { direction: [0, 0, 1], rotation: [0, 0, 0] },
  "-z": { direction: [0, 0, -1], rotation: [0, Math.PI, 0] },
};
