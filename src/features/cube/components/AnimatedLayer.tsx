"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { layerTurn, turnAngle } from "../moves";
import type { AnyMove } from "../moves";
import type { CubeSize, Cubie as CubieState } from "../types";
import { Cubie } from "./Cubie";

const AXIS_VECTOR: Record<0 | 1 | 2, Vector3> = {
  0: new Vector3(1, 0, 0),
  1: new Vector3(0, 1, 0),
  2: new Vector3(0, 0, 1),
};

const ANIMATION_SECONDS = 0.22;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function AnimatedLayer({
  move,
  axis,
  cubies,
  size = 3,
  onComplete,
}: {
  move: AnyMove;
  axis: 0 | 1 | 2;
  cubies: CubieState[];
  size?: CubeSize;
  onComplete: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const progress = useRef(0);
  const completed = useRef(false);
  // Primes take the short way (opposite sign).
  const targetAngle = turnAngle(layerTurn(move, size));
  const axisVector = AXIS_VECTOR[axis];

  useFrame((_, delta) => {
    if (!groupRef.current || completed.current) return;
    progress.current = Math.min(1, progress.current + delta / ANIMATION_SECONDS);
    const angle = targetAngle * easeOutCubic(progress.current);
    groupRef.current.setRotationFromAxisAngle(axisVector, angle);

    if (progress.current >= 1) {
      completed.current = true;
      onComplete();
    }
  });

  return (
    <group ref={groupRef}>
      {cubies.map((cubie) => (
        <Cubie key={cubie.id} cubie={cubie} size={size} />
      ))}
    </group>
  );
}
