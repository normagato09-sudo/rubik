/** Whether an option can currently be selected in the trainer UI. */
export type AvailabilityStatus = "active" | "coming-soon";

export interface TrainerOption {
  id: string;
  label: string;
  status: AvailabilityStatus;
}

/**
 * A solving method, scoped to one cube type (`cubeType`, matching an id
 * from `cubes.ts`). Never treated as available for every cube — e.g.
 * CFOP only ever appears for `cubeType: "3x3"`.
 */
export interface MethodOption extends TrainerOption {
  cubeType: string;
}
