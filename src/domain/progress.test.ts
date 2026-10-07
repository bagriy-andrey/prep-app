import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { countsTowardProgress, courseProgress, isManualSession, markableSessionIds, toPercent, isSessionDone, isWeekClosed, weekProgress, weekSessions } from "./progress";
import { completeWeek, DATE, emptyState } from "./testing";
import { addAttempt, addExtraTask, markUnmarked, setSessionStatus } from "./userState";

const week1 = plan.weeks[0];
const find = (pred: (s: (typeof week1.days)[0]["sessions"][0]) => boolean) => weekSessions(week1).find(pred)!;

describe("какие сессии учитываются", () => {
  it("необязательные и выходной не входят в подсчёт", () => {
    expect(countsTowardProgress(find((s) => s.optional === true))).toBe(false);
    expect(countsTowardProgress(find((s) => s.block === "rest"))).toBe(false);
    expect(countsTowardProgress(find((s) => s.block === "dsa" && !s.optional))).toBe(true);
  });

  it("в неделе 1: 17 обязательных сессий, 8 из них с задачей", () => {
    expect(weekProgress(week1, emptyState())).toEqual({ done: 0, total: 17, remaining: 17, closed: false });
    expect(weekSessions(week1).filter((s) => countsTowardProgress(s) && s.itemId)).toHaveLength(8);
  });
});

describe("отметка сессий (6.2)", () => {
  it("сессия с задачей сделана после первой попытки любого исхода", () => {
    const session = find((s) => !!s.itemId);
    expect(isSessionDone(session, emptyState())).toBe(false);
    for (const outcome of ["clean", "hint", "failed"] as const) {
      expect(isSessionDone(session, addAttempt(emptyState(), session.itemId!, outcome, DATE))).toBe(true);
    }
  });

  it("ручная отметка сессии с задачей не делает её сделанной", () => {
    const session = find((s) => !!s.itemId);
    expect(isSessionDone(session, setSessionStatus(emptyState(), session.id, "done", DATE))).toBe(false);
  });

  it("ручная сессия сделана при done и light, но не при moved", () => {
    const session = find((s) => isManualSession(s) && countsTowardProgress(s));
    const at = (status: "done" | "light" | "moved") =>
      isSessionDone(session, setSessionStatus(emptyState(), session.id, status, DATE));
    expect(at("done")).toBe(true);
    expect(at("light")).toBe(true);
    expect(at("moved")).toBe(false);
  });

  it("снятие отметки возвращает сессию в несделанные", () => {
    const session = find((s) => isManualSession(s) && countsTowardProgress(s));
    const marked = setSessionStatus(emptyState(), session.id, "done", DATE);
    expect(isSessionDone(session, setSessionStatus(marked, session.id, null, DATE))).toBe(false);
  });

  it("«Отметить день» трогает только ещё не отмеченные", () => {
    const [a, b] = weekSessions(week1).filter(isManualSession);
    const start = setSessionStatus(emptyState(), a.id, "light", "2026-10-13");
    const next = markUnmarked(start, [a.id, b.id], "done", DATE);
    expect(next.sessions[a.id]).toEqual({ status: "light", date: "2026-10-13" });
    expect(next.sessions[b.id]).toEqual({ status: "done", date: DATE });
  });
});

describe("закрытие недели (6.3)", () => {
  it("пустая неделя не закрыта", () => {
    expect(isWeekClosed(week1, emptyState())).toBe(false);
  });

  it("неделя закрывается, когда сделаны все обязательные сессии", () => {
    const state = completeWeek(emptyState(), 1);
    expect(weekProgress(week1, state)).toEqual({ done: 17, total: 17, remaining: 0, closed: true });
  });

  it("light закрывает неделю так же, как done", () => {
    expect(isWeekClosed(week1, completeWeek(emptyState(), 1, "light"))).toBe(true);
  });

  it("moved неделю не закрывает", () => {
    const state = completeWeek(emptyState(), 1, "moved");
    expect(isWeekClosed(week1, state)).toBe(false);
    const manual = weekSessions(week1).filter((s) => isManualSession(s) && countsTowardProgress(s));
    expect(weekProgress(week1, state).remaining).toBe(manual.length);
  });

  it("одна пропущенная сессия оставляет неделю открытой", () => {
    const state = completeWeek(emptyState(), 1);
    const dsa = find((s) => !!s.itemId);
    const without = { ...state, items: { ...state.items, [dsa.itemId!]: { attempts: [] } } };
    expect(isWeekClosed(week1, without)).toBe(false);
  });

  it("необязательные сессии на закрытие не влияют", () => {
    const state = completeWeek(emptyState(), 1);
    const optional = find((s) => s.optional === true);
    expect(state.sessions[optional.id]).toBeUndefined();
    expect(isWeekClosed(week1, state)).toBe(true);
  });
});

describe("markableSessionIds", () => {
  it("берёт только ручные сессии и пропускает выходной и сессии с задачей", () => {
    const rest = week1.days.find((d) => d.sessions.every((s) => s.block === "rest"))!;
    expect(markableSessionIds(rest.sessions)).toEqual([]);

    const day = week1.days[0];
    const ids = markableSessionIds(day.sessions);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(isManualSession(day.sessions.find((s) => s.id === id)!)).toBe(true);
  });
});

describe("toPercent", () => {
  it("округляет до целых и не делит на ноль", () => {
    expect(toPercent(0, 0)).toBe(0);
    expect(toPercent(0, 5)).toBe(0);
    expect(toPercent(1, 3)).toBe(33);
    expect(toPercent(2, 3)).toBe(67);
    expect(toPercent(5, 5)).toBe(100);
  });
});

describe("courseProgress", () => {
  const total = plan.weeks.reduce((sum, w) => sum + weekProgress(w, emptyState()).total, 0);

  it("пустой курс: ноль процентов, ни одной закрытой недели", () => {
    expect(courseProgress(plan, emptyState())).toEqual({ done: 0, total, percent: 0, closedWeeks: 0, weeks: 16 });
  });

  it("складывается из прогресса недель", () => {
    const state = completeWeek(completeWeek(emptyState(), 1), 2);
    const expected = weekProgress(plan.weeks[0], state).done + weekProgress(plan.weeks[1], state).done;
    const progress = courseProgress(plan, state);
    expect(progress).toMatchObject({ done: expected, total, closedWeeks: 2 });
    expect(progress.percent).toBe(toPercent(expected, total));
  });

  it("частично закрытая неделя входит долей, а не целиком", () => {
    const session = weekSessions(plan.weeks[0]).find((s) => isManualSession(s) && countsTowardProgress(s))!;
    const state = setSessionStatus(emptyState(), session.id, "done", DATE);
    expect(courseProgress(plan, state)).toMatchObject({ done: 1, closedWeeks: 0 });
  });

  it("все недели закрыты: сто процентов", () => {
    let state = emptyState();
    for (let n = 1; n <= 16; n++) state = completeWeek(state, n);
    expect(courseProgress(plan, state)).toMatchObject({ done: total, percent: 100, closedWeeks: 16 });
  });
});

describe("свои задачи и прогресс", () => {
  it("не меняют прогресс недели и курса", () => {
    const state = addExtraTask(emptyState(), { id: "t", date: "2026-10-14", title: "своя", topic: "js", done: true });
    expect(weekProgress(week1, state)).toEqual(weekProgress(week1, emptyState()));
    expect(courseProgress(plan, state)).toEqual(courseProgress(plan, emptyState()));
  });
});
