"use client";

import { countdownLabel, isPast, registrationWarning, registrationWarningText, shortRange } from "../dates";
import { eventLabel, type Competition, type DayKey } from "../types";

export function CompetitionCard({
  competition,
  today,
  onEdit,
  onDelete,
}: {
  competition: Competition;
  today: DayKey;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const past = isPast(competition, today);
  const warning = registrationWarning(competition, today);

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 ${past ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-semibold break-words text-foreground">{competition.name}</h3>
          <p className="text-sm text-muted">
            {shortRange(competition, today)}
            {competition.startTime ? ` · ${competition.startTime}` : ""}
            {competition.place ? ` · ${competition.place}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            past ? "bg-muted/15 text-muted" : "bg-accent-soft text-accent"
          }`}
        >
          {past ? "Pasado" : countdownLabel(competition, today)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            competition.registered ? "bg-cube-green/15 text-cube-green" : "bg-muted/15 text-muted"
          }`}
        >
          {competition.registered ? "Inscrito" : "Sin inscribir"}
        </span>
        {competition.events.map((id) => (
          <span key={id} className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
            {eventLabel(id)}
          </span>
        ))}
      </div>

      {warning ? (
        <p
          role="status"
          className={`rounded-xl px-3 py-2 text-sm font-medium ${
            warning.kind === "closed" ? "bg-cube-red/15 text-cube-red" : "bg-cube-orange/15 text-cube-orange"
          }`}
        >
          {registrationWarningText(warning)}
        </p>
      ) : null}

      {competition.notes ? <p className="text-sm break-words whitespace-pre-line text-muted">{competition.notes}</p> : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-cube-red/40 px-3 py-1.5 text-sm font-medium text-cube-red hover:bg-cube-red/10"
        >
          Borrar
        </button>
      </div>
    </article>
  );
}
