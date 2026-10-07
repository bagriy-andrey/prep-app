import { describe, expect, it } from "vitest";
import {
  addAttempt,
  createInitialState,
  parseUserState,
  removeLastAttempt,
  setItemTitle,
  StateParseError,
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
