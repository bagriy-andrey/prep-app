import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { weekProgress } from "./progress";
import { blockWeeks, claimPrize, prizeInfo } from "./prizes";
import { completeWeek, DATE, emptyState } from "./testing";

const week = (n: number) => plan.weeks[n - 1];

describe("блоки", () => {
  it("делят 16 недель на четыре блока по bigPrizeWeeks", () => {
    expect(blockWeeks(plan, 1)).toEqual([1, 2, 3, 4]);
    expect(blockWeeks(plan, 4)).toEqual([1, 2, 3, 4]);
    expect(blockWeeks(plan, 5)).toEqual([5, 6, 7, 8]);
    expect(blockWeeks(plan, 12)).toEqual([9, 10, 11, 12]);
    expect(blockWeeks(plan, 16)).toEqual([13, 14, 15, 16]);
  });
});

describe("призы (6.4)", () => {
  it("малый приз закрыт, пока неделя не закрыта", () => {
    expect(prizeInfo(plan, week(1), emptyState()).status).toBe("locked");
  });

  it("малый приз доступен, когда закрыта его неделя", () => {
    const state = completeWeek(emptyState(), 2);
    expect(prizeInfo(plan, week(2), state).status).toBe("available");
    expect(prizeInfo(plan, week(1), state).status).toBe("locked");
  });

  it("крупный приз требует все четыре недели блока", () => {
    let state = emptyState();
    for (const n of [1, 2, 3]) state = completeWeek(state, n);
    expect(week(4).prize.tier).toBe("big");
    expect(prizeInfo(plan, week(4), state)).toMatchObject({ status: "locked", closedWeeks: 3 });

    state = completeWeek(state, 4);
    expect(prizeInfo(plan, week(4), state)).toMatchObject({ status: "available", closedWeeks: 4, remainingSessions: 0 });
  });

  it("закрытая неделя 4 без остальных недель блока не открывает крупный приз", () => {
    expect(prizeInfo(plan, week(4), completeWeek(emptyState(), 4)).status).toBe("locked");
  });

  it("финальный приз требует недели 13-16", () => {
    expect(week(16).prize.tier).toBe("final");
    let state = emptyState();
    for (const n of [13, 14, 15, 16]) state = completeWeek(state, n);
    expect(prizeInfo(plan, week(16), state).status).toBe("available");
  });

  it("приз не сгорает: после закрытия недели в любой момент он доступен, пока его не получили", () => {
    const state = completeWeek(emptyState(), 1);
    expect(prizeInfo(plan, week(1), state).status).toBe("available");
    // Недели закрываются не по порядку: приз недели 1 не зависит от недели 2.
    const later = completeWeek(state, 2);
    expect(prizeInfo(plan, week(1), later).status).toBe("available");
  });

  it("считает, сколько сессий осталось до приза", () => {
    const empty = emptyState();
    const total = (n: number) => weekProgress(week(n), empty).total;
    expect(prizeInfo(plan, week(1), empty).remainingSessions).toBe(total(1));
    expect(prizeInfo(plan, week(4), empty).remainingSessions).toBe(total(1) + total(2) + total(3) + total(4));

    const partial = completeWeek(empty, 2);
    expect(prizeInfo(plan, week(4), partial).remainingSessions).toBe(total(1) + total(3) + total(4));
  });

  it("получить можно только доступный приз", () => {
    const locked = emptyState();
    expect(claimPrize(plan, locked, 1, DATE)).toBe(locked);

    const open = completeWeek(emptyState(), 1);
    const claimed = claimPrize(plan, open, 1, DATE);
    expect(claimed.prizesClaimed[1]).toBe(DATE);
    expect(prizeInfo(plan, week(1), claimed).status).toBe("claimed");
  });

  it("полученный приз остаётся полученным, даже если неделя снова стала незакрытой", () => {
    const claimed = claimPrize(plan, completeWeek(emptyState(), 1), 1, DATE);
    const reopened = { ...claimed, sessions: {}, items: {} };
    expect(prizeInfo(plan, week(1), reopened).status).toBe("claimed");
  });

  it("повторное получение не меняет дату", () => {
    const once = claimPrize(plan, completeWeek(emptyState(), 1), 1, "2026-10-18");
    expect(claimPrize(plan, once, 1, "2026-10-25")).toBe(once);
  });
});
