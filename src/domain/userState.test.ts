import { describe, expect, it } from "vitest";
import {
  addAttempt,
  addEntry,
  addExtraTask,
  createInitialState,
  extraTasksOn,
  parseUserState,
  removeEntry,
  removeExtraTask,
  removeLastAttempt,
  setItemTitle,
  setSessionNote,
  setStartDate,
  setWeekNote,
  StateParseError,
  updateEntry,
  updateExtraTask,
} from "./userState";

describe("изменения состояния", () => {
  it("добавляет попытки по порядку и не мутирует исходное состояние", () => {
    const s0 = createInitialState();
    const s1 = addAttempt(s0, "x", "failed", "2026-10-12");
    const s2 = addAttempt(s1, "x", "clean", "2026-10-13");
    expect(s0.items).toEqual({});
    expect(s2.items.x.attempts.map((a) => a.outcome)).toEqual(["failed", "clean"]);
  });

  it("убирает последнюю попытку", () => {
    const s = addAttempt(addAttempt(createInitialState(), "x", "failed", "2026-10-12"), "x", "clean", "2026-10-13");
    expect(removeLastAttempt(s, "x").items.x.attempts).toHaveLength(1);
    expect(removeLastAttempt(createInitialState(), "x")).toEqual(createInitialState());
  });

  it("сохраняет и очищает название задачи", () => {
    const named = setItemTitle(createInitialState(), "x", "  Two Sum  ");
    expect(named.items.x.title).toBe("Two Sum");
    expect(setItemTitle(named, "x", "  ").items.x.title).toBeUndefined();
  });
});

describe("parseUserState", () => {
  it("принимает собственный вывод и переживает JSON", () => {
    const s = addAttempt(createInitialState(), "x", "hint", "2026-10-12");
    expect(parseUserState(JSON.parse(JSON.stringify(s)))).toEqual({ ...s, startDate: undefined });
  });

  it("старое сохранение без sessionNotes читается с пустыми заметками", () => {
    const { sessionNotes: _omit, ...old } = createInitialState();
    void _omit;
    expect(parseUserState(old).sessionNotes).toEqual({});
  });

  it("старое сохранение без extraTasks читается с пустым списком", () => {
    const { extraTasks: _omit, ...old } = createInitialState();
    void _omit;
    expect(parseUserState(old).extraTasks).toEqual([]);
  });

  it("старое сохранение без weekNotes читается с пустыми заметками", () => {
    const { weekNotes: _omit, ...old } = createInitialState();
    void _omit;
    expect(parseUserState(old).weekNotes).toEqual({});
  });

  it("отклоняет повреждённые данные", () => {
    const bad: unknown[] = [
      null,
      "строка",
      [],
      {},
      { ...createInitialState(), version: 2 },
      { ...createInitialState(), startDate: "завтра" },
      { ...createInitialState(), items: { x: { attempts: [{ date: "2026-10-12", outcome: "ok" }] } } },
      { ...createInitialState(), items: { x: {} } },
      { ...createInitialState(), sessions: { s: { status: "done" } } },
      { ...createInitialState(), sessions: { s: "done" } },
      { ...createInitialState(), prizesClaimed: { abc: "2026-10-12" } },
      { ...createInitialState(), mocks: {} },
      { ...createInitialState(), sessionNotes: { s: 5 } },
      { ...createInitialState(), sessionNotes: [] },
      { ...createInitialState(), weekNotes: [] },
      { ...createInitialState(), weekNotes: { 0: "x" } },
      { ...createInitialState(), weekNotes: { abc: "x" } },
      { ...createInitialState(), weekNotes: { 1: 5 } },
      { ...createInitialState(), extraTasks: {} },
      { ...createInitialState(), extraTasks: [{ id: "a", date: "2026-10-12", title: "x", topic: "nope", done: false }] },
      { ...createInitialState(), extraTasks: [{ id: "a", date: "завтра", title: "x", topic: "js", done: false }] },
      { ...createInitialState(), extraTasks: [{ id: "a", date: "2026-10-12", title: "x", topic: "js", done: "да" }] },
      { ...createInitialState(), extraTasks: [{ id: "a", date: "2026-10-12", title: "x", topic: "js", done: true, minutes: -5 }] },
      {
        ...createInitialState(),
        extraTasks: [
          { id: "a", date: "2026-10-12", title: "x", topic: "js", done: true },
          { id: "a", date: "2026-10-13", title: "y", topic: "js", done: true },
        ],
      },
    ];
    for (const value of bad) expect(() => parseUserState(value)).toThrow(StateParseError);
  });
});

