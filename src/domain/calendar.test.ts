import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { dayStatus, hasLoadWarning, isLightDay, plannedDayAt, streak, type PlannedDay } from "./calendar";
import { dayDate } from "./schedule";
import { addAttempt, createInitialState, setSessionStatus, type UserState } from "./userState";

const start = plan.meta.startDate; // 2026-10-12, понедельник
const empty = createInitialState();
const day = (date: string) => plannedDayAt(plan, date, start)!;

/** Закрывает все обязательные сессии дня. */
function completeDay(state: UserState, d: PlannedDay, date = d.date): UserState {
  let next = state;
  for (const s of d.sessions.filter((x) => x.required)) {
    next = s.itemId ? addAttempt(next, s.itemId, "clean", date) : setSessionStatus(next, s.id, "done", date);
  }
  return next;
}
const manualId = (d: PlannedDay) => d.sessions.find((s) => !s.itemId && s.required)!.id;

describe("plannedDayAt", () => {
  it("до старта дня нет", () => {
    expect(plannedDayAt(plan, "2026-10-11", start)).toBeNull();
  });

  it("день плана без выходных сессий, пятница это выходной", () => {
    const monday = day("2026-10-12");
    expect(monday).toMatchObject({ week: 1, rest: false });
    expect(monday.sessions.map((s) => s.id)).toEqual(["w01-d1-s1", "w01-d1-s2", "w01-d1-s3"]);
    expect(day("2026-10-16")).toMatchObject({ week: 1, rest: true, sessions: [] });
  });

  it("необязательные сессии помечены, а не отброшены", () => {
    const saturday = day("2026-10-17");
    expect(saturday.sessions.at(-1)).toMatchObject({ id: "w01-d6-s4", required: false });
  });

  it("после недели 16 берёт дни maintenanceWeek с ключами m-<дата>-s<номер>", () => {
    const monday = dayDate(start, 17, 0);
    expect(plannedDayAt(plan, monday, start)).toMatchObject({
      week: null,
      rest: false,
      sessions: [{ id: `m-${monday}-s1`, required: true }],
    });
    expect(plannedDayAt(plan, dayDate(start, 17, 1), start)).toMatchObject({ rest: true });
  });
});

describe("dayStatus", () => {
  const today = "2026-10-14";

  it("выходной всегда выходной", () => {
    expect(dayStatus(day("2026-10-16"), empty, today)).toBe("rest");
    expect(dayStatus(day("2026-10-16"), empty, "2026-10-20")).toBe("rest");
  });

  it("будущий день и сегодняшний без отметок это «впереди»", () => {
    expect(dayStatus(day("2026-10-15"), empty, today)).toBe("future");
    expect(dayStatus(day(today), empty, today)).toBe("future");
  });

  it("прошедший день без отметок пропущен", () => {
    expect(dayStatus(day("2026-10-12"), empty, today)).toBe("missed");
  });

  it("частично: сделана часть обязательных сессий", () => {
    const state = setSessionStatus(empty, "w01-d1-s1", "done", today);
    expect(dayStatus(day("2026-10-12"), state, today)).toBe("partial");
  });

  it("всё сделано: все обязательные, необязательная не нужна", () => {
    const d = day("2026-10-17");
    const state = completeDay(empty, d);
    expect(state.sessions["w01-d6-s4"]).toBeUndefined();
    expect(dayStatus(d, state, "2026-10-18")).toBe("all");
  });

  it("лёгкий день: есть сессия со статусом light, даже если день не закрыт", () => {
    const d = day("2026-10-12");
    const state = setSessionStatus(empty, "w01-d1-s1", "light", today);
    expect(isLightDay(d, state)).toBe(true);
    expect(dayStatus(d, state, today)).toBe("light");
  });

  it("moved не делает день сделанным", () => {
    const state = setSessionStatus(empty, "w01-d1-s1", "moved", today);
    expect(dayStatus(day("2026-10-12"), state, today)).toBe("missed");
  });

  it("работа наперёд видна в будущем дне", () => {
    const d = day("2026-10-15");
    expect(dayStatus(d, completeDay(empty, d, today), today)).toBe("all");
  });
});

