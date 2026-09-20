import { create } from "zustand";
import { startTimer, stopTimer, resetTimer as resetTimerTransition } from "@/features/timer/engine";
import {
  applyPlus2 as applyPlus2Transition,
  canApplyDnf,
  canApplyPlus2,
  markDnf as markDnfTransition,
} from "@/features/timer/penalty";
import { INITIAL_TIMER_STATE } from "@/features/timer/types";
import type { TimerState } from "@/features/timer/types";
import { useCubeStore } from "./cubeStore";
import { useCubesStore } from "./cubesStore";
import { useHistoryStore } from "./historyStore";
import { useInspectionStore } from "./inspectionStore";

interface TimerStore extends TimerState {
  /**
   * History entry id for the solve that was just stopped, if any. Store
   * bookkeeping only — not part of the pure `TimerState` — so that
   * applyPlus2/markDnf can update the *same* history entry instead of
   * creating a new one. Cleared on every new start().
   */
  currentEntryId: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  /** Applies +2 to the just-finished solve. See the guard comment below. */
  applyPlus2: () => void;
  /** Marks the just-finished solve as DNF. Same guard as applyPlus2. */
  markDnf: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  ...INITIAL_TIMER_STATE,
  currentEntryId: null,
  start: () => {
    set({ ...startTimer(get(), performance.now()), currentEntryId: null });
  },
  stop: () => {
    const before = get();
    const after = stopTimer(before, performance.now());
    if (after === before) return; // wasn't running: nothing to record

    // A finished solve is recorded exactly once, right here. Applying
    // +2/DNF afterwards updates this same entry (see below) instead of
    // adding another one, so there is never more than one entry per solve.
    const id = crypto.randomUUID();
    set({ ...after, currentEntryId: id });
    useHistoryStore.getState().record({
      id,
      cubeId: useCubesStore.getState().activeCubeId,
      completedAt: Date.now(),
      baseTimeMs: after.finalTimeMs as number,
      penalty: "none",
      scramble: useCubeStore.getState().scramble ?? [],
    });
  },
  reset: () => set({ ...resetTimerTransition(), currentEntryId: null }),
  applyPlus2: () => {
    // The pure transition only knows about the timer's own state
    // (stopped + not already penalized). Whether a *new* inspection is
    // running is a cross-store fact, checked here at the boundary
    // between the two stores rather than inside the pure engine.
    if (useInspectionStore.getState().status === "running") return;
    const before = get();
    if (!canApplyPlus2(before)) return;
    const after = applyPlus2Transition(before);
    set(after);
    if (before.currentEntryId) {
      useHistoryStore.getState().updatePenalty(before.currentEntryId, after.penalty);
    }
  },
  markDnf: () => {
    if (useInspectionStore.getState().status === "running") return;
    const before = get();
    if (!canApplyDnf(before)) return;
    const after = markDnfTransition(before);
    set(after);
    if (before.currentEntryId) {
      useHistoryStore.getState().updatePenalty(before.currentEntryId, after.penalty);
    }
  },
}));
