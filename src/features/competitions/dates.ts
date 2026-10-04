import type { Competition, CompetitionDraft, DayKey } from "./types";

/**
 * Day arithmetic on "YYYY-MM-DD" keys, done in UTC so daylight saving
 * never makes a day 23 or 25 hours long. Everything here is pure: the
 * screen passes `today` in, and the tests pass any day they like.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDayKey(value: unknown): value is DayKey {
  if (typeof value !== "string") return false;
  const match = DAY_KEY.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return toDayKeyUTC(date) === value;
}

const toUTC = (day: DayKey) => {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

const pad = (n: number) => String(n).padStart(2, "0");

function toDayKeyUTC(date: Date): DayKey {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The local calendar day of `date` (what the phone shows as today). */
export function localDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(day: DayKey, days: number): DayKey {
  return toDayKeyUTC(new Date(toUTC(day) + days * DAY_MS));
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY_MS);
}

export const lastDay = (competition: Pick<Competition, "startDate" | "endDate">): DayKey =>
  competition.endDate && competition.endDate > competition.startDate ? competition.endDate : competition.startDate;

/** Every day the competition lasts, first to last. */
export function competitionDays(competition: Pick<Competition, "startDate" | "endDate">): DayKey[] {
  const days: DayKey[] = [];
  for (let day = competition.startDate; day <= lastDay(competition); day = addDays(day, 1)) days.push(day);
  return days;
}

/** Over once its last day has gone by. */
export const isPast = (competition: Competition, today: DayKey) => lastDay(competition) < today;

export const isOnDay = (competition: Competition, day: DayKey) =>
  competition.startDate <= day && day <= lastDay(competition);

const byDate = (a: Competition, b: Competition) =>
  a.startDate.localeCompare(b.startDate) || (a.startTime ?? "").localeCompare(b.startTime ?? "") || a.name.localeCompare(b.name);

/** Próximos: not over yet (today's and ongoing ones count), soonest first. */
export function upcoming(competitions: Competition[], today: DayKey): Competition[] {
  return competitions.filter((competition) => !isPast(competition, today)).sort(byDate);
}

export function competitionsOn(competitions: Competition[], day: DayKey): Competition[] {
  return competitions.filter((competition) => isOnDay(competition, day)).sort(byDate);
}

/** "Es hoy", "Es mañana", "Faltan 12 días", or "En curso" for a multi-day one already started. */
export function countdownLabel(competition: Competition, today: DayKey): string {
  const days = daysBetween(today, competition.startDate);
  if (days > 1) return `Faltan ${days} días`;
  if (days === 1) return "Es mañana";
  if (days === 0) return "Es hoy";
  return "En curso";
}

export type RegistrationWarning = { kind: "soon"; days: number } | { kind: "closed" };

/** Days before the deadline when the warning starts. */
export const REGISTRATION_WARNING_DAYS = 7;

/**
 * A warning when you are not registered yet and the deadline is close
 * (7 days or fewer, today included) or already gone. Nothing for
 * competitions that are over, or with no deadline.
 */
export function registrationWarning(competition: Competition, today: DayKey): RegistrationWarning | null {
  if (competition.registered || !competition.registrationDeadline || isPast(competition, today)) return null;
  const days = daysBetween(today, competition.registrationDeadline);
  if (days < 0) return { kind: "closed" };
  if (days <= REGISTRATION_WARNING_DAYS) return { kind: "soon", days };
  return null;
}

export function registrationWarningText(warning: RegistrationWarning): string {
  if (warning.kind === "closed") return "Plazo de inscripción cerrado y no estás inscrito";
  if (warning.days === 0) return "¡La inscripción cierra hoy y aún no estás inscrito!";
  if (warning.days === 1) return "La inscripción cierra mañana y aún no estás inscrito";
  return `La inscripción cierra en ${warning.days} días y aún no estás inscrito`;
}

export interface CalendarDay {
  day: DayKey;
  inMonth: boolean;
}

/**
 * The weeks of a month for the calendar, Monday first: whole weeks, so
 * the first and last may include days of the months around it.
 */
export function monthGrid(year: number, month: number): CalendarDay[][] {
  const first = `${year}-${pad(month + 1)}-01`;
  const weekday = (new Date(toUTC(first)).getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weeks: CalendarDay[][] = [];
  let day = addDays(first, -weekday);
  const cells = Math.ceil((weekday + daysInMonth) / 7) * 7;
  for (let i = 0; i < cells; i++) {
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({ day, inMonth: day.startsWith(first.slice(0, 8)) });
    day = addDays(day, 1);
  }
  return weeks;
}

export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** "sábado 14 de noviembre de 2026". */
export function longDate(day: DayKey): string {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = (new Date(toUTC(day)).getUTCDay() + 6) % 7;
  return `${WEEKDAY_NAMES[weekday]} ${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** "14 nov" or "14–15 nov" or "31 oct – 1 nov", with the year when it is not `today`'s. */
export function shortRange(competition: Pick<Competition, "startDate" | "endDate">, today: DayKey): string {
  const part = (day: DayKey) => {
    const [, m, d] = day.split("-").map(Number);
    return { d, m: MONTHS[m - 1].slice(0, 3) };
  };
  const start = part(competition.startDate);
  const endDay = lastDay(competition);
  const end = part(endDay);
  const year = endDay.slice(0, 4) !== today.slice(0, 4) ? ` ${endDay.slice(0, 4)}` : "";
  if (endDay === competition.startDate) return `${start.d} ${start.m}${year}`;
  if (start.m === end.m) return `${start.d}–${end.d} ${end.m}${year}`;
  return `${start.d} ${start.m} – ${end.d} ${end.m}${year}`;
}

export type DraftErrors = Partial<Record<"name" | "startDate" | "endDate" | "registrationDeadline", string>>;

export function validateDraft(draft: CompetitionDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.name.trim() === "") errors.name = "Ponle un nombre.";
  if (!isDayKey(draft.startDate)) errors.startDate = "Elige la fecha.";
  if (draft.endDate !== undefined) {
    if (!isDayKey(draft.endDate)) errors.endDate = "Elige el último día.";
    else if (isDayKey(draft.startDate) && draft.endDate <= draft.startDate)
      errors.endDate = "El último día tiene que ser después del primero.";
  }
  if (draft.registrationDeadline !== undefined && !isDayKey(draft.registrationDeadline))
    errors.registrationDeadline = "Elige una fecha válida.";
  return errors;
}
