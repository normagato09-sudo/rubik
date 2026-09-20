import { create } from "zustand";
import { resetTimer, startTimer, stopTimer } from "@/features/timer/engine";
import { applyPlus2 as applyPlus2Transition } from "@/features/timer/penalty";
import { INITIAL_TIMER_STATE } from "@/features/timer/types";
import type { TimerState } from "@/features/timer/types";
import { useInspectionStore } from "./inspectionStore";

interface TimerStore extends TimerState {
  start: () => void;
  stop: () => void;
  reset: () => void;
  /** Applies +2 to the just-finished solve. See the guard comment below. */
  applyPlus2: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  ...INITIAL_TIMER_STATE,
  start: () => set(startTimer(get(), performance.now())),
  stop: () => set(stopTimer(get(), performance.now())),
  reset: () => set(resetTimer()),
  applyPlus2: () => {
    // The pure transition only knows about the timer's own state
    // (stopped + not already penalized). Whether a *new* inspection is
    // running is a cross-store fact, checked here at the boundary
    // between the two stores rather than inside the pure engine.
    if (useInspectionStore.getState().status === "running") return;
    set(applyPlus2Transition(get()));
  },
}));
