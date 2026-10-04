"use client";

import { ChevronRightIcon } from "@/components/ui/icons";
import { MONTHS, WEEKDAYS, competitionsOn, isPast, longDate, monthGrid, type CalendarDay } from "../dates";
import type { Competition, DayKey } from "../types";

/**
 * A month, Monday first. Days with a competition get a dot (orange if it
 * is still to come, grey if it is over); multi-day ones mark every day.
 */
export function MonthCalendar({
  year,
  month,
  today,
  selected,
  competitions,
  onMonthChange,
  onSelect,
}: {
  year: number;
  month: number;
  today: DayKey;
  selected: DayKey | null;
  competitions: Competition[];
  onMonthChange: (year: number, month: number) => void;
  onSelect: (day: DayKey) => void;
}) {
  const move = (delta: number) => {
    const index = year * 12 + month + delta;
    onMonthChange(Math.floor(index / 12), index % 12);
  };
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const showingToday = year === todayYear && month === todayMonth - 1;

  const cell = ({ day, inMonth }: CalendarDay) => {
    const here = competitionsOn(competitions, day);
    const upcoming = here.some((competition) => !isPast(competition, today));
    const isToday = day === today;
    const isSelected = day === selected;
    const label = `${longDate(day)}${here.length ? `: ${here.map((c) => c.name).join(", ")}` : ""}`;
    return (
      <button
        key={day}
        type="button"
        onClick={() => onSelect(day)}
        aria-label={label}
        aria-pressed={isSelected}
        className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors sm:text-base ${
          isSelected
            ? "bg-accent text-accent-foreground font-semibold"
            : here.length
              ? upcoming
                ? "bg-accent-soft font-semibold text-foreground hover:bg-accent/25"
                : "bg-surface-3/60 text-muted hover:bg-surface-3"
              : inMonth
                ? "text-foreground hover:bg-surface-2"
                : "text-muted/40 hover:bg-surface-2"
        } ${isToday && !isSelected ? "ring-2 ring-inset ring-accent/70" : ""} ${!inMonth && here.length && !isSelected ? "opacity-60" : ""}`}
      >
        {Number(day.slice(8))}
        {here.length ? (
          <span
            aria-hidden="true"
            className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-accent-foreground" : upcoming ? "bg-accent" : "bg-muted"}`}
          />
        ) : null}
      </button>
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="Mes anterior"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground capitalize sm:text-lg" aria-live="polite">
            {MONTHS[month]} {year}
          </h2>
          {!showingToday ? (
            <button
              type="button"
              onClick={() => onMonthChange(todayYear, todayMonth - 1)}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted hover:text-foreground"
            >
              Hoy
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Mes siguiente"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {monthGrid(year, month).map((week) => (
          <div key={week[0].day} className="grid grid-cols-7 gap-1">
            {week.map(cell)}
          </div>
        ))}
      </div>
    </section>
  );
}
