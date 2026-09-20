"use client";

import { useMemo } from "react";
import { createSolvedCube } from "../model";
import { Cubie } from "./Cubie";

/**
 * Renders the 3D cube from a cube state. Face turns will later replace
 * `createSolvedCube()` with state coming from a store; this component only
 * needs a `CubeState` to draw, it never mutates it.
 */
export function RubiksCube() {
  const cube = useMemo(() => createSolvedCube(), []);

  return (
    <group>
      {cube.cubies.map((cubie) => (
        <Cubie key={cubie.id} cubie={cubie} />
      ))}
    </group>
  );
}
