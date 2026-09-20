import { create } from "zustand";
import { addCube as addCubeEntry } from "@/features/cubes/engine";
import type { Cube, CubeTypeId } from "@/features/cubes/types";

/**
 * Seeded so every part of the app that needs a `cubeId` (recording a
 * solve, filtering "Cubos") always has one, even before the "+ Añadir
 * cubo" screen exists. Once that screen ships, this stops being special —
 * it's just the first cube in the list.
 */
const DEFAULT_CUBE: Cube = {
  id: "default-3x3",
  type: "3x3",
  name: "Cubo 3×3",
  createdAt: 0,
};

interface CubesStore {
  cubes: Cube[];
  activeCubeId: string;
  /** No-op if `type` is not an active cube type yet ("próximamente"). */
  addCube: (input: { type: CubeTypeId; name: string }) => void;
  /** No-op if `id` does not match an existing cube. */
  setActiveCube: (id: string) => void;
}

export const useCubesStore = create<CubesStore>((set, get) => ({
  cubes: [DEFAULT_CUBE],
  activeCubeId: DEFAULT_CUBE.id,
  addCube: ({ type, name }) => {
    const cube: Cube = { id: crypto.randomUUID(), type, name, createdAt: Date.now() };
    set({ cubes: addCubeEntry(get().cubes, cube) });
  },
  setActiveCube: (id) => {
    if (!get().cubes.some((cube) => cube.id === id)) return;
    set({ activeCubeId: id });
  },
}));
