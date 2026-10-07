import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek, diffDays, formatDate, isMonday, parseDate } from "./dates";

describe("dates", () => {
  it("разбирает и форматирует дату без сдвига часового пояса", () => {
    expect(formatDate(parseDate("2026-10-12"))).toBe("2026-10-12");
  });

  it("отклоняет несуществующие даты", () => {
    expect(() => parseDate("2026-02-30")).toThrow();
    expect(() => parseDate("12.10.2026")).toThrow();
  });

  it("прибавляет дни через границу месяца и года", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-10-12", -1)).toBe("2026-10-11");
  });

  it("считает разницу в днях, в том числе через переход на зимнее время", () => {
    expect(diffDays("2026-10-07", "2026-10-12")).toBe(5);
    expect(diffDays("2026-10-12", "2026-10-07")).toBe(-5);
    expect(diffDays("2026-10-20", "2026-11-05")).toBe(16);
  });

  it("определяет день недели: 1 понедельник, 7 воскресенье", () => {
    expect(dayOfWeek("2026-10-12")).toBe(1);
    expect(dayOfWeek("2026-10-18")).toBe(7);
    expect(isMonday("2026-10-12")).toBe(true);
    expect(isMonday("2026-10-13")).toBe(false);
  });
});
