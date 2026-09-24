import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

/**
 * Which Aprender items the user has marked as learned, e.g. "f2l-07" or "notation-r".
 * Its own localStorage key — never mixed with solves, History or
 * TrainingAttempts.
 */
export interface LearningProgressStore {
  learned: Record<string, true>;
  isLearned: (itemId: string) => boolean;
  toggleLearned: (itemId: string) => void;
}

export const LEARNING_PROGRESS_STORAGE_KEY = "rubiko-learning-progress";

/** "f2l-07", "oll-12", "pll-08"... — F2L ids predate OLL/PLL and keep this shape. */
export function caseItemId(setId: string, caseId: string): string {
  return `${setId}-${caseId}`;
}

export function notationItemId(notationId: string): string {
  return `notation-${notationId}`;
}

export function countLearned(learned: Record<string, true>, itemIds: string[]): number {
  return itemIds.filter((id) => learned[id]).length;
}

export function createLearningProgressStore(storage?: () => StateStorage) {
  return create<LearningProgressStore>()(
    persist(
      (set, get) => ({
        learned: {},
        isLearned: (itemId) => get().learned[itemId] === true,
        toggleLearned: (itemId) => {
          const learned = { ...get().learned };
          if (learned[itemId]) delete learned[itemId];
          else learned[itemId] = true;
          set({ learned });
        },
      }),
      {
        name: LEARNING_PROGRESS_STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(storage ?? (() => localStorage)),
        partialize: (state) => ({ learned: state.learned }),
        // Server HTML and the first client render both start empty; the
        // saved progress is loaded after mount (see useLearningProgressHydration)
        // so React never sees a hydration mismatch.
        skipHydration: true,
      },
    ),
  );
}

export const useLearningProgress = createLearningProgressStore();
