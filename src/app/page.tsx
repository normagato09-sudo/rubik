import Link from "next/link";
import { QuickLinkCard } from "@/components/ui/quick-link-card";
import { CUBES } from "@/features/trainer/cubes";
import { METHODS } from "@/features/trainer/methods";

export default function HomePage() {
  const cube = CUBES.find((option) => option.status === "active");
  const method = METHODS.find((option) => option.status === "active");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted">
          Resumen de tu configuración de entrenamiento.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              Cubo
            </span>
            <span className="text-lg font-semibold text-foreground">
              {cube?.label}
            </span>
          </div>
          <div className="hidden h-10 w-px bg-border sm:block" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              Método
            </span>
            <span className="text-lg font-semibold text-foreground">
              {method?.label}
            </span>
          </div>
        </div>
        <Link
          href="/entrenar"
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Entrenar
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLinkCard
          href="/entrenar"
          title="Entrenar"
          description="CFOP: Cross, F2L, OLL, PLL."
        />
        <QuickLinkCard
          href="/metodos"
          title="Métodos"
          description="Métodos disponibles para 3×3."
        />
        <QuickLinkCard
          href="/progreso"
          title="Progreso"
          description="Seguimiento por etapa."
        />
      </div>
    </div>
  );
}
