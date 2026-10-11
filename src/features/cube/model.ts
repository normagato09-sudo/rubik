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
 * The coordinates of the layers of a cube, from the -x (or -y, -z) side:
 * consecutive integers around 0 on odd cubes, odd integers on even ones
 * (2×2: -1, 1; 3×3: -1, 0, 1; 4×4: -3, -1, 1, 3; 5×5: -2 … 2).
 */
export function layerCoords(size: CubeSize): number[] {
  return Array.from({ length: size }, (_, k) => (size % 2 === 0 ? 2 * k - (size - 1) : k - (size - 1) / 2));
}

/** The outermost coordinate: where the faces are. */
export const outerCoord = (size: CubeSize) => layerCoords(size)[size - 1];

/**
 * Builds the visible pieces of a fully solved cube: 8 corners for a 2×2,
 * 26 for a 3×3 (no center core), 56 for a 4×4 and 98 for a 5×5 (the inner
 * pieces are hidden, so they are left out).
 */
export function createSolvedCube(size: CubeSize = 3): CubeState {
  const cubies: Cubie[] = [];
  const coords = layerCoords(size);
  const outer = outerCoord(size);

  for (const x of coords) {
    for (const y of coords) {
      for (const z of coords) {
        if (![x, y, z].some((c) => Math.abs(c) === outer)) continue; // inside: never seen

        const position: Vec3 = [x, y, z];
        cubies.push({
          id: `${x},${y},${z}`,
          position,
          orientation: IDENTITY_ORIENTATION,
          stickers: position
            .map((coord, axis) => {
              if (Math.abs(coord) !== outer) return null;
              const face = AXIS_TO_FACES[axis as 0 | 1 | 2][coord > 0 ? 1 : 0];
              return { face, color: SOLVED_FACE_COLOR[face] };
            })
            .filter((sticker): sticker is NonNullable<typeof sticker> => sticker !== null),
        });
      }
    }
  }

  return { cubies };
}
