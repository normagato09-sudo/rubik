import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { isDayKey } from "./dates";
import type { Competition, CompetitionDraft } from "./types";

/**
 * The competitions you have noted down. They live only on this device
 * (localStorage, its own key): there is no login, so each person keeps
 * their own on their own phone.
 */
export interface CompetitionsStore {
  competitions: Competition[];
  add: (draft: CompetitionDraft) => string;
  update: (id: string, draft: CompetitionDraft) => void;
  remove: (id: string) => void;
}

export const COMPETITIONS_STORAGE_KEY = "rubiko-competitions";

/**
 * localStorage that never throws: private mode, a full disk or blocked
 * storage just mean nothing is read or saved, and the screen keeps working.
 */
export const safeLocalStorage: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Not saved; the competitions stay in memory until the page closes.
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to do.
    }
  },
};

/** Wraps a storage so unreadable JSON counts as "nothing saved" instead of an error. */
function tolerant(storage: StateStorage): StateStorage {
  return {
    ...storage,
    getItem: (key) => {
      const value = storage.getItem(key);
      if (typeof value !== "string") return null;
      try {
        JSON.parse(value);
        return value;
      } catch {
        return null;
      }
    },
  };
}

const optionalString = (value: unknown) => (typeof value === "string" && value !== "" ? value : undefined);

/** Keeps only well-formed competitions from saved data, filling in missing fields. */
export function sanitizeCompetitions(value: unknown): Competition[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): Competition[] => {
    if (typeof item !== "object" || item === null) return [];
    const raw = item as Record<string, unknown>;
    if (typeof raw.id !== "string" || typeof raw.name !== "string" || !isDayKey(raw.startDate)) return [];
    const endDate = isDayKey(raw.endDate) && raw.endDate > raw.startDate ? raw.endDate : undefined;
    const startTime = optionalString(raw.startTime);
    const registrationDeadline = isDayKey(raw.registrationDeadline) ? raw.registrationDeadline : undefined;
    return [
      {
        id: raw.id,
        name: raw.name,
        startDate: raw.startDate,
        ...(endDate ? { endDate } : {}),
        place: typeof raw.place === "string" ? raw.place : "",
        ...(startTime && /^\d{2}:\d{2}$/.test(startTime) ? { startTime } : {}),
        ...(registrationDeadline ? { registrationDeadline } : {}),
        events: Array.isArray(raw.events) ? raw.events.filter((e): e is string => typeof e === "string") : [],
        registered: raw.registered === true,
        notes: typeof raw.notes === "string" ? raw.notes : "",
      },
    ];
  });
}

/** Trims the text and drops empty optional fields. */
function clean(draft: CompetitionDraft): CompetitionDraft {
  return {
    name: draft.name.trim(),
    startDate: draft.startDate,
    ...(draft.endDate && draft.endDate > draft.startDate ? { endDate: draft.endDate } : {}),
    place: draft.place.trim(),
    ...(draft.startTime ? { startTime: draft.startTime } : {}),
    ...(draft.registrationDeadline ? { registrationDeadline: draft.registrationDeadline } : {}),
    events: [...new Set(draft.events)],
    registered: draft.registered,
    notes: draft.notes.trim(),
  };
}

/** crypto.randomUUID only exists on https/localhost; the phone may open the app over plain http. */
function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // Fall through.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createCompetitionsStore(storage?: () => StateStorage) {
  return create<CompetitionsStore>()(
    persist(
      (set, get) => ({
        competitions: [],
        add: (draft) => {
          const id = newId();
          set({ competitions: [...get().competitions, { id, ...clean(draft) }] });
          return id;
        },
        update: (id, draft) =>
          set({
            competitions: get().competitions.map((competition) =>
              competition.id === id ? { id, ...clean(draft) } : competition,
            ),
          }),
        remove: (id) => set({ competitions: get().competitions.filter((competition) => competition.id !== id) }),
      }),
      {
        name: COMPETITIONS_STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(() => tolerant((storage ?? (() => safeLocalStorage))())),
        partialize: (state) => ({ competitions: state.competitions }),
        merge: (persisted, current) => ({
          ...current,
          competitions: sanitizeCompetitions((persisted as { competitions?: unknown } | undefined)?.competitions),
        }),
        // Loaded after mount (useCompetitionsHydration), so server HTML and
        // the first client render match.
        skipHydration: true,
      },
    ),
  );
}

export const useCompetitions = createCompetitionsStore();
