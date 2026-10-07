import { describe, expect, it } from "vitest";
import { formatDateRange, plural } from "./format";

describe("formatDateRange", () => {
  it("в пределах месяца: день начала, дефис, полная дата конца", () => {
    expect(formatDateRange("2026-10-12", "2026-10-18")).toBe("12–18 октября");
  });

  it("через границу месяца и года показывает обе даты", () => {
    expect(formatDateRange("2026-10-26", "2026-11-01")).toBe("26 октября – 1 ноября");
    expect(formatDateRange("2026-12-28", "2027-01-03")).toBe("28 декабря – 3 января");
  });
});

describe("plural", () => {
  it("склоняет числительные", () => {
    expect([1, 2, 5, 11, 12, 21, 22, 25].map((n) => plural(n, ["день", "дня", "дней"]))).toEqual([
      "день", "дня", "дней", "дней", "дней", "день", "дня", "дней",
    ]);
  });
});
