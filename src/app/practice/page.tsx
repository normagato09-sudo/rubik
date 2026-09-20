import Link from "next/link";
import { MoveControls } from "@/features/cube/components/MoveControls";
import { RubiksCubeScene } from "@/features/cube/components/RubiksCubeScene";
import { ScrambleBar } from "@/features/scramble/components/ScrambleBar";

export const metadata = {
  title: "Cubo 3D — RUBIKO",
};

export default function PracticePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-4 px-6 py-6">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← RUBIKO
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cubo 3D</h1>
          <p className="text-sm text-muted">
            Arrastra para rotar la vista y usa los botones para girar cada
            cara.
          </p>
        </div>
        <ScrambleBar />
        <RubiksCubeScene />
        <MoveControls />
      </main>
    </div>
  );
}
