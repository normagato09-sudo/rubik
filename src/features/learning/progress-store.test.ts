import { describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";
import { F2L_CASES } from "./f2l-cases";
import {
  LEARNING_PROGRESS_STORAGE_KEY,
  countLearned,
  createLearningProgressStore,
  f2lItemId,
} from "./progress-store";

function memoryStorage(): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const F2L_IDS = F2L_CASES.map((f2lCase) => f2lItemId(f2lCase.id));

describe("learning progress", () => {
  it("starts at 0/24 and counts each learned case once", () => {
    const store = createLearningProgressStore(memoryStorage);
    expect(countLearned(store.getState().learned, F2L_IDS)).toBe(0);

    store.getState().toggleLearned(f2lItemId("01"));
    expect(countLearned(store.getState().learned, F2L_IDS)).toBe(1);

    store.getState().toggleLearned(f2lItemId("02"));
    expect(countLearned(store.getState().learned, F2L_IDS)).toBe(2);

    store.getState().toggleLearned(f2lItemId("01"));
    expect(countLearned(store.getState().learned, F2L_IDS)).toBe(1);
    expect(store.getState().isLearned(f2lItemId("02"))).toBe(true);
  });

  it("reaches 24/24 with every case learned", () => {
    const store = createLearningProgressStore(memoryStorage);
    F2L_IDS.forEach((id) => store.getState().toggleLearned(id));
    expect(countLearned(store.getState().learned, F2L_IDS)).toBe(24);
  });

  it("persists across a reload under its own key", async () => {
    const storage = memoryStorage();
    const first = createLearningProgressStore(() => storage);
    first.getState().toggleLearned(f2lItemId("07"));
    expect([...storage.data.keys()]).toEqual([LEARNING_PROGRESS_STORAGE_KEY]);

    const reloaded = createLearningProgressStore(() => storage);
    expect(reloaded.getState().isLearned(f2lItemId("07"))).toBe(false);
    await reloaded.persist.rehydrate();
    expect(reloaded.getState().isLearned(f2lItemId("07"))).toBe(true);
    expect(countLearned(reloaded.getState().learned, F2L_IDS)).toBe(1);
  });
});
