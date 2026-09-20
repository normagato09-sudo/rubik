import { create } from "zustand";
import {
  INITIAL_INSPECTION_STATE,
  cancelInspection,
  finishInspection,
  startInspection,
  tickInspection,
} from "@/features/timer/inspection";
import type { InspectionState } from "@/features/timer/inspection";

interface InspectionStore extends InspectionState {
  start: () => void;
  cancel: () => void;
  /** Ends the countdown early, e.g. right before starting the solve timer. */
  finishEarly: () => void;
  /** Re-checks the countdown against the clock; call once per animation frame while running. */
  tick: () => void;
}

export const useInspectionStore = create<InspectionStore>((set, get) => ({
  ...INITIAL_INSPECTION_STATE,
  start: () => set(startInspection(get(), performance.now())),
  cancel: () => set(cancelInspection()),
  finishEarly: () => set(finishInspection(get())),
  tick: () => set(tickInspection(get(), performance.now())),
}));
