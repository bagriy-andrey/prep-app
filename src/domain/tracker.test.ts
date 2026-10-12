import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { filterItems, itemTitle, kindCounts, reviewQueue } from "./tracker";
import { addAttempt, createInitialState, setDayNote, setItemText, setItemTitle } from "./userState";

const empty = createInitialState();

describe("kindCounts", () => {
  it("считает все задачи плана как запланированные", () => {
    const counts = kindCounts(plan, empty);
    expect(Object.values(counts).reduce((s, c) => s + c.total, 0)).toBe(plan.items.length);
    expect(counts.dsa).toEqual({ done: 0, total: 64 });
  });

  it("задача сделана после первой попытки, повторные попытки не удваивают счёт", () => {
    let state = addAttempt(empty, "dsa-two-sum", "failed", "2026-10-12");
    state = addAttempt(state, "dsa-two-sum", "clean", "2026-10-13");
    state = addAttempt(state, "js-debounce", "hint", "2026-10-13");
    const counts = kindCounts(plan, state);
    expect(counts.dsa.done).toBe(1);
    expect(counts.js.done).toBe(1);
    expect(counts.ui.done).toBe(0);
  });
});

describe("filterItems", () => {
  const today = "2026-10-19";
  const state = addAttempt(addAttempt(empty, "dsa-two-sum", "clean", "2026-10-12"), "dsa-valid-anagram", "clean", "2026-10-18");

  it("без фильтров возвращает все задачи", () => {
    expect(filterItems(plan, empty, {}, today)).toHaveLength(plan.items.length);
  });

  it("фильтрует по типу и неделе", () => {
    const week1Js = filterItems(plan, empty, { kind: "js", week: 1 }, today);
    expect(week1Js.length).toBeGreaterThan(0);
    for (const item of week1Js) expect([item.kind, item.week]).toEqual(["js", 1]);
  });

  it("фильтрует по статусу", () => {
    const ids = (status: "not-started" | "in-progress" | "due" | "closed") =>
      filterItems(plan, state, { status }, today).map((i) => i.id);
    expect(ids("due")).toEqual(["dsa-two-sum"]); // повторение 2026-10-19
    expect(ids("in-progress")).toEqual(["dsa-valid-anagram"]); // повторение 2026-10-25
    expect(ids("closed")).toEqual([]);
    expect(ids("not-started")).toHaveLength(plan.items.length - 2);
  });
});

describe("reviewQueue", () => {
  it("задача, решённая неделю назад чисто, в очереди с устным способом", () => {
    const state = addAttempt(empty, "dsa-two-sum", "clean", "2026-10-12");
    expect(reviewQueue(plan, state, "2026-10-19")).toMatchObject([
      { item: { id: "dsa-two-sum" }, dueDate: "2026-10-19", method: "oral", overdueDays: 0 },
    ]);
    expect(reviewQueue(plan, state, "2026-10-18")).toEqual([]);
  });

  it("задача с подсказкой или провалом: решить заново", () => {
    const state = addAttempt(addAttempt(empty, "dsa-two-sum", "hint", "2026-10-12"), "js-debounce", "failed", "2026-10-13");
    const queue = reviewQueue(plan, state, "2026-10-20");
    // js-debounce: 13.10 + 1 день = 14.10; dsa-two-sum: 12.10 + 3 дня = 15.10
    expect(queue.map((e) => [e.item.id, e.method])).toEqual([
      ["js-debounce", "redo"],
      ["dsa-two-sum", "redo"],
    ]);
  });

  it("сначала самые просроченные", () => {
    let state = addAttempt(empty, "js-debounce", "failed", "2026-10-13"); // срок 10-14
    state = addAttempt(state, "dsa-two-sum", "failed", "2026-10-15"); // срок 10-16
    const queue = reviewQueue(plan, state, "2026-10-20");
    expect(queue.map((e) => e.item.id)).toEqual(["js-debounce", "dsa-two-sum"]);
    expect(queue[0].overdueDays).toBe(6);
  });

  it("закрытые задачи и задачи без попыток не попадают в очередь", () => {
    let state = addAttempt(empty, "dsa-two-sum", "clean", "2026-10-12");
    state = addAttempt(state, "dsa-two-sum", "clean", "2026-10-19");
    state = addAttempt(state, "dsa-two-sum", "clean", "2026-11-09");
    expect(reviewQueue(plan, state, "2027-06-01")).toEqual([]);
  });
});

describe("название и заметки", () => {
  const own = plan.items.find((i) => i.userNamed)!;

  it("название берётся из плана или из ввода пользователя", () => {
    expect(itemTitle(plan.items[0], empty)).toBe("Contains Duplicate");
    expect(itemTitle(own, empty)).toBeNull();
    expect(itemTitle(own, setItemTitle(empty, own.id, "LRU Cache"))).toBe("LRU Cache");
  });

  it("ключевая идея и заметка сохраняются и удаляются пустым текстом", () => {
    let state = setItemText(empty, "dsa-two-sum", "keyIdea", "хеш-таблица ");
    state = setItemText(state, "dsa-two-sum", "note", "строка 1\nстрока 2");
    expect(state.items["dsa-two-sum"]).toMatchObject({ keyIdea: "хеш-таблица ", note: "строка 1\nстрока 2" });
    state = setItemText(state, "dsa-two-sum", "keyIdea", "");
    expect(state.items["dsa-two-sum"].keyIdea).toBeUndefined();
    expect(state.items["dsa-two-sum"].note).toBe("строка 1\nстрока 2");
  });

  it("заметка дня хранится по дате и удаляется пустым текстом", () => {
    const state = setDayNote(empty, "2026-10-14", "тяжело зашёл");
    expect(state.dayNotes).toEqual({ "2026-10-14": "тяжело зашёл" });
    expect(setDayNote(state, "2026-10-14", "").dayNotes).toEqual({});
  });
});
