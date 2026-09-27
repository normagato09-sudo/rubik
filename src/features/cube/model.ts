import { IDENTITY_ORIENTATION } from "./types";
import type { CubeColor, CubeSize, Cubie, CubeState, StickerFace, Vec3 } from "./types";

/** Color shown on each face of the cube when it is fully solved. */
const SOLVED_FACE_COLOR: Record<StickerFace, CubeColor> = {
  "+y": "white", // up
  "-y": "yellow", // down
  "+z": "green", // front
  "-z": "blue", // back
  "+x": "red", // right
  "-x": "orange", // left
};

const AXIS_TO_FACES: Record<0 | 1 | 2, [StickerFace, StickerFace]> = {
  0: ["-x", "+x"],
  1: ["-y", "+y"],
  2: ["-z", "+z"],
};

/**
 * Builds the visible pieces of a fully solved cube: 26 for a 3×3 (no
 * center core), 8 corners for a 2×2. Both use coordinates in {-1, 0, 1};
 * a 2×2 just has no 0 layer, so the move engine turns either one.
 */
export function createSolvedCube(size: CubeSize = 3): CubeState {
  const cubies: Cubie[] = [];
  const coords = size === 3 ? [-1, 0, 1] : [-1, 1];

  for (const x of coords) {
    for (const y of coords) {
      for (const z of coords) {
        if (x === 0 && y === 0 && z === 0) continue; // invisible core

        const position: Vec3 = [x, y, z];
        cubies.push({
          id: `${x},${y},${z}`,
          position,
          orientation: IDENTITY_ORIENTATION,
          stickers: position
            .map((coord, axis) => {
              if (coord === 0) return null;
              const face = AXIS_TO_FACES[axis as 0 | 1 | 2][coord === 1 ? 1 : 0];
              return { face, color: SOLVED_FACE_COLOR[face] };
            })
            .filter((sticker): sticker is NonNullable<typeof sticker> => sticker !== null),
        });
      }
    }
  }

  return { cubies };
}
