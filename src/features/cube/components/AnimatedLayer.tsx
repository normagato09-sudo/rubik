"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { baseQuarterAngle, parseMove } from "../moves";
import type { Move } from "../moves";
import type { Cubie as CubieState } from "../types";
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

/** Signed animation angle: primes take the short way (opposite sign). */
function animationAngle(move: Move): number {
  const { face, turns } = parseMove(move);
  const base = baseQuarterAngle(face);
  if (turns === 1) return base;
  if (turns === 2) return base * 2;
  return -base;
}

export function AnimatedLayer({
  move,
  axis,
  cubies,
  onComplete,
}: {
  move: Move;
  axis: 0 | 1 | 2;
  cubies: CubieState[];
  onComplete: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const progress = useRef(0);
  const completed = useRef(false);
  const targetAngle = animationAngle(move);
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
        <Cubie key={cubie.id} cubie={cubie} />
      ))}
    </group>
  );
}
