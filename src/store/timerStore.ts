import { create } from "zustand";
import { resetTimer, startTimer, stopTimer } from "@/features/timer/engine";
import { INITIAL_TIMER_STATE } from "@/features/timer/types";
import type { TimerState } from "@/features/timer/types";

interface TimerStore extends TimerState {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  ...INITIAL_TIMER_STATE,
  start: () => set(startTimer(get(), performance.now())),
  stop: () => set(stopTimer(get(), performance.now())),
  reset: () => set(resetTimer()),
}));
