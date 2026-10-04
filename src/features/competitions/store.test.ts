import { afterEach, describe, expect, it, vi } from "vitest";
import type { StateStorage } from "zustand/middleware";
import { COMPETITIONS_STORAGE_KEY, createCompetitionsStore, safeLocalStorage, sanitizeCompetitions } from "./store";
import type { CompetitionDraft } from "./types";

function memoryStorage(initial?: string): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(COMPETITIONS_STORAGE_KEY, initial);
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const draft = (overrides: Partial<CompetitionDraft> = {}): CompetitionDraft => ({
  name: "Open de Madrid",
  startDate: "2026-11-14",
  place: "Madrid",
  events: ["333", "222"],
  registered: false,
  notes: "",
  ...overrides,
});

describe("the competitions store", () => {
  it("adds, edits and deletes competitions, and saves them", () => {
    const storage = memoryStorage();
    const store = createCompetitionsStore(() => storage);

    const id = store.getState().add(draft());
    const other = store.getState().add(draft({ name: "Otro", startDate: "2026-12-01" }));
    expect(id).not.toBe(other);
    expect(store.getState().competitions.map((c) => c.name)).toEqual(["Open de Madrid", "Otro"]);

    store.getState().update(id, draft({ registered: true, endDate: "2026-11-15", startTime: "09:30" }));
    expect(store.getState().competitions[0]).toMatchObject({ id, registered: true, endDate: "2026-11-15", startTime: "09:30" });

    store.getState().remove(other);
    expect(store.getState().competitions).toHaveLength(1);

    const saved = JSON.parse(storage.data.get(COMPETITIONS_STORAGE_KEY)!);
    expect(saved.state.competitions).toHaveLength(1);
    expect(saved.state.competitions[0].name).toBe("Open de Madrid");
  });

  it("trims text and drops empty optional fields and repeated categories", () => {
    const store = createCompetitionsStore(memoryStorage);
    store.getState().add(draft({ name: "  Open  ", notes: " hola ", startTime: "", registrationDeadline: "", events: ["333", "333"] }));
    const [saved] = store.getState().competitions;
    expect(saved.name).toBe("Open");
    expect(saved.notes).toBe("hola");
    expect(saved.events).toEqual(["333"]);
    expect("startTime" in saved).toBe(false);
    expect("registrationDeadline" in saved).toBe(false);
  });

  it("loads what was saved on this device", async () => {
    const storage = memoryStorage();
    createCompetitionsStore(() => storage).getState().add(draft());
    const reopened = createCompetitionsStore(() => storage);
    expect(reopened.getState().competitions).toEqual([]);
    await reopened.persist.rehydrate();
    expect(reopened.getState().competitions.map((c) => c.name)).toEqual(["Open de Madrid"]);
  });

  it("starts empty when the saved data is broken, instead of failing", async () => {
    const store = createCompetitionsStore(() => memoryStorage("{not json"));
    await store.persist.rehydrate();
    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState().competitions).toEqual([]);
  });

  it("keeps working when storage throws (private mode, full disk)", async () => {
    const broken: StateStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("full");
      },
      removeItem: () => {},
    };
    vi.stubGlobal("localStorage", broken);
    const store = createCompetitionsStore(); // the real safeLocalStorage
    await store.persist.rehydrate();
    expect(store.persist.hasHydrated()).toBe(true);
    store.getState().add(draft());
    expect(store.getState().competitions).toHaveLength(1);
  });

  it("safeLocalStorage never throws, even with no localStorage at all", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(safeLocalStorage.getItem("x")).toBeNull();
    expect(() => safeLocalStorage.setItem("x", "1")).not.toThrow();
    expect(() => safeLocalStorage.removeItem("x")).not.toThrow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});

describe("sanitizeCompetitions", () => {
  it("keeps good entries, fixes what it can and drops the rest", () => {
    const result = sanitizeCompetitions([
      { id: "a", name: "Bien", startDate: "2026-11-14", events: ["333", 5], registered: true },
      { id: "b", name: "Fin malo", startDate: "2026-11-14", endDate: "2026-11-01", startTime: "9h" },
      { id: "c", name: "Sin fecha" },
      { name: "Sin id", startDate: "2026-11-14" },
      null,
      "x",
    ]);
    expect(result).toEqual([
      { id: "a", name: "Bien", startDate: "2026-11-14", place: "", events: ["333"], registered: true, notes: "" },
      { id: "b", name: "Fin malo", startDate: "2026-11-14", place: "", events: [], registered: false, notes: "" },
    ]);
  });

  it("returns an empty list for anything that is not a list", () => {
    expect(sanitizeCompetitions(undefined)).toEqual([]);
    expect(sanitizeCompetitions({})).toEqual([]);
  });
});
