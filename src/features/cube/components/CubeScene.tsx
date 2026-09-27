"use client";

import { Canvas } from "@react-three/fiber";
import type { Move } from "../moves";
import type { CubeSize, CubeState } from "../types";
import { CubeBody } from "./CubeBody";

const NOOP = () => {};

/** Camera for each size: the smaller 2×2 is viewed from closer, so it fills the same space. */
const CAMERA_POSITION: Record<CubeSize, [number, number, number]> = {
  3: [4.2, 3.6, 4.8],
  2: [2.9, 2.5, 3.3],
};

/**
 * Renders a `CubeState` that isn't the global solve cube — e.g. a
 * training case's own local state — unlike `RubiksCube`, which always
 * reads/animates the live state from `cubeStore`. Static by default (just
 * `cubeState`); passing `activeMove`/`moveId`/`onMoveComplete` animates a
 * single move on top of it, same as the main cube, via the shared
 * `CubeBody`. Purely visual, on purpose: no `OrbitControls`, no camera
 * drag — `pointer-events-none` on the wrapper means the canvas never
 * intercepts clicks meant for the move buttons around it, and the only
 * way to change what's shown is the caller passing a new `activeMove`.
 */
export function CubeScene({
  cubeState,
  activeMove = null,
  moveId = 0,
  onMoveComplete,
  className = "h-48 sm:h-56",
  size = 3,
}: {
  cubeState: CubeState;
  activeMove?: Move | null;
  moveId?: number;
  onMoveComplete?: () => void;
  className?: string;
  size?: CubeSize;
}) {
  return (
    <div className={`pointer-events-none w-full select-none ${className}`}>
      <Canvas shadows={false} dpr={[1, 2]} camera={{ position: CAMERA_POSITION[size], fov: 35 }}>
        <color attach="background" args={["#0b0b0f"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 6, 4]} intensity={1.1} />
        <directionalLight position={[-4, -3, -5]} intensity={0.35} />
        <CubeBody
          cubeState={cubeState}
          activeMove={activeMove}
          moveId={moveId}
          onMoveComplete={onMoveComplete ?? NOOP}
          size={size}
        />
      </Canvas>
    </div>
  );
}
