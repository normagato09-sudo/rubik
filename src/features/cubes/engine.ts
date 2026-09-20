/**
 * Pure logic over the user's cube list: no React/Zustand here, same split
 * as `features/history/engine.ts`.
 */
import type { Cube } from "./types";

/** Appends a new cube, oldest first (the order cubes were created). */
export function addCube(cubes: Cube[], cube: Cube): Cube[] {
  return [...cubes, cube];
}
