import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { dayDate, weekRange } from "./schedule";
import {
  blockOfSession,
  entriesInRange,
  minutesByDay,
  minutesByTopic,
  minutesByWeek,
  minutesOnDate,
  plannedMinutesForDay,
  plannedMinutesForWeek,
  sumMinutes,
  timeEntries,
  topicOfBlock,
  TOPICS,
} from "./time";
import {
  addAttempt,
  addExtraTask,
  createInitialState,
  markUnmarked,
  parseMinutes,
  parseUserState,
  setAttemptMinutes,
  setSessionMinutes,
  setSessionStatus,
  StateParseError,
} from "./userState";

const start = plan.meta.startDate;
const empty = createInitialState();

describe("parseMinutes", () => {
  it("принимает целые минуты от 0 до 1440", () => {
    expect(parseMinutes("25")).toBe(25);
    expect(parseMinutes(" 90 ")).toBe(90);
    expect(parseMinutes("0")).toBe(0);
    expect(parseMinutes("1440")).toBe(1440);
  });

  it("пустое и неверное значение это undefined", () => {
    for (const bad of ["", "  ", "abc", "-5", "2.5", "1e3", "1441"]) expect(parseMinutes(bad)).toBeUndefined();
  });
});

describe("время в состоянии", () => {
  it("попытка хранит время, а без времени ключа minutes нет", () => {
    const withMinutes = addAttempt(empty, "dsa-two-sum", "clean", "2026-10-12", 25);
    const without = addAttempt(empty, "dsa-two-sum", "clean", "2026-10-12");
    expect(withMinutes.items["dsa-two-sum"].attempts[0]).toEqual({ date: "2026-10-12", outcome: "clean", minutes: 25 });
    expect(Object.keys(without.items["dsa-two-sum"].attempts[0])).toEqual(["date", "outcome"]);
  });

  it("время попытки можно изменить и убрать", () => {
    let s = addAttempt(empty, "x", "hint", "2026-10-12", 25);
    s = setAttemptMinutes(s, "x", 0, 40);
    expect(s.items.x.attempts[0].minutes).toBe(40);
    s = setAttemptMinutes(s, "x", 0, undefined);
    expect("minutes" in s.items.x.attempts[0]).toBe(false);
    expect(setAttemptMinutes(s, "x", 5, 10)).toBe(s);
    expect(setAttemptMinutes(s, "нет", 0, 10)).toBe(s);
  });

  it("отметка сессии хранит время, у moved времени нет", () => {
    expect(setSessionStatus(empty, "a", "done", "2026-10-12", 30).sessions.a).toEqual({
      status: "done",
      date: "2026-10-12",
      minutes: 30,
    });
    expect(setSessionStatus(empty, "a", "moved", "2026-10-12", 30).sessions.a).toEqual({
      status: "moved",
      date: "2026-10-12",
    });
  });

  it("время отмеченной сессии меняется, у неотмеченной и перенесённой нет", () => {
    const done = setSessionStatus(empty, "a", "done", "2026-10-12", 30);
    expect(setSessionMinutes(done, "a", 45).sessions.a.minutes).toBe(45);
    expect("minutes" in setSessionMinutes(done, "a", undefined).sessions.a).toBe(false);
    expect(setSessionMinutes(empty, "a", 45)).toBe(empty);
    const moved = setSessionStatus(empty, "a", "moved", "2026-10-12");
    expect(setSessionMinutes(moved, "a", 45)).toBe(moved);
  });

  it("«Отметить день» записывает время по умолчанию только для переданных сессий", () => {
    const s = markUnmarked(empty, ["a", "b"], "done", "2026-10-12", { a: 20 });
    expect(s.sessions.a.minutes).toBe(20);
    expect("minutes" in s.sessions.b).toBe(false);
  });

  it("проверка формата отклоняет неверное время", () => {
    const bad = (patch: object) => () => parseUserState({ ...createInitialState(), ...patch });
    expect(bad({ sessions: { a: { status: "done", date: "2026-10-12", minutes: -1 } } })).toThrow(StateParseError);
    expect(bad({ sessions: { a: { status: "done", date: "2026-10-12", minutes: 1.5 } } })).toThrow(StateParseError);
    expect(bad({ items: { x: { attempts: [{ date: "2026-10-12", outcome: "clean", minutes: 9999 }] } } })).toThrow(
      StateParseError,
    );
    const ok = addAttempt(setSessionStatus(empty, "a", "done", "2026-10-12", 30), "x", "clean", "2026-10-12", 20);
    expect(parseUserState(JSON.parse(JSON.stringify(ok)))).toMatchObject({
      sessions: { a: { minutes: 30 } },
      items: { x: { attempts: [{ minutes: 20 }] } },
    });
  });
});

describe("темы", () => {
  it("каждый блок плана относится к теме явно, а не через запасной «Прочее»", () => {
    const explicit = new Set(TOPICS.flatMap((t) => t.blocks));
    // Выходной (rest) это 0 минут, в темах ему места нет.
    for (const block of Object.keys(plan.blocks).filter((b) => b !== "rest")) {
      expect(explicit.has(block), block).toBe(true);
    }
  });

  it("блок попадает ровно в одну тему", () => {
    const all = TOPICS.flatMap((t) => t.blocks);
    expect(new Set(all).size).toBe(all.length);
  });

  it("неизвестный блок это «Прочее»", () => {
    expect(topicOfBlock("dsa")).toBe("algorithms");
    expect(topicOfBlock("sd-review")).toBe("system-design");
    expect(topicOfBlock("нет-такого")).toBe("other");
  });

  it("находит блок сессии плана и сессии недели 17+", () => {
    expect(blockOfSession(plan, "w01-d1-s2")).toBe("dsa");
    const monday = dayDate(start, 17, 0);
    expect(blockOfSession(plan, `m-${monday}-s1`)).toBe(plan.maintenanceWeek.days[0].sessions[0].block);
    expect(blockOfSession(plan, "m-2027-02-02-s1")).toBeUndefined(); // вторник: отдыха нет в maintenanceWeek
    expect(blockOfSession(plan, "что-то")).toBeUndefined();
  });
});

