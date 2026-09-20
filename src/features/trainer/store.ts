import { create } from "zustand";
import { CUBES, DEFAULT_CUBE_ID } from "./cubes";
import { DEFAULT_METHOD_ID, METHODS } from "./methods";

interface TrainerPreferencesStore {
  cubeId: string;
  methodId: string;
  /** No-op if the target cube is not active yet ("próximamente"). */
  setCube: (id: string) => void;
  /** No-op if the target method is not active yet ("próximamente"). */
  setMethod: (id: string) => void;
}

export const useTrainerPreferences = create<TrainerPreferencesStore>(
  (set) => ({
    cubeId: DEFAULT_CUBE_ID,
    methodId: DEFAULT_METHOD_ID,
    setCube: (id) => {
      if (CUBES.find((cube) => cube.id === id)?.status !== "active") return;
      set({ cubeId: id });
    },
    setMethod: (id) => {
      if (METHODS.find((method) => method.id === id)?.status !== "active")
        return;
      set({ methodId: id });
    },
  }),
);
