import Link from "next/link";
import { isLearningMethodId, learnHref } from "@/features/learning/categories";
import { CUBES } from "@/features/trainer/cubes";
import { getMethodsForCubeType } from "@/features/trainer/methods";

export const metadata = {
  title: "Métodos — RUBIKO",
};

/** Every cube that has methods, each with its own list. */
const CUBES_WITH_METHODS = CUBES.map((cube) => ({
  cube,
  methods: getMethodsForCubeType(cube.id),
})).filter(({ methods }) => methods.length > 0);

export default function MetodosPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Métodos</h1>

      {CUBES_WITH_METHODS.map(({ cube, methods }) => (
        <section key={cube.id} className="flex flex-col gap-3">
          <h2 className="text-sm text-muted">{cube.label}</h2>
          <ul className="flex flex-col gap-3">
            {methods.map((method) => {
              const isActive = method.status === "active";
              return (
                <li
                  key={method.id}
                  className={`flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 transition-colors ${
                    isActive ? "hover:border-accent/30" : ""
                  }`}
                >
                  <span className="font-medium text-foreground">{method.label}</span>
                  {isActive && isLearningMethodId(method.id) ? (
                    <Link
                      href={learnHref(method.id)}
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
        </section>
      ))}
    </div>
  );
}
