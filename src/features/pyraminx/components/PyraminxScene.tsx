"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Vector3, type Group } from "three";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import { STICKER_TRIANGLES, VERTEX_POSITION, centroid, type Vec3 } from "../geometry";
import { VERTEX_AXIS, moveAngle, parsePyraMove, turnsWith, type PyraColor, type PyraMove } from "../moves";

const ANIMATION_SECONDS = 0.25;
const NOOP = () => {};

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Front, a little from the right and above: the front face, most of the right one and the top tip. */
const CAMERA_POSITION: [number, number, number] = [1.55, 1.6, 2.75];

/** One triangle, a little smaller than its place and just off the body, so the plastic shows between stickers. */
function triangleGeometry(corners: Vec3[]): BufferGeometry {
  const middle = centroid(corners);
  const out = new Vector3(...middle).normalize().multiplyScalar(0.004);
  const points = corners.flatMap((corner) =>
    corner.map((value, k) => middle[k] + (value - middle[k]) * 0.86 + out.getComponent(k)),
  );
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const STICKER_GEOMETRY = STICKER_TRIANGLES.map(triangleGeometry);

/** The black body: the tetrahedron itself, 4 faces. */
const BODY_GEOMETRY = (() => {
  const { U, L, R, B } = VERTEX_POSITION;
  const faces = [
    [U, L, R],
    [U, B, L],
    [U, R, B],
    [B, R, L],
  ];
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(faces.flat(2), 3));
  geometry.computeVertexNormals();
  return geometry;
})();

function Sticker({ index, color }: { index: number; color: PyraColor }) {
  return (
    <mesh geometry={STICKER_GEOMETRY[index]}>
      <meshStandardMaterial color={CUBE_COLOR_HEX[color]} roughness={0.5} />
    </mesh>
  );
}

/** The stickers that turn with `move`, rotated around its tip's axis. */
function TurningLayer({
  move,
  stickers,
  onComplete,
}: {
  move: PyraMove;
  stickers: { index: number; color: PyraColor }[];
  onComplete: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const progress = useRef(0);
  const completed = useRef(false);
  const axis = useMemo(() => new Vector3(...VERTEX_AXIS[parsePyraMove(move).vertex]), [move]);
  const target = moveAngle(move);

  useFrame((_, delta) => {
    if (!groupRef.current || completed.current) return;
    progress.current = Math.min(1, progress.current + delta / ANIMATION_SECONDS);
    groupRef.current.setRotationFromAxisAngle(axis, target * easeOutCubic(progress.current));
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
 * A Pyraminx in 3D, held the standard way (front face towards you, top
 * tip up), with the colors of `state` (36 stickers, numbered as in
 * geometry.ts). Passing `activeMove` turns that layer or tip once, then
 * calls `onMoveComplete`; `state` stays what it was before the move until
 * the caller swaps it. Purely visual, like the cube's CubeScene.
 */
export function PyraminxScene({
  state,
  activeMove = null,
  moveId = 0,
  onMoveComplete = NOOP,
  className = "h-52 sm:h-60",
}: {
  state: readonly PyraColor[];
  activeMove?: PyraMove | null;
  moveId?: number;
  onMoveComplete?: () => void;
  className?: string;
}) {
  const stickers = state.map((color, index) => ({ index, color }));
  const turning = activeMove ? stickers.filter(({ index }) => turnsWith(activeMove, index)) : [];
  const still = activeMove ? stickers.filter(({ index }) => !turnsWith(activeMove, index)) : stickers;

  return (
    <div className={`pointer-events-none w-full select-none ${className}`}>
      <Canvas shadows={false} dpr={[1, 2]} camera={{ position: CAMERA_POSITION, fov: 35 }}>
        <color attach="background" args={["#0b0b0f"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <directionalLight position={[-4, -3, -5]} intensity={0.35} />
        <group position={[0, 0.12, 0]}>
          <mesh geometry={BODY_GEOMETRY} scale={0.995}>
            <meshStandardMaterial color="#111114" roughness={0.8} />
          </mesh>
          {still.map(({ index, color }) => (
            <Sticker key={index} index={index} color={color} />
          ))}
          {activeMove && (
            <TurningLayer key={moveId} move={activeMove} stickers={turning} onComplete={onMoveComplete} />
          )}
        </group>
      </Canvas>
    </div>
  );
}