describe("timeEntries", () => {
  it("собирает время сессий и попыток, пропускает записи без времени и перенесённые", () => {
    let s = setSessionStatus(empty, "w01-d1-s1", "done", "2026-10-12", 20); // theory → web
    s = setSessionStatus(s, "w01-d3-s1", "moved", "2026-10-14", 30);
    s = setSessionStatus(s, "w01-d3-s2", "done", "2026-10-14"); // без времени
    s = addAttempt(s, "dsa-two-sum", "clean", "2026-10-12", 30);
    s = addAttempt(s, "dsa-two-sum", "clean", "2026-10-19");
    expect(timeEntries(plan, s)).toEqual([
      { date: "2026-10-12", minutes: 20, topic: "web" },
      { date: "2026-10-12", minutes: 30, topic: "algorithms" },
    ]);
  });

  it("сессия с неизвестным id и задача вне плана идут в «Прочее»", () => {
    let s = setSessionStatus(empty, "старый-id", "done", "2026-10-12", 10);
    s = addAttempt(s, "старая-задача", "clean", "2026-10-12", 5);
    expect(timeEntries(plan, s).map((e) => e.topic)).toEqual(["other", "other"]);
  });
});

describe("суммы", () => {
  let s = empty;
  s = addAttempt(s, "dsa-two-sum", "clean", "2026-10-12", 30); // пн нед. 1
  s = addAttempt(s, "dsa-valid-anagram", "hint", "2026-10-12", 20);
  s = addAttempt(s, "js-debounce", "clean", "2026-10-13", 40); // вт нед. 1
  s = setSessionStatus(s, "w01-d3-s1", "done", "2026-10-14", 25); // ср, web
  s = addAttempt(s, "dsa-two-sum", "clean", "2026-10-19", 10); // пн нед. 2
  const entries = timeEntries(plan, s);

  it("за день", () => {
    expect(minutesOnDate(entries, "2026-10-12")).toBe(50);
    expect(minutesOnDate(entries, "2026-10-15")).toBe(0);
  });

  it("за неделю и весь курс", () => {
    const w1 = weekRange(start, 1);
    expect(sumMinutes(entriesInRange(entries, w1.from, w1.to))).toBe(115);
    expect(sumMinutes(entries)).toBe(125);
  });

  it("по неделям с плановым временем", () => {
    const weeks = minutesByWeek(plan, entries, start);
    expect(weeks).toHaveLength(16);
    expect(weeks[0]).toMatchObject({ week: 1, from: "2026-10-12", to: "2026-10-18", minutes: 115 });
    expect(weeks[1]).toMatchObject({ week: 2, minutes: 10 });
    expect(weeks[2].minutes).toBe(0);
    expect(weeks[0].planned).toBe(plannedMinutesForWeek(plan, 1));
  });

  it("по дням недели", () => {
    const days = minutesByDay(entries, "2026-10-12");
    expect(days.map((d) => d.minutes)).toEqual([50, 40, 25, 0, 0, 0, 0]);
    expect(days[0]).toMatchObject({ date: "2026-10-12", dow: 1 });
  });

  it("по темам: от большего, без нулевых", () => {
    expect(minutesByTopic(entries)).toEqual([
      { key: "algorithms", label: "Алгоритмы", minutes: 60 },
      { key: "js", label: "JS-кодинг", minutes: 40 },
      { key: "web", label: "Веб-основы и теория", minutes: 25 },
    ]);
    expect(minutesByTopic([])).toEqual([]);
  });

  it("сумма по темам равна общей сумме", () => {
    expect(minutesByTopic(entries).reduce((sum, t) => sum + t.minutes, 0)).toBe(sumMinutes(entries));
  });
});

describe("плановое время", () => {
  it("день: сумма обязательных сессий, необязательные не входят", () => {
    expect(plannedMinutesForDay(plan.weeks[0].days[0])).toBe(85); // 30 + 25 + 30
    expect(plannedMinutesForDay(plan.weeks[0].days[5])).toBe(180); // 45 + 60 + 45 + 30, запас 15 не входит
    expect(plannedMinutesForDay(plan.weeks[0].days[4])).toBe(0); // выходной
  });
});

describe("свои задачи во времени", () => {
  const task = { id: "t1", date: "2026-10-14", title: "LRU Cache", topic: "algorithms" as const, done: false };

  it("время попадает в тему и на дату задачи, даже если она ещё не отмечена сделанной", () => {
    const s = addExtraTask(addExtraTask(empty, { ...task, minutes: 40 }), { ...task, id: "t2", topic: "ui", minutes: 25, done: true });
    expect(timeEntries(plan, s)).toEqual([
      { date: "2026-10-14", minutes: 40, topic: "algorithms" },
      { date: "2026-10-14", minutes: 25, topic: "ui" },
    ]);
  });

  it("задача без времени ничего не добавляет", () => {
    expect(timeEntries(plan, addExtraTask(empty, task))).toEqual([]);
  });
});
