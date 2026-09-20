"use client";

import { useCubeStore } from "@/store/cubeStore";
import { FACES } from "../moves";
import type { Face, Move } from "../moves";

const FACE_LABEL: Record<Face, string> = {
  R: "R — derecha",
  L: "L — izquierda",
  U: "U — arriba",
  D: "D — abajo",
  F: "F — frente",
  B: "B — detrás",
};

export function MoveControls() {
  const requestMove = useCubeStore((s) => s.requestMove);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FACES.map((face) => (
        <div key={face} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
          <span className="text-xs font-medium text-muted">{FACE_LABEL[face]}</span>
          <div className="flex gap-2">
            {([face, `${face}'`, `${face}2`] as Move[]).map((move) => (
              <button
                key={move}
                type="button"
                onClick={() => requestMove(move)}
                className="flex-1 rounded-lg bg-background py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {move}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
