import { describe, expect, it } from "vitest";
import {
  calculateAvailableMinutes,
  getDaysRemaining,
  getFeasibilityStatus,
} from "@/src/lib/feasibility";

describe("deadline and feasibility calculations", () => {
  const now = new Date("2026-07-28T08:00:00");

  it("counts the deadline day and scales available study time", () => {
    expect(getDaysRemaining("2026-08-03", now)).toBe(7);
    expect(calculateAvailableMinutes("2026-08-03", 2, 3, now)).toBe(360);
  });

  it("returns zero days for invalid or elapsed deadlines", () => {
    expect(getDaysRemaining("not-a-date", now)).toBe(0);
    expect(getDaysRemaining("2026-07-20", now)).toBe(0);
  });

  it("uses the documented feasibility thresholds", () => {
    expect(getFeasibilityStatus(750, 1_000)).toBe("comfortable");
    expect(getFeasibilityStatus(751, 1_000)).toBe("tight");
    expect(getFeasibilityStatus(1_100, 1_000)).toBe("tight");
    expect(getFeasibilityStatus(1_101, 1_000)).toBe("unrealistic");
    expect(getFeasibilityStatus(1, 0)).toBe("unrealistic");
  });
});
