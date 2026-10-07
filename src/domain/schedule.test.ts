import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { dayDate, defaultWeekNumber, locateDate, resolveToday, weekRange } from "./schedule";

const start = plan.meta.startDate;

describe("schedule", () => {
  it("считает дату дня по формуле startDate + (n - 1) * 7 + offset", () => {
    expect(dayDate(start, 1, 0)).toBe(start);
    expect(dayDate(start, 2, 3)).toBe("2026-10-22");
  });

  it("до старта возвращает обратный отсчёт", () => {
    expect(resolveToday(plan, "2026-10-07")).toEqual({ kind: "before", daysLeft: 5 });
  });

  it("в день старта возвращает понедельник первой недели", () => {
    const pos = resolveToday(plan, start);
    expect(pos.kind).toBe("in");
    if (pos.kind === "in") {
      expect(pos.week.n).toBe(1);
      expect(pos.day.dow).toBe(1);
    }
  });

  it("в последний день плана возвращает воскресенье недели 16", () => {
    const pos = resolveToday(plan, dayDate(start, 16, 6));
    expect(pos.kind).toBe("in");
    if (pos.kind === "in") {
      expect(pos.week.n).toBe(16);
      expect(pos.day.dow).toBe(7);
    }
  });

  it("после плана возвращает день из maintenanceWeek или undefined", () => {
    const monday = resolveToday(plan, dayDate(start, 17, 0));
    expect(monday.kind).toBe("after");
    if (monday.kind === "after") expect(monday.day?.dow).toBe(1);

    const tuesday = resolveToday(plan, dayDate(start, 17, 1));
    if (tuesday.kind === "after") expect(tuesday.day).toBeUndefined();
  });

  it("учитывает переопределённую дату старта", () => {
    const pos = resolveToday(plan, "2026-10-19", "2026-10-19");
    expect(pos.kind).toBe("in");
  });

  it("выбирает неделю по умолчанию для плана", () => {
    expect(defaultWeekNumber(plan, "2026-10-07")).toBe(1);
    expect(defaultWeekNumber(plan, dayDate(start, 5, 2))).toBe(5);
    expect(defaultWeekNumber(plan, dayDate(start, 20, 0))).toBe(16);
  });

  it("находит неделю и сдвиг по дате, вне плана возвращает null", () => {
    expect(locateDate(plan, dayDate(start, 3, 4))).toEqual({ week: 3, offset: 4 });
    expect(locateDate(plan, "2026-10-11")).toBeNull();
    expect(locateDate(plan, dayDate(start, 17, 0))).toBeNull();
  });
});

describe("weekRange", () => {
  it("возвращает понедельник и воскресенье недели", () => {
    expect(weekRange(start, 1)).toEqual({ from: "2026-10-12", to: "2026-10-18" });
    expect(weekRange(start, 3)).toEqual({ from: "2026-10-26", to: "2026-11-01" });
  });
});
