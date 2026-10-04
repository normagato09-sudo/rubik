"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { competitionsOn, countdownLabel, longDate, shortRange, upcoming } from "../dates";
import { useCompetitions } from "../store";
import type { Competition, CompetitionDraft, DayKey } from "../types";
import { useCompetitionsHydration, useToday } from "../use-competitions-hydration";
import { CompetitionCard } from "./CompetitionCard";
import { CompetitionForm, emptyDraft } from "./CompetitionForm";
import { Modal } from "./Modal";
import { MonthCalendar } from "./MonthCalendar";

type Editing = { mode: "add"; startDate: DayKey } | { mode: "edit"; competition: Competition };

function draftOf(competition: Competition): CompetitionDraft {
  const draft: Partial<Competition> = { ...competition };
  delete draft.id;
  return draft as CompetitionDraft;
}

export function CompetitionsScreen() {
  const hydrated = useCompetitionsHydration();
  const today = useToday();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link href="/" className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronRightIcon className="h-4 w-4 rotate-180" />
        Inicio
      </Link>
      {hydrated && today ? (
        <Competitions today={today} />
      ) : (
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="h-9 w-40 animate-pulse rounded-lg bg-surface" />
          <div className="h-28 animate-pulse rounded-2xl bg-surface" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface" />
        </div>
      )}
    </div>
  );
}

function Competitions({ today }: { today: DayKey }) {
  const competitions = useCompetitions((state) => state.competitions);
  const add = useCompetitions((state) => state.add);
  const update = useCompetitions((state) => state.update);
  const remove = useCompetitions((state) => state.remove);

  const [view, setView] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState<DayKey | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Competition | null>(null);

  const next = upcoming(competitions, today);
  const first = next[0];
  const onSelected = selected ? competitionsOn(competitions, selected) : [];

  const card = (competition: Competition) => (
    <CompetitionCard
      key={competition.id}
      competition={competition}
      today={today}
      onEdit={() => setEditing({ mode: "edit", competition })}
      onDelete={() => setDeleting(competition)}
    />
  );

  const save = (draft: CompetitionDraft) => {
    if (editing?.mode === "edit") update(editing.competition.id, draft);
    else add(draft);
    // Show the month of what was just saved.
    setView({ year: Number(draft.startDate.slice(0, 4)), month: Number(draft.startDate.slice(5, 7)) - 1 });
    setSelected(draft.startDate);
    setEditing(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Concursos</h1>
          <p className="text-sm text-muted">Tu calendario de concursos. Se guarda solo en este dispositivo.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ mode: "add", startDate: selected && selected >= today ? selected : "" })}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover active:scale-[0.98]"
        >
          + Añadir concurso
        </button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
        {first ? (
          <div className="relative flex flex-col gap-1">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">Siguiente concurso</p>
            <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{countdownLabel(first, today)}</p>
            <p className="text-sm text-muted">
              <span className="font-medium text-foreground">{first.name}</span> · {shortRange(first, today)}
              {first.place ? ` · ${first.place}` : ""}
            </p>
          </div>
        ) : (
          <div className="relative flex flex-col gap-1">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">Siguiente concurso</p>
            <p className="text-lg font-semibold text-foreground">No tienes concursos próximos</p>
            <p className="text-sm text-muted">Añade el próximo al que vayas y aquí verás cuántos días faltan.</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <MonthCalendar
            year={view.year}
            month={view.month}
            today={today}
            selected={selected}
            competitions={competitions}
            onMonthChange={(year, month) => setView({ year, month })}
            onSelect={(day) => setSelected(day === selected ? null : day)}
          />
          {selected ? (
            <section className="flex flex-col gap-3" aria-label="Concursos del día elegido">
              <h2 className="text-sm font-semibold text-foreground first-letter:uppercase">{longDate(selected)}</h2>
              {onSelected.length ? (
                onSelected.map(card)
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-border p-4">
                  <p className="text-sm text-muted">Ningún concurso este día.</p>
                  <button
                    type="button"
                    onClick={() => setEditing({ mode: "add", startDate: selected })}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
                  >
                    Añadir este día
                  </button>
                </div>
              )}
            </section>
          ) : null}
        </div>

        <section className="flex flex-col gap-3" aria-label="Próximos concursos">
          <h2 className="text-lg font-semibold text-foreground">
            Próximos <span className="text-sm font-normal text-muted">({next.length})</span>
          </h2>
          {next.length ? (
            next.map(card)
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
              No hay concursos próximos. Los que ya han pasado siguen en el calendario.
            </p>
          )}
        </section>
      </div>

      {editing ? (
        <Modal title={editing.mode === "add" ? "Añadir concurso" : "Editar concurso"} onClose={() => setEditing(null)}>
          <CompetitionForm
            initial={editing.mode === "add" ? emptyDraft(editing.startDate) : draftOf(editing.competition)}
            submitLabel={editing.mode === "add" ? "Añadir" : "Guardar"}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      ) : null}

      {deleting ? (
        <Modal title="Borrar concurso" onClose={() => setDeleting(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              ¿Seguro que quieres borrar <span className="font-semibold text-foreground">{deleting.name}</span>? No se puede
              deshacer.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  remove(deleting.id);
                  setDeleting(null);
                }}
                className="rounded-xl bg-cube-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-cube-red/90"
              >
                Borrar
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
