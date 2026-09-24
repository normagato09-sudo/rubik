"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CubeMark } from "@/components/cube-mark";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <CubeMark className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-tight">RUBIKO</span>
        </div>
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={navOpen}
          onClick={() => setNavOpen(true)}
          className="rounded-lg border border-border p-2 text-foreground"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </header>

      {navOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 bg-black/40"
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-surface">
            <div className="flex items-center justify-end px-2 pt-2">
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setNavOpen(false)}
                className="rounded-lg p-2 text-muted hover:text-foreground"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block">
        <SidebarNav />
      </aside>

      {/* Cubo and Método are chosen on Inicio only, so the old "Opciones de
          entrenamiento" panel (RightPanel) is no longer rendered here. */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
