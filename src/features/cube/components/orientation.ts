import { Matrix4, Quaternion } from "three";
import type { Orientation } from "../types";

/**
 * Converts a cubie's orientation (where its local axes currently point in
 * world space) into a Three.js quaternion, so the 3D layer can rotate the
 * piece's group without the cube model ever depending on Three.js.
 */
export function orientationToQuaternion(orientation: Orientation): Quaternion {
  const [xx, xy, xz] = orientation.x;
  const [yx, yy, yz] = orientation.y;
  const [zx, zy, zz] = orientation.z;

  // Matrix4.set takes rows; our basis vectors are columns of the matrix.
  const matrix = new Matrix4().set(
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    0, 0, 0, 1,
  );

  return new Quaternion().setFromRotationMatrix(matrix);
}
