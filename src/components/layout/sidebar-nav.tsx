"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { CubeMark } from "@/components/cube-mark";

/**
 * Inicio is the hub: Cubo → Método → Aprender all start there, so the menu
 * only adds Progreso. /entrenar/cross and /metodos still exist, just
 * aren't linked from the menu.
 */
const NAV_ITEMS: { href: Route; label: string }[] = [
  { href: "/", label: "Inicio" },
  { href: "/progreso", label: "Progreso" },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-6 px-4 py-6">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2"
      >
        <CubeMark className="h-7 w-7" />
        <span className="text-base font-semibold tracking-tight">
          RUBIKO
        </span>
      </Link>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-r-lg border-l-2 py-2 pr-3 pl-[10px] text-sm font-medium transition-colors ${
                  isActive
                    ? "border-accent bg-surface-2 text-foreground"
                    : "border-transparent text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
