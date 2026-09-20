"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { CUBE_COLOR_HEX, CUBE_PLASTIC_HEX } from "../palette";
import type { Cubie as CubieState } from "../types";
import { orientationToQuaternion } from "./orientation";
import { STICKER_TRANSFORM } from "./sticker-transforms";

const SPACING = 1.04;
const CUBIE_SIZE = 0.94;
const STICKER_SIZE = CUBIE_SIZE * 0.82;
const STICKER_OFFSET = CUBIE_SIZE / 2 + 0.011;

export function Cubie({ cubie }: { cubie: CubieState }) {
  const quaternion = useMemo(
    () => orientationToQuaternion(cubie.orientation),
    [cubie.orientation],
  );
  const position = useMemo(
    () => cubie.position.map((c) => c * SPACING) as [number, number, number],
    [cubie.position],
  );

  return (
    <group position={position} quaternion={quaternion}>
      <RoundedBox args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color={CUBE_PLASTIC_HEX} roughness={0.65} metalness={0.05} />
      </RoundedBox>
      {cubie.stickers.map((sticker) => {
        const { direction, rotation } = STICKER_TRANSFORM[sticker.face];
        return (
          <mesh
            key={sticker.face}
            position={direction.map((d) => d * STICKER_OFFSET) as [number, number, number]}
            rotation={rotation}
          >
            <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
            <meshStandardMaterial
              color={CUBE_COLOR_HEX[sticker.color]}
              roughness={0.35}
              metalness={0}
            />
          </mesh>
        );
      })}
    </group>
  );
}
