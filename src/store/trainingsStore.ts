import { create } from "zustand";
import { addAttempt, clearAttempts } from "@/features/trainings/engine";
import type { TrainingAttempt } from "@/features/trainings/types";

interface TrainingsStore {
  attempts: TrainingAttempt[];
  /** Records a finished training attempt. Never touches historyStore/solves. */
  record: (attempt: TrainingAttempt) => void;
  clear: () => void;
}

export const useTrainingsStore = create<TrainingsStore>((set, get) => ({
  attempts: [],
  record: (attempt) => set({ attempts: addAttempt(get().attempts, attempt) }),
  clear: () => set({ attempts: clearAttempts() }),
}));
