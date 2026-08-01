import { describe, expect, it } from "vitest";
import { adToBsDate, bsToAdDate, daysInBsMonth, formatBsDate, isAdDateInRange } from "./nepali-date";

describe("Nepali calendar conversion", () => {
  it("converts between AD and BS without changing the day", () => {
    expect(bsToAdDate({ year: 2083, month: 0, day: 1 })).toBe("2026-04-14");
    expect(adToBsDate("2026-04-14")).toEqual({ year: 2083, month: 0, day: 1 });
  });

  it("formats BS dates using English numerals", () => {
    expect(formatBsDate({ year: 2082, month: 3, day: 1 })).toBe("2082-04-01");
  });

  it("uses the configured BS month length and enforces AD bounds", () => {
    expect(daysInBsMonth(2083, 0)).toBeGreaterThanOrEqual(30);
    expect(isAdDateInRange("2026-04-13", "2026-04-01", "2026-04-30")).toBe(true);
    expect(isAdDateInRange("2026-05-01", undefined, "2026-04-30")).toBe(false);
  });
});
