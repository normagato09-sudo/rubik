/** A day as "YYYY-MM-DD", the value of an `<input type="date">`. */
export type DayKey = string;

/**
 * The categories you can take part in. Add more here (e.g. 4×4) and they
 * show up in the form; saved competitions keep the ids they already have.
 */
export const COMPETITION_EVENTS = [
  { id: "333", label: "3×3" },
  { id: "222", label: "2×2" },
  { id: "pyram", label: "Pyraminx" },
] as const;

export type CompetitionEventId = string;

export interface Competition {
  id: string;
  name: string;
  /** First day. */
  startDate: DayKey;
  /** Last day, only when it lasts more than one day. */
  endDate?: DayKey;
  place: string;
  /** "HH:MM", optional. */
  startTime?: string;
  registrationDeadline?: DayKey;
  events: CompetitionEventId[];
  registered: boolean;
  notes: string;
}

/** What the form edits: a competition without its id. */
export type CompetitionDraft = Omit<Competition, "id">;

export function eventLabel(id: CompetitionEventId): string {
  return COMPETITION_EVENTS.find((event) => event.id === id)?.label ?? id;
}
