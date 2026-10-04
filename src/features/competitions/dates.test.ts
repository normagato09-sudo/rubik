import { describe, expect, it } from "vitest";
import {
  addDays,
  competitionDays,
  competitionsOn,
  countdownLabel,
  daysBetween,
  isDayKey,
  isPast,
  localDayKey,
  longDate,
  monthGrid,
  registrationWarning,
  registrationWarningText,
  shortRange,
  upcoming,
  validateDraft,
} from "./dates";
import type { Competition } from "./types";

const TODAY = "2026-10-04"; // a Sunday

const comp = (overrides: Partial<Competition>): Competition => ({
  id: overrides.name ?? "c",
  name: "Open",
  startDate: "2026-10-20",
  place: "",
  events: [],
  registered: false,
  notes: "",
  ...overrides,
});

describe("day arithmetic", () => {
  it("adds days across months, years and the daylight-saving change", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2); // DST ends on the 25th in Spain
    expect(daysBetween("2026-10-04", "2026-10-01")).toBe(-3);
  });

  it("knows a real day from anything else", () => {
    expect(isDayKey("2026-02-28")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-2-3")).toBe(false);
    expect(isDayKey("")).toBe(false);
    expect(isDayKey(undefined)).toBe(false);
  });

  it("takes today from the device's local calendar", () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("writes days in Spanish", () => {
    expect(longDate("2026-10-04")).toBe("domingo 4 de octubre de 2026");
    expect(shortRange(comp({ startDate: "2026-11-14" }), TODAY)).toBe("14 nov");
    expect(shortRange(comp({ startDate: "2026-11-14", endDate: "2026-11-15" }), TODAY)).toBe("14–15 nov");
    expect(shortRange(comp({ startDate: "2026-10-31", endDate: "2026-11-01" }), TODAY)).toBe("31 oct – 1 nov");
    expect(shortRange(comp({ startDate: "2027-01-09" }), TODAY)).toBe("9 ene 2027");
  });
});

