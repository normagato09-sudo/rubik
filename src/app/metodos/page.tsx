import Link from "next/link";
import { METHODS } from "@/features/trainer/methods";

export const metadata = {
  title: "Métodos — RUBIKO",
};

export default function MetodosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted">3×3</p>
        <h1 className="text-2xl font-semibold tracking-tight">Métodos</h1>
      </div>

      <ul className="flex flex-col gap-3">
        {METHODS.map((method) => {
          const isActive = method.status === "active";
          return (
            <li
              key={method.id}
              className={`flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 transition-colors ${
                isActive ? "hover:border-accent/30" : ""
              }`}
            >
              <span className="font-medium text-foreground">
                {method.label}
              </span>
              {isActive ? (
                <Link
                  href="/entrenar"
                  className="text-sm font-medium text-accent hover:opacity-80"
                >
                  Entrenar →
                </Link>
              ) : (
                <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Próximamente
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
