import type { ReactNode } from "react";

/**
 * No menu, header or sidebar: Inicio (Cubo → Método → Aprender, and
 * Solucionador) is the only entry point, and every screen links back to it.
 * SidebarNav and RightPanel are kept but not rendered.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:py-10">
      {children}
    </main>
  );
}