describe("the month calendar", () => {
  it("starts weeks on Monday and fills whole weeks", () => {
    // October 2026 starts on a Thursday and ends on a Saturday.
    const weeks = monthGrid(2026, 9);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0]).toEqual({ day: "2026-09-28", inMonth: false });
    expect(weeks[0][3]).toEqual({ day: "2026-10-01", inMonth: true });
    expect(weeks[4][6]).toEqual({ day: "2026-11-01", inMonth: false });
    expect(weeks.flat().filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("handles a month that starts on Monday, and February", () => {
    const june = monthGrid(2026, 5); // 1 June 2026 is a Monday
    expect(june[0][0]).toEqual({ day: "2026-06-01", inMonth: true });
    const feb = monthGrid(2027, 1); // 1 Feb 2027 is a Monday, 28 days
    expect(feb).toHaveLength(4);
  });

  it("marks every day of a multi-day competition", () => {
    const weekend = comp({ startDate: "2026-10-31", endDate: "2026-11-01" });
    expect(competitionDays(weekend)).toEqual(["2026-10-31", "2026-11-01"]);
    expect(competitionsOn([weekend], "2026-11-01")).toEqual([weekend]);
    expect(competitionsOn([weekend], "2026-11-02")).toEqual([]);
  });
});

describe("Próximos and the countdown", () => {
  const past = comp({ name: "Pasado", startDate: "2026-09-12" });
  const ongoing = comp({ name: "En curso", startDate: "2026-10-03", endDate: "2026-10-05" });
  const later = comp({ name: "Luego", startDate: "2026-12-01" });
  const soon = comp({ name: "Pronto", startDate: "2026-10-10" });

  it("leaves out the ones that are over, and sorts the rest by date", () => {
    expect(isPast(past, TODAY)).toBe(true);
    expect(isPast(ongoing, TODAY)).toBe(false);
    expect(upcoming([later, past, soon, ongoing], TODAY).map((c) => c.name)).toEqual(["En curso", "Pronto", "Luego"]);
  });

  it("a competition today is still upcoming until the day is over", () => {
    expect(upcoming([comp({ startDate: TODAY })], TODAY)).toHaveLength(1);
    expect(upcoming([comp({ startDate: TODAY })], "2026-10-05")).toHaveLength(0);
  });

  it("orders same-day competitions by start time", () => {
    const morning = comp({ name: "Mañana", startDate: "2026-10-10", startTime: "09:00" });
    const evening = comp({ name: "Tarde", startDate: "2026-10-10", startTime: "17:30" });
    expect(upcoming([evening, morning], TODAY).map((c) => c.name)).toEqual(["Mañana", "Tarde"]);
  });

  it("says how many days are left", () => {
    expect(countdownLabel(soon, TODAY)).toBe("Faltan 6 días");
    expect(countdownLabel(comp({ startDate: "2026-10-05" }), TODAY)).toBe("Es mañana");
    expect(countdownLabel(comp({ startDate: TODAY }), TODAY)).toBe("Es hoy");
    expect(countdownLabel(ongoing, TODAY)).toBe("En curso");
  });
});

describe("the registration warning", () => {
  const withDeadline = (deadline: string, extra: Partial<Competition> = {}) =>
    comp({ registrationDeadline: deadline, ...extra });

  it("warns 7 days or fewer before the deadline when not registered", () => {
    expect(registrationWarning(withDeadline("2026-10-12"), TODAY)).toBeNull(); // 8 days
    expect(registrationWarning(withDeadline("2026-10-11"), TODAY)).toEqual({ kind: "soon", days: 7 });
    expect(registrationWarning(withDeadline("2026-10-05"), TODAY)).toEqual({ kind: "soon", days: 1 });
    expect(registrationWarning(withDeadline(TODAY), TODAY)).toEqual({ kind: "soon", days: 0 });
  });

  it("says the deadline is gone once it has passed", () => {
    expect(registrationWarning(withDeadline("2026-10-01"), TODAY)).toEqual({ kind: "closed" });
  });

  it("is quiet when registered, with no deadline, or once the competition is over", () => {
    expect(registrationWarning(withDeadline("2026-10-05", { registered: true }), TODAY)).toBeNull();
    expect(registrationWarning(comp({}), TODAY)).toBeNull();
    expect(registrationWarning(withDeadline("2026-09-01", { startDate: "2026-09-10" }), TODAY)).toBeNull();
  });

  it("reads well", () => {
    expect(registrationWarningText({ kind: "soon", days: 0 })).toContain("cierra hoy");
    expect(registrationWarningText({ kind: "soon", days: 1 })).toContain("cierra mañana");
    expect(registrationWarningText({ kind: "soon", days: 5 })).toContain("cierra en 5 días");
    expect(registrationWarningText({ kind: "closed" })).toContain("cerrado");
  });
});

describe("validating the form", () => {
  const draft = { name: "Open", startDate: "2026-10-20", place: "", events: [], registered: false, notes: "" };

  it("accepts a name and a date", () => {
    expect(validateDraft(draft)).toEqual({});
  });

  it("needs a name and a valid date", () => {
    expect(validateDraft({ ...draft, name: "  ", startDate: "" })).toEqual({
      name: expect.any(String),
      startDate: expect.any(String),
    });
  });

  it("needs the last day after the first one", () => {
    expect(validateDraft({ ...draft, endDate: "2026-10-21" })).toEqual({});
    expect(validateDraft({ ...draft, endDate: "2026-10-20" }).endDate).toBeDefined();
    expect(validateDraft({ ...draft, endDate: "2026-10-19" }).endDate).toBeDefined();
    expect(validateDraft({ ...draft, endDate: "" }).endDate).toBeDefined();
  });

  it("checks the deadline is a real day", () => {
    expect(validateDraft({ ...draft, registrationDeadline: "2026-10-10" })).toEqual({});
    expect(validateDraft({ ...draft, registrationDeadline: "nope" }).registrationDeadline).toBeDefined();
  });
});
