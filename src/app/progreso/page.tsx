export const metadata = {
  title: "Progreso — RUBIKO",
};

export default function ProgresoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted">3×3 · CFOP</p>
        <h1 className="text-2xl font-semibold tracking-tight">Progreso</h1>
      </div>

      <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border p-8">
        <p className="text-sm font-medium text-foreground">
          Todavía no hay datos de progreso.
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Cuando el entrenamiento por casos esté implementado, aquí se
          mostrará el progreso de Cross, F2L, OLL y PLL.
        </p>
      </div>
    </div>
  );
}
