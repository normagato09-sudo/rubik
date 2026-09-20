/**
 * Id of a cube type the app can support (matches the catalog ids in
 * `features/trainer/cubes.ts`, e.g. "3x3", "2x2"). Kept as a plain string
 * here so this module never needs to import the trainer catalog just to
 * name a type.
 */
export type CubeTypeId = string;

/**
 * A physical cube the user trains with. Every solve and every training
 * attempt is scoped to exactly one `Cube` via its `id` — this is the
 * entity `Solve.cubeId` and `TrainingAttempt.cubeId` point at.
 */
export interface Cube {
  id: string;
  type: CubeTypeId;
  name: string;
  createdAt: number;
}
