"use client";

import { useEffect, useRef, useState } from "react";
import type { TrainerOption } from "@/features/trainer/types";
import { ChevronDownIcon } from "@/components/ui/icons";

export function OptionDropdown({
  label,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  options: TrainerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === selectedId);

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
      <span className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
      >
        {selected?.label}
        <ChevronDownIcon
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
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
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                    isActive
                      ? "cursor-pointer text-foreground hover:bg-border/50"
                      : "cursor-not-allowed text-muted"
                  } ${isSelected ? "bg-accent/10" : ""}`}
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

