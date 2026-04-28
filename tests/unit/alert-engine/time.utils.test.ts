import { doTimesOverlap, getWeekBounds, isWithinOfficeHours, timeToMinutes } from "../../../src/shared/utils/time.utils";

describe("timeToMinutes", () => {
  it("converts 00:00 to 0", () => expect(timeToMinutes("00:00")).toBe(0));
  it("converts 08:30 to 510", () => expect(timeToMinutes("08:30")).toBe(510));
  it("converts 23:59 to 1439", () => expect(timeToMinutes("23:59")).toBe(1439));
});

describe("doTimesOverlap", () => {
  it("detects overlap when ranges intersect", () => {
    expect(doTimesOverlap("09:00", "11:00", "10:00", "12:00")).toBe(true);
  });

  it("detects overlap when one range contains the other", () => {
    expect(doTimesOverlap("08:00", "18:00", "09:00", "11:00")).toBe(true);
  });

  it("returns false when ranges are adjacent (no gap, no overlap)", () => {
    // End of first == start of second → no overlap (exclusive end)
    expect(doTimesOverlap("09:00", "11:00", "11:00", "13:00")).toBe(false);
  });

  it("returns false when first range ends before second starts", () => {
    expect(doTimesOverlap("08:00", "10:00", "11:00", "13:00")).toBe(false);
  });

  it("returns false when ranges are completely separate", () => {
    expect(doTimesOverlap("08:00", "09:00", "14:00", "16:00")).toBe(false);
  });
});

describe("getWeekBounds", () => {
  it("returns Monday as week start for a Wednesday input", () => {
    const date = new Date("2025-12-03"); // Wednesday
    const { weekStart, weekEnd } = getWeekBounds(date);
    expect(weekStart.toISOString().startsWith("2025-12-01")).toBe(true); // Monday
    expect(weekEnd.toISOString().startsWith("2025-12-08")).toBe(true);   // next Monday
  });

  it("returns same Monday for a Sunday input (ISO week, Sunday is end)", () => {
    const date = new Date("2025-11-30"); // Sunday
    const { weekStart } = getWeekBounds(date);
    expect(weekStart.toISOString().startsWith("2025-11-24")).toBe(true); // preceding Monday
  });
});

describe("isWithinOfficeHours", () => {
  const timezone = "America/Panama";

  it("returns true when current local time is within office hours", () => {
    // 10:00 AM Panama time → within 08:00–18:00
    const utc = new Date("2025-12-01T15:00:00Z"); // UTC 15 = Panama 10 (UTC-5)
    expect(isWithinOfficeHours(utc, "08:00", "18:00", timezone)).toBe(true);
  });

  it("returns false when current local time is before opening", () => {
    const utc = new Date("2025-12-01T12:00:00Z"); // UTC 12 = Panama 07 (before 08:00)
    expect(isWithinOfficeHours(utc, "08:00", "18:00", timezone)).toBe(false);
  });

  it("returns false when current local time is after closing", () => {
    const utc = new Date("2025-12-02T00:00:00Z"); // UTC 00 = Panama 19 (after 18:00)
    expect(isWithinOfficeHours(utc, "08:00", "18:00", timezone)).toBe(false);
  });
});
