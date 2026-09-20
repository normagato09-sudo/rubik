import { create } from "zustand";
import { addEntry, clearHistory, updateEntryPenalty } from "@/features/history/engine";
import type { HistoryEntry } from "@/features/history/types";
import type { Penalty } from "@/features/timer/types";

interface HistoryStore {
  entries: HistoryEntry[];
  /** Records a finished solve as a new entry. */
  record: (entry: HistoryEntry) => void;
  /** Updates an existing entry's penalty in place (never adds a new one). */
  updatePenalty: (id: string, penalty: Penalty) => void;
  /** Clears every entry. Never touches the cube, timer or inspection state. */
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],
  record: (entry) => set({ entries: addEntry(get().entries, entry) }),
  updatePenalty: (id, penalty) => set({ entries: updateEntryPenalty(get().entries, id, penalty) }),
  clear: () => set({ entries: clearHistory() }),
}));
