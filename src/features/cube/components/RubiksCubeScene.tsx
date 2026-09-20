"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RubiksCube } from "./RubiksCube";

export function RubiksCubeScene() {
  return (
    <div className="h-[70svh] w-full touch-none sm:h-[75svh]">
      <Canvas
        shadows={false}
        dpr={[1, 2]}
        camera={{ position: [4.2, 3.6, 4.8], fov: 35 }}
      >
        <color attach="background" args={["#0b0b0f"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 6, 4]} intensity={1.1} />
        <directionalLight position={[-4, -3, -5]} intensity={0.35} />
        <RubiksCube />
        <OrbitControls
          enableDamping
          dampingFactor={0.12}
          enablePan={false}
          minDistance={4.5}
          maxDistance={11}
          rotateSpeed={0.7}
        />
      </Canvas>
    </div>
  );
}
