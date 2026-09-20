import Link from "next/link";
import { CUBES } from "@/features/trainer/cubes";
import { METHODS } from "@/features/trainer/methods";

export default function HomePage() {
  const cube = CUBES.find((option) => option.status === "active");
  const method = METHODS.find((option) => option.status === "active");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Entrenador 3×3
        </h1>
        <p className="text-sm text-muted">
          Configuración activa: {cube?.label} · {method?.label}
        </p>
      </div>

      <Link
        href="/entrenar"
        className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Ir a Entrenar
      </Link>
    </div>
  );
}
