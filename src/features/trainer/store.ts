import { create } from "zustand";
import { CUBES, DEFAULT_CUBE_ID } from "./cubes";
import { DEFAULT_METHOD_ID, getMethodsForCubeType } from "./methods";

interface TrainerPreferencesStore {
  cubeId: string;
  methodId: string;
  /** No-op if the target cube is not active yet ("próximamente"). */
  setCube: (id: string) => void;
  /** No-op if the target method is not active, or not available for the current cube. */
  setMethod: (id: string) => void;
}

/** First active method for a cube type — the "Cubo → Método" cascade. */
function defaultMethodFor(cubeId: string): string {
  return (
    getMethodsForCubeType(cubeId).find((method) => method.status === "active")?.id ??
    DEFAULT_METHOD_ID
  );
}

export const useTrainerPreferences = create<TrainerPreferencesStore>(
  (set, get) => ({
    cubeId: DEFAULT_CUBE_ID,
    methodId: DEFAULT_METHOD_ID,
    setCube: (id) => {
      if (CUBES.find((cube) => cube.id === id)?.status !== "active") return;
      if (id === get().cubeId) return;
      // Changing the cube can change which methods are available, so the
      // method selection must cascade instead of pointing at a method
      // that no longer belongs to this cube.
      set({ cubeId: id, methodId: defaultMethodFor(id) });
    },
    setMethod: (id) => {
      const method = getMethodsForCubeType(get().cubeId).find((option) => option.id === id);
      if (method?.status !== "active") return;
      set({ methodId: id });
    },
  }),
);
