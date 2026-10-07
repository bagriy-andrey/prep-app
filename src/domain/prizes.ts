// Призы (разд. 6.4).

import type { Plan, Week } from "../data/types";
import { weekProgress } from "./progress";
import type { UserState } from "./userState";

export type PrizeStatus = "locked" | "available" | "claimed";

/** Номера недель блока, в который входит неделя: границы задаёт plan.rules.bigPrizeWeeks. */
export function blockWeeks(plan: Plan, week: number): number[] {
  const ends = [...plan.rules.bigPrizeWeeks].sort((a, b) => a - b);
  const end = ends.find((e) => e >= week) ?? plan.meta.weeksCount;
  const start = (ends.filter((e) => e < week).at(-1) ?? 0) + 1;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Недели, которые должны быть закрыты, чтобы приз недели стал доступен. */
export function prizeRequiredWeeks(plan: Plan, week: Week): number[] {
  return week.prize.tier === "small" ? [week.n] : blockWeeks(plan, week.n);
}

export interface PrizeInfo {
  status: PrizeStatus;
  requiredWeeks: number[];
  closedWeeks: number;
  /** Сколько обязательных сессий осталось закрыть до приза. */
  remainingSessions: number;
}

export function prizeInfo(plan: Plan, week: Week, state: UserState): PrizeInfo {
  const requiredWeeks = prizeRequiredWeeks(plan, week);
  const progress = requiredWeeks.map((n) => weekProgress(plan.weeks[n - 1], state));
  const closedWeeks = progress.filter((p) => p.closed).length;
  const remainingSessions = progress.reduce((sum, p) => sum + p.remaining, 0);

  // Приз не сгорает и не отзывается: полученный остаётся полученным.
  let status: PrizeStatus = "locked";
  if (state.prizesClaimed[week.n] !== undefined) status = "claimed";
  else if (closedWeeks === requiredWeeks.length) status = "available";

  return { status, requiredWeeks, closedWeeks, remainingSessions };
}

/** Отмечает приз полученным; для недоступного приза состояние не меняется. */
export function claimPrize(plan: Plan, state: UserState, weekNumber: number, date: string): UserState {
  const week = plan.weeks[weekNumber - 1];
  if (!week || prizeInfo(plan, week, state).status !== "available") return state;
  return { ...state, prizesClaimed: { ...state.prizesClaimed, [weekNumber]: date } };
}

/**
 * Недели, чей приз стал доступен при переходе от `before` к `after`.
 * Одно действие может открыть несколько призов: закрытая неделя открывает свой малый приз
 * и, если остальные недели блока уже закрыты, крупный.
 */
export function newlyAvailablePrizes(plan: Plan, before: UserState, after: UserState): number[] {
  return plan.weeks
    .filter(
      (week) =>
        prizeInfo(plan, week, after).status === "available" && prizeInfo(plan, week, before).status !== "available",
    )
    .map((week) => week.n);
}
