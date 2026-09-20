import type { ReactNode } from "react";

export function FeatureCard({
  accent,
  title,
  description,
  status,
  children,
}: {
  accent: string;
  title: string;
  description: string;
  status: "disponible" | "próximamente";
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        {children}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">{title}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              status === "disponible"
                ? "bg-cube-green/15 text-cube-green"
                : "bg-muted/15 text-muted"
            }`}
          >
            {status === "disponible" ? "Disponible" : "Próximamente"}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}
