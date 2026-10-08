import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { applyMoves, currentPlace, sessionOrigin } from "./moves";
import { newlyAvailablePrizes } from "./prizes";
import { weekProgress } from "./progress";
import { completeWeek, emptyState } from "./testing";
import { parseUserState, setSessionMove } from "./userState";

const sessionIds = (week: number, offset: number) =>
  applyMoves(plan, {}).weeks[week - 1].days.find((d) => d.offset === offset)!.sessions.map((s) => s.id);

describe("applyMoves", () => {
  it("без переносов возвращает тот же план", () => {
    expect(applyMoves(plan, {})).toBe(plan);
  });

  it("переносит сессию на другой день другой недели", () => {
    const id = "w01-d1-s1";
    const moved = applyMoves(plan, { [id]: { week: 2, offset: 3 } });
    expect(moved.weeks[0].days[0].sessions.map((s) => s.id)).not.toContain(id);
    expect(moved.weeks[1].days.find((d) => d.offset === 3)!.sessions.at(-1)!.id).toBe(id);
    expect(moved.weeks[0].days[1]).toBe(plan.weeks[0].days[1]);
  });

  it("игнорирует неизвестные id, несуществующий день и выходной", () => {
    const rest = plan.weeks.flatMap((w) => w.days.flatMap((d) => d.sessions)).find((s) => s.block === "rest")!;
    expect(
      applyMoves(plan, {
        nope: { week: 2, offset: 0 },
        "w01-d1-s1": { week: 99, offset: 0 },
        [rest.id]: { week: 2, offset: 0 },
      }),
    ).toBe(plan);
  });

  it("перенос меняет состав недель и закрытие недели", () => {
    const id = "w01-d1-s1";
    const moves = { [id]: { week: 2, offset: 0 } };
    const moved = applyMoves(plan, moves);
    const state = completeWeek(emptyState(), 1);
    const without = { ...state, sessions: Object.fromEntries(Object.entries(state.sessions).filter(([k]) => k !== id)) };
    expect(weekProgress(plan.weeks[0], without).closed).toBe(false);
    expect(weekProgress(moved.weeks[0], { ...without, sessionMoves: moves }).closed).toBe(true);
    expect(weekProgress(moved.weeks[1], without).total).toBe(weekProgress(plan.weeks[1], without).total + 1);
  });

  it("приз открывается, когда перенос убирает последнюю несделанную сессию недели", () => {
    const id = "w01-d1-s1";
    const state = completeWeek(emptyState(), 1);
    const before = { ...state, sessions: Object.fromEntries(Object.entries(state.sessions).filter(([k]) => k !== id)) };
    const after = setSessionMove(before, id, { week: 2, offset: 0 });
    expect(newlyAvailablePrizes(plan, before, after)).toContain(1);
  });
});

describe("sessionOrigin и currentPlace", () => {
  it("находит исходное и текущее место", () => {
    expect(sessionOrigin(plan, "w01-d1-s1")).toEqual({ week: 1, offset: 0 });
    expect(sessionOrigin(plan, "m-2027-01-01-s1")).toBeUndefined();
    const state = setSessionMove(emptyState(), "w01-d1-s1", { week: 3, offset: 2 });
    expect(currentPlace(plan, state, "w01-d1-s1")).toEqual({ week: 3, offset: 2 });
    expect(sessionIds(1, 0)).toContain("w01-d1-s1");
  });
});

describe("setSessionMove и parseUserState", () => {
  it("null возвращает сессию на место", () => {
    const moved = setSessionMove(emptyState(), "a", { week: 2, offset: 1 });
    expect(setSessionMove(moved, "a", null).sessionMoves).toEqual({});
  });

  it("принимает сохранения без sessionMoves и проверяет перенос", () => {
    const { sessionMoves: _omit, ...legacy } = emptyState();
    expect(parseUserState(legacy).sessionMoves).toEqual({});
    expect(() => parseUserState({ ...emptyState(), sessionMoves: { a: { week: 0, offset: 1 } } })).toThrow();
    expect(() => parseUserState({ ...emptyState(), sessionMoves: { a: { week: 2, offset: 7 } } })).toThrow();
  });
});
