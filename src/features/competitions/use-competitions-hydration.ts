"use client";

import { useEffect, useSyncExternalStore } from "react";
import { localDayKey } from "./dates";
import { useCompetitions } from "./store";

/**
 * Loads the saved competitions after mount and reports when they are
 * ready, so the screen never flashes "no competitions" before the list.
 */
export function useCompetitionsHydration(): boolean {
  const hydrated = useSyncExternalStore(
    (onChange) => useCompetitions.persist.onFinishHydration(onChange),
    () => useCompetitions.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (!useCompetitions.persist.hasHydrated()) {
      void useCompetitions.persist.rehydrate();
    }
  }, []);

  return hydrated;
}

/** Re-checks the day every minute, so "Es hoy" turns over at midnight. */
const subscribeToMinutes = (onChange: () => void) => {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
};

/** Today on this device, as "YYYY-MM-DD"; null while rendering on the server. */
export function useToday(): string | null {
  return useSyncExternalStore(subscribeToMinutes, () => localDayKey(new Date()), () => null);
}