describe("журналы", () => {
  it("добавляет, меняет и удаляет записи", () => {
    let s = addEntry(createInitialState(), "stories", { topic: "Конфликт", ready: false });
    s = addEntry(s, "stories", { topic: "Провал", ready: false });
    s = updateEntry(s, "stories", 0, { ready: true, result: "+20%" });
    expect(s.stories[0]).toEqual({ topic: "Конфликт", ready: true, result: "+20%" });
    expect(s.stories[1].ready).toBe(false);
    s = removeEntry(s, "stories", 0);
    expect(s.stories).toEqual([{ topic: "Провал", ready: false }]);
  });

  it("поле со значением undefined удаляется из записи", () => {
    let s = addEntry(createInitialState(), "mocks", { week: 4, type: "Алгоритмы", date: "2026-11-01" });
    s = updateEntry(s, "mocks", 0, { date: undefined });
    expect(s.mocks[0]).toEqual({ week: 4, type: "Алгоритмы" });
  });

  it("неверный индекс состояние не меняет", () => {
    const s = createInitialState();
    expect(updateEntry(s, "mocks", 3, { type: "x" })).toBe(s);
    expect(removeEntry(s, "mocks", 0)).toBe(s);
  });

  it("не мутирует исходное состояние", () => {
    const s0 = createInitialState();
    addEntry(s0, "applications", { company: "X", status: "Подана" });
    expect(s0.applications).toEqual([]);
  });
});

describe("setStartDate", () => {
  it("принимает понедельник и очищается значением null", () => {
    const s = setStartDate(createInitialState(), "2026-11-02");
    expect(s.startDate).toBe("2026-11-02");
    expect(setStartDate(s, null).startDate).toBeUndefined();
  });

  it("отклоняет не понедельник и неверный формат", () => {
    expect(() => setStartDate(createInitialState(), "2026-11-03")).toThrow(StateParseError);
    expect(() => setStartDate(createInitialState(), "завтра")).toThrow(StateParseError);
  });
});

describe("заметки к сессиям", () => {
  it("хранит заметку по id сессии и удаляет пустой", () => {
    const s = setSessionNote(createInitialState(), "w01-d3-s1", "прочитал, не понял this");
    expect(s.sessionNotes).toEqual({ "w01-d3-s1": "прочитал, не понял this" });
    expect(setSessionNote(s, "w01-d3-s1", "").sessionNotes).toEqual({});
  });
});

describe("свои задачи на день", () => {
  const task = { id: "t1", date: "2026-10-14", title: "Разобрать LRU Cache", topic: "algorithms" as const, done: false };

  it("добавляет, фильтрует по дате и не мутирует состояние", () => {
    const s0 = createInitialState();
    const s1 = addExtraTask(addExtraTask(s0, task), { ...task, id: "t2", date: "2026-10-15" });
    expect(s0.extraTasks).toEqual([]);
    expect(extraTasksOn(s1, "2026-10-14").map((t) => t.id)).toEqual(["t1"]);
    expect(extraTasksOn(s1, "2026-10-16")).toEqual([]);
  });

  it("меняет поля; minutes: undefined убирает время", () => {
    let s = addExtraTask(createInitialState(), task);
    s = updateExtraTask(s, "t1", { done: true, minutes: 40, topic: "js" });
    expect(s.extraTasks[0]).toEqual({ ...task, done: true, minutes: 40, topic: "js" });
    s = updateExtraTask(s, "t1", { minutes: undefined });
    expect("minutes" in s.extraTasks[0]).toBe(false);
    expect(updateExtraTask(s, "нет", { done: true })).toBe(s);
  });

  it("удаление убирает и заметку к задаче", () => {
    let s = addExtraTask(createInitialState(), task);
    s = setSessionNote(s, "t1", "идея: хеш + двусвязный список");
    s = setSessionNote(s, "w01-d1-s1", "чужая заметка");
    s = removeExtraTask(s, "t1");
    expect(s.extraTasks).toEqual([]);
    expect(s.sessionNotes).toEqual({ "w01-d1-s1": "чужая заметка" });
    expect(removeExtraTask(s, "t1")).toBe(s);
  });

  it("переживает JSON", () => {
    const s = addExtraTask(createInitialState(), { ...task, done: true, minutes: 30 });
    expect(parseUserState(JSON.parse(JSON.stringify(s))).extraTasks).toEqual(s.extraTasks);
  });
});

describe("заметка недели", () => {
  it("хранится по номеру недели, пустой текст удаляет", () => {
    const s = setWeekNote(setWeekNote(createInitialState(), 3, "слабое место: графы"), 5, "ок");
    expect(s.weekNotes).toEqual({ 3: "слабое место: графы", 5: "ок" });
    expect(setWeekNote(s, 3, "").weekNotes).toEqual({ 5: "ок" });
  });

  it("переживает JSON", () => {
    const s = setWeekNote(createInitialState(), 2, "итог недели");
    expect(parseUserState(JSON.parse(JSON.stringify(s))).weekNotes).toEqual({ 2: "итог недели" });
  });
});

describe("заметка при создании своей задачи", () => {
  const task = { id: "t1", date: "2026-10-14", title: "LRU", topic: "algorithms" as const, done: false };

  it("сохраняется под id задачи", () => {
    expect(addExtraTask(createInitialState(), task, "идея").sessionNotes).toEqual({ t1: "идея" });
  });

  it("пустая заметка не создаёт записи", () => {
    expect(addExtraTask(createInitialState(), task, "").sessionNotes).toEqual({});
    expect(addExtraTask(createInitialState(), task).sessionNotes).toEqual({});
  });
});
