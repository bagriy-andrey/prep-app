import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { isInQueue, itemStatus, reviewInfo } from "./review";
import type { Attempt, Outcome } from "./userState";

const rules = plan.rules.review;
const a = (date: string, outcome: Outcome): Attempt => ({ date, outcome });

describe("reviewInfo", () => {
  it("без попыток повторения нет", () => {
    expect(reviewInfo([], rules)).toBeNull();
  });

  it("failed: через 1 день, решить заново", () => {
    expect(reviewInfo([a("2026-10-12", "failed")], rules)).toEqual({
      closed: false,
      dueDate: "2026-10-13",
      method: "redo",
      cleanCount: 0,
    });
  });

  it("hint: через 3 дня, решить заново", () => {
    expect(reviewInfo([a("2026-10-12", "hint")], rules)).toMatchObject({
      dueDate: "2026-10-15",
      method: "redo",
    });
  });

  it("первый clean: через 7 дней, устно", () => {
    expect(reviewInfo([a("2026-10-12", "clean")], rules)).toEqual({
      closed: false,
      dueDate: "2026-10-19",
      method: "oral",
      cleanCount: 1,
    });
  });

  it("второй clean: через 21 день", () => {
    const info = reviewInfo([a("2026-10-12", "clean"), a("2026-10-19", "clean")], rules);
    expect(info).toMatchObject({ dueDate: "2026-11-09", method: "oral", cleanCount: 2 });
  });

  it("третий clean закрывает задачу", () => {
    const attempts = [a("2026-10-12", "clean"), a("2026-10-19", "clean"), a("2026-11-09", "clean")];
    expect(reviewInfo(attempts, rules)).toEqual({ closed: true, cleanCount: 3 });
  });

  it("cleanCount считается за всё время, а не подряд", () => {
    const attempts = [
      a("2026-10-12", "clean"),
      a("2026-10-19", "failed"),
      a("2026-10-20", "clean"),
      a("2026-10-27", "hint"),
      a("2026-10-30", "clean"),
    ];
    expect(reviewInfo(attempts, rules)).toEqual({ closed: true, cleanCount: 3 });
  });

  it("после неудачи закрытая было задача снова возвращается в повторения", () => {
    const attempts = [
      a("2026-10-12", "clean"),
      a("2026-10-19", "clean"),
      a("2026-11-09", "clean"),
      a("2026-12-01", "failed"),
    ];
    expect(reviewInfo(attempts, rules)).toMatchObject({ closed: false, dueDate: "2026-12-02", method: "redo" });
  });

  it("способ устный только если последний исход clean", () => {
    const attempts = [a("2026-10-12", "clean"), a("2026-10-19", "hint")];
    expect(reviewInfo(attempts, rules)).toMatchObject({ method: "redo", cleanCount: 1 });
  });

  it("берёт числа из rules, а не из кода", () => {
    const custom = { ...rules, failed: 2, cleanFirst: 10 };
    expect(reviewInfo([a("2026-10-12", "failed")], custom)).toMatchObject({ dueDate: "2026-10-14" });
    expect(reviewInfo([a("2026-10-12", "clean")], custom)).toMatchObject({ dueDate: "2026-10-22" });
  });

  it("не считает oral, если правило отключено", () => {
    const custom = { ...rules, oralIfLastClean: false };
    expect(reviewInfo([a("2026-10-12", "clean")], custom)).toMatchObject({ method: "redo" });
  });
});

describe("очередь и статус", () => {
  const attempts = [a("2026-10-12", "clean")]; // повторение 2026-10-19

  it("задача попадает в очередь в день повторения и позже", () => {
    expect(isInQueue(attempts, rules, "2026-10-18")).toBe(false);
    expect(isInQueue(attempts, rules, "2026-10-19")).toBe(true);
    expect(isInQueue(attempts, rules, "2026-10-25")).toBe(true);
  });

  it("закрытая задача и задача без попыток не в очереди", () => {
    const closed = [a("2026-10-12", "clean"), a("2026-10-19", "clean"), a("2026-11-09", "clean")];
    expect(isInQueue(closed, rules, "2027-01-01")).toBe(false);
    expect(isInQueue([], rules, "2027-01-01")).toBe(false);
  });

  it("статус задачи", () => {
    expect(itemStatus([], rules, "2026-10-19")).toBe("not-started");
    expect(itemStatus(attempts, rules, "2026-10-18")).toBe("in-progress");
    expect(itemStatus(attempts, rules, "2026-10-19")).toBe("due");
    const closed = [a("2026-10-12", "clean"), a("2026-10-19", "clean"), a("2026-11-09", "clean")];
    expect(itemStatus(closed, rules, "2026-11-10")).toBe("closed");
  });

  it("задача, решённая неделю назад чисто, появляется в очереди с устным способом", () => {
    const today = "2026-10-19";
    expect(isInQueue([a("2026-10-12", "clean")], rules, today)).toBe(true);
    expect(reviewInfo([a("2026-10-12", "clean")], rules)).toMatchObject({ method: "oral" });
  });
});
