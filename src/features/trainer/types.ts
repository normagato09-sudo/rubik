/** Whether an option can currently be selected in the trainer UI. */
export type AvailabilityStatus = "active" | "coming-soon";

export interface TrainerOption {
  id: string;
  label: string;
  status: AvailabilityStatus;
}
