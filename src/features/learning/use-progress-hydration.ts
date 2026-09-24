"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useLearningProgress } from "./progress-store";

/**
 * Loads the saved learning progress from localStorage after mount and
 * reports when it is ready, so screens never show a count that is about
 * to change (e.g. a false "0/24" before the real "5/24").
 */
export function useLearningProgressHydration(): boolean {
  const hydrated = useSyncExternalStore(
    (onChange) => useLearningProgress.persist.onFinishHydration(onChange),
    () => useLearningProgress.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (!useLearningProgress.persist.hasHydrated()) {
      void useLearningProgress.persist.rehydrate();
    }
  }, []);

  return hydrated;
}
