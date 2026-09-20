import Link from "next/link";
import { CubeMark } from "@/components/cube-mark";
import { FeatureCard } from "@/components/ui/feature-card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-8">
        <CubeMark className="h-8 w-8" />
        <span className="text-lg font-semibold tracking-tight">RUBIKO</span>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 pb-20">
        <section className="flex flex-col items-start gap-6 pt-10 sm:pt-16">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Practica el cubo de Rubik como un speedcuber.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Cubo 3D interactivo, scrambles, cronómetro, estadísticas y un
            solucionador paso a paso, todo en un mismo lugar.
          </p>
          <Link
            href="/practice"
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Ver el cubo 3D
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            accent="var(--cube-blue)"
            title="Cubo 3D"
            description="Un cubo interactivo que podrás inspeccionar en 3D. Los giros de caras llegan en el siguiente paso."
            status="próximamente"
          >
            <CubeIcon />
          </FeatureCard>
          <FeatureCard
            accent="var(--cube-orange)"
            title="Cronómetro"
            description="Inspección, +2, DNF, historial y medias Ao5 / Ao12 pensadas para speedcubing."
            status="próximamente"
          >
            <TimerIcon />
          </FeatureCard>
          <FeatureCard
            accent="var(--cube-green)"
            title="Aprendizaje"
            description="Movimientos explicados y algoritmos con animaciones sobre el propio cubo 3D."
            status="próximamente"
          >
            <BookIcon />
          </FeatureCard>
          <FeatureCard
            accent="var(--cube-red)"
            title="Solucionador"
            description="Introduce el estado de tu cubo y sigue la solución movimiento a movimiento."
            status="próximamente"
          >
            <WandIcon />
          </FeatureCard>
          <FeatureCard
            accent="var(--cube-yellow)"
            title="Estadísticas"
            description="Historial de tiempos y progreso guardado para ver tu evolución."
            status="próximamente"
          >
            <ChartIcon />
          </FeatureCard>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-sm text-muted">
        RUBIKO — en desarrollo.
      </footer>
    </div>
  );
}

function iconProps() {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
  };
}

function CubeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="M3 7.5v9L12 21l9-4.5v-9" />
      <path d="M12 12v9" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z" />
      <path d="M4 19a2.5 2.5 0 0 1 2.5-2.5H20" />
    </svg>
  );
}

function WandIcon() {
  return (
    <svg {...iconProps()}>
      <path d="m15 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
      <path d="m4 20 9-9" />
      <path d="M18 13v2" />
      <path d="M19 18h2" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-6" />
      <path d="M4 20h16" />
    </svg>
  );
}