describe("streak", () => {
  const act = (...dates: string[]) =>
    dates.reduce((s, date) => addAttempt(s, "dsa-two-sum", "clean", date), empty);

  it("до старта и без активности стрик нулевой", () => {
    expect(streak(plan, empty, "2026-10-07", start)).toEqual({ current: 0, record: 0 });
    expect(streak(plan, empty, "2026-10-14", start)).toEqual({ current: 0, record: 0 });
  });

  it("считает подряд идущие плановые дни, включая сегодня", () => {
    expect(streak(plan, act("2026-10-12", "2026-10-13", "2026-10-14"), "2026-10-14", start)).toEqual({ current: 3, record: 3 });
  });

  it("сегодняшний день без активности стрик не прерывает", () => {
    expect(streak(plan, act("2026-10-12", "2026-10-13"), "2026-10-14", start)).toEqual({ current: 2, record: 2 });
  });

  it("пропущенный вчерашний день обнуляет текущий стрик, рекорд остаётся", () => {
    const state = act("2026-10-12", "2026-10-13");
    expect(streak(plan, state, "2026-10-15", start)).toEqual({ current: 0, record: 2 });
  });

  it("выходной не прерывает и не увеличивает стрик", () => {
    // пятница 16.10 это выходной
    const state = act("2026-10-15", "2026-10-17");
    expect(streak(plan, state, "2026-10-17", start)).toEqual({ current: 2, record: 2 });
  });

  it("активность в выходной стрик не увеличивает", () => {
    expect(streak(plan, act("2026-10-16"), "2026-10-17", start)).toEqual({ current: 0, record: 0 });
  });

  it("сессии done и light считаются активностью, moved нет", () => {
    let state = setSessionStatus(empty, "w01-d1-s1", "done", "2026-10-12");
    state = setSessionStatus(state, "w01-d3-s1", "moved", "2026-10-13");
    state = setSessionStatus(state, "w01-d4-s1", "light", "2026-10-14");
    expect(streak(plan, state, "2026-10-14", start)).toEqual({ current: 1, record: 1 });
  });

  it("рекорд помнит самую длинную серию", () => {
    const state = act("2026-10-12", "2026-10-13", "2026-10-14", "2026-10-17");
    expect(streak(plan, state, "2026-10-17", start)).toEqual({ current: 1, record: 3 });
  });

  it("после недели 16 стрик идёт по дням maintenanceWeek", () => {
    const mon = dayDate(start, 17, 0);
    const wed = dayDate(start, 17, 2); // вторник отдых по maintenanceWeek
    const state = act(mon, wed);
    expect(streak(plan, state, wed, start)).toMatchObject({ current: 2 });
  });
});

describe("hasLoadWarning (6.6)", () => {
  const today = "2026-10-25"; // воскресенье недели 2
  /** Отмечает лёгкими первые n плановых дней с ручной сессией в окне 12-25 октября. */
  function lightDays(n: number): UserState {
    let state = empty;
    let left = n;
    for (let i = 0; i < 14 && left > 0; i++) {
      const d = day(dayDate(start, Math.floor(i / 7) + 1, i % 7));
      if (d.rest || !d.sessions.some((s) => !s.itemId && s.required)) continue;
      state = setSessionStatus(state, manualId(d), "light", d.date);
      left--;
    }
    return state;
  }

  it("без лёгких дней предупреждения нет", () => {
    expect(hasLoadWarning(plan, empty, today, start)).toBe(false);
  });

  it("ровно половина плановых дней это ещё не больше половины", () => {
    // в окне 12 плановых дней (2 выходных из 14)
    expect(hasLoadWarning(plan, lightDays(6), today, start)).toBe(false);
  });

  it("больше половины плановых дней лёгкие: предупреждение", () => {
    expect(hasLoadWarning(plan, lightDays(7), today, start)).toBe(true);
  });

  it("старые лёгкие дни за окном не считаются", () => {
    expect(hasLoadWarning(plan, lightDays(10), "2026-11-20", start)).toBe(false);
  });
});
