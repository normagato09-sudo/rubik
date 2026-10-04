"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { validateDraft, type DraftErrors } from "../dates";
import { COMPETITION_EVENTS, eventLabel, type CompetitionDraft } from "../types";

const INPUT =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none sm:text-sm [color-scheme:dark]";

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error ? <span className="text-xs text-cube-red">{error}</span> : hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const emptyDraft = (startDate = ""): CompetitionDraft => ({
  name: "",
  startDate,
  place: "",
  events: [],
  registered: false,
  notes: "",
});

/** Add or edit a competition. Optional fields left empty are not saved. */
export function CompetitionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: CompetitionDraft;
  submitLabel: string;
  onSubmit: (draft: CompetitionDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CompetitionDraft>(initial);
  const [multiDay, setMultiDay] = useState(initial.endDate !== undefined);
  const [errors, setErrors] = useState<DraftErrors>({});
  const set = (patch: Partial<CompetitionDraft>) => setDraft((current) => ({ ...current, ...patch }));
  // Events saved earlier that are no longer in the list still show, so editing never drops them.
  const eventIds = [...new Set([...COMPETITION_EVENTS.map((event) => event.id), ...draft.events])];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const final: CompetitionDraft = {
      ...draft,
      endDate: multiDay ? (draft.endDate ?? "") : undefined,
      startTime: draft.startTime || undefined,
      registrationDeadline: draft.registrationDeadline || undefined,
    };
    const found = validateDraft(final);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(final);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Nombre" error={errors.name}>
        <input
          className={INPUT}
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ej.: Open de Madrid 2026"
          maxLength={120}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={multiDay ? "Primer día" : "Fecha"} error={errors.startDate}>
          <input type="date" className={INPUT} value={draft.startDate} onChange={(e) => set({ startDate: e.target.value })} />
        </Field>
        {multiDay ? (
          <Field label="Último día" error={errors.endDate}>
            <input type="date" className={INPUT} value={draft.endDate ?? ""} min={draft.startDate || undefined} onChange={(e) => set({ endDate: e.target.value })} />
          </Field>
        ) : null}
      </div>
      <label className="-mt-1 flex w-fit items-center gap-2 text-sm text-muted">
        <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={multiDay} onChange={(e) => setMultiDay(e.target.checked)} />
        Dura más de un día
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Lugar / ciudad">
          <input className={INPUT} value={draft.place} onChange={(e) => set({ place: e.target.value })} placeholder="Ej.: Madrid" maxLength={120} />
        </Field>
        <Field label="Hora de inicio">
          <input type="time" className={INPUT} value={draft.startTime ?? ""} onChange={(e) => set({ startTime: e.target.value })} />
        </Field>
      </div>

      <Field label="Fecha límite de inscripción" error={errors.registrationDeadline} hint="Te avisamos 7 días antes si aún no estás inscrito.">
        <input
          type="date"
          className={INPUT}
          value={draft.registrationDeadline ?? ""}
          onChange={(e) => set({ registrationDeadline: e.target.value })}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-foreground">Categorías en las que participo</legend>
        <div className="flex flex-wrap gap-2">
          {eventIds.map((id) => {
            const on = draft.events.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => set({ events: on ? draft.events.filter((e) => e !== id) : [...draft.events, id] })}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  on ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                {eventLabel(id)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3">
        <span className="text-sm font-medium text-foreground">Ya estoy inscrito</span>
        <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={draft.registered} onChange={(e) => set({ registered: e.target.checked })} />
      </label>

      <Field label="Notas">
        <textarea
          className={`${INPUT} min-h-20 resize-y`}
          value={draft.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Transporte, alojamiento, qué llevar…"
          maxLength={2000}
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-2">
          Cancelar
        </button>
        <button type="submit" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
