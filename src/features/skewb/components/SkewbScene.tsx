"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Vector3, type Group } from "three";
import { CUBE_COLOR_HEX, CUBE_PLASTIC_HEX } from "@/features/cube/palette";
import type { CubeColor } from "@/features/cube/types";
import { STICKER_POLYGONS, centroid, faceOf, FACE_NORMAL, type Vec3 } from "../geometry";
import { turnGeometry, type SkewbTurn } from "../moves";

const ANIMATION_SECONDS = 0.25;
const NOOP = () => {};

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Looking at the up-front-right corner, as the WCA holds it: white on top, green on the left, red on the right. */
const CAMERA_POSITION: [number, number, number] = [4.3, 4, 4.3];

/** One sticker, a little smaller than its place and just off the body, so the plastic shows between stickers. */
function stickerGeometry(corners: Vec3[], normal: Vec3): BufferGeometry {
  const middle = centroid(corners);
  const points = corners.map((corner) =>
    corner.map((value, k) => middle[k] + (value - middle[k]) * 0.88 + normal[k] * 0.006),
  );
  // A fan from the first corner: one triangle for a corner sticker, two for a center.
  const triangles = points.slice(1, -1).flatMap((point, i) => [points[0], point, points[i + 2]]);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(triangles.flat(), 3));
  geometry.computeVertexNormals();
  return geometry;
}

const STICKER_GEOMETRY = STICKER_POLYGONS.map((polygon, i) => stickerGeometry(polygon, FACE_NORMAL[faceOf(i)]));

/** The plastic under each sticker: its full place, flush with the cube's face. */
const BACKING_GEOMETRY = STICKER_POLYGONS.map((polygon) => {
  const triangles = polygon.slice(1, -1).flatMap((point, i) => [polygon[0], point, polygon[i + 2]]);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(triangles.flat(), 3));
  geometry.computeVertexNormals();
  return geometry;
});

function Sticker({ index, color }: { index: number; color: CubeColor }) {
  return (
    <>
      <mesh geometry={BACKING_GEOMETRY[index]}>
        <meshStandardMaterial color={CUBE_PLASTIC_HEX} roughness={0.8} side={DoubleSide} />
      </mesh>
      <mesh geometry={STICKER_GEOMETRY[index]}>
        <meshStandardMaterial color={CUBE_COLOR_HEX[color]} roughness={0.5} side={DoubleSide} />
      </mesh>
    </>
  );
}

/** The stickers that turn with `turn`, rotated around its axis. */
function TurningPart({
  turn,
  stickers,
  onComplete,
}: {
  turn: SkewbTurn;
  stickers: { index: number; color: CubeColor }[];
  onComplete: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const progress = useRef(0);
  const completed = useRef(false);
  const { axis, angle } = useMemo(() => {
    const geometry = turnGeometry(turn);
    return { axis: new Vector3(...geometry.axis), angle: geometry.angle };
  }, [turn]);

  useFrame((_, delta) => {
    if (!groupRef.current || completed.current) return;
    progress.current = Math.min(1, progress.current + delta / ANIMATION_SECONDS);
    groupRef.current.setRotationFromAxisAngle(axis, angle * easeOutCubic(progress.current));
    if (progress.current >= 1) {
      completed.current = true;
      onComplete();
    }
  });

  return (
    <group ref={groupRef}>
      {stickers.map(({ index, color }) => (
        <Sticker key={index} index={index} color={color} />
      ))}
    </group>
  );
}

/**
 * A Skewb in 3D, held the WCA way (white on top, green in front on the
 * left), with the colors of `state` (30 stickers, numbered as in
 * geometry.ts). Passing `activeTurn` turns that half (or the whole Skewb)
 * once, then calls `onMoveComplete`; `state` stays what it was before the
 * turn until the caller swaps it. Purely visual, like the Pyraminx's scene.
 *
 * The black body is not drawn as a cube, which a turning half would cut
 * through: each sticker sits on its own dark backing that turns with it.
 */
export function SkewbScene({
  state,
  activeTurn = null,
  moveId = 0,
  onMoveComplete = NOOP,
  className = "h-52 sm:h-60",
}: {
  state: readonly CubeColor[];
  activeTurn?: SkewbTurn | null;
  moveId?: number;
  onMoveComplete?: () => void;
  className?: string;
}) {
  const stickers = state.map((color, index) => ({ index, color }));
  const turns = activeTurn ? turnGeometry(activeTurn).turns : null;
  const turning = turns ? stickers.filter(({ index }) => turns(index)) : [];
  const still = turns ? stickers.filter(({ index }) => !turns(index)) : stickers;

  return (
    <div className={`pointer-events-none w-full select-none ${className}`}>
      <Canvas shadows={false} dpr={[1, 2]} camera={{ position: CAMERA_POSITION, fov: 35 }}>
        <color attach="background" args={["#0b0b0f"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <directionalLight position={[-4, -3, -5]} intensity={0.35} />
        <group position={[0, -0.05, 0]}>
          {still.map(({ index, color }) => (
            <Sticker key={index} index={index} color={color} />
          ))}
          {activeTurn && (
            <TurningPart key={moveId} turn={activeTurn} stickers={turning} onComplete={onMoveComplete} />
          )}
        </group>
      </Canvas>
    </div>
  );
}
