"use client";

import { useEffect, useRef, useState } from "react";
import type { TrainerOption } from "@/features/trainer/types";
import { ChevronDownIcon } from "@/components/ui/icons";

export function OptionDropdown({
  label,
  options,
  selectedId,
  onSelect,
  size = "md",
}: {
  label: string;
  options: TrainerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** "lg" is a bigger, thumb-friendly touch target for primary screens like Inicio. */
  size?: "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === selectedId);
  const isLarge = size === "lg";

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <span
        className={`font-medium tracking-wide text-muted uppercase ${isLarge ? "text-sm" : "text-xs"}`}
      >
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center justify-between gap-2 rounded-xl border border-border bg-surface font-medium text-foreground transition-colors hover:border-accent/40 ${
          isLarge ? "px-5 py-4 text-lg" : "px-3 py-2 text-sm"
        }`}
      >
        {selected?.label}
        <ChevronDownIcon
          className={`${isLarge ? "h-5 w-5" : "h-4 w-4"} text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface-2 py-1 shadow-lg"
        >
          {options.map((option) => {
            const isActive = option.status === "active";
            const isSelected = option.id === selectedId;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={!isActive}
                  onClick={() => {
                    onSelect(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 text-left ${
                    isLarge ? "px-5 py-3.5 text-base" : "px-3 py-2 text-sm"
                  } ${
                    isActive
                      ? "cursor-pointer text-foreground hover:bg-surface-3"
                      : "cursor-not-allowed text-muted"
                  } ${isSelected ? "bg-accent-soft" : ""}`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`text-[10px] font-semibold tracking-wide uppercase ${
                      isActive ? "text-cube-green" : "text-muted"
                    }`}
                  >
                    {isActive ? "Activo" : "Próximamente"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

