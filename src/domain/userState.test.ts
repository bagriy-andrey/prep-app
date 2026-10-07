import { describe, expect, it } from "vitest";
import {
  addAttempt,
  addEntry,
  createInitialState,
  parseUserState,
  removeEntry,
  removeLastAttempt,
  setItemTitle,
  setStartDate,
  StateParseError,
  updateEntry,
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
