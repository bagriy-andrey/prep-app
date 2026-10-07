// Повторения (разд. 6.1). Числа берутся из plan.rules.review.

import type { ReviewRules } from "../data/types";
import { addDays } from "./dates";
import type { Attempt } from "./userState";

export type ReviewMethod = "oral" | "redo";
export type ItemStatus = "not-started" | "in-progress" | "due" | "closed";

export type ReviewInfo =
  | { closed: false; dueDate: string; method: ReviewMethod; cleanCount: number }
  | { closed: true; cleanCount: number };

export const REVIEW_METHOD_LABEL: Record<ReviewMethod, string> = {
  oral: "Устно, 3-5 мин",
  redo: "Решить заново",
};

/** Описание повторения по истории попыток; null, если попыток ещё не было. */
export function reviewInfo(attempts: Attempt[], rules: ReviewRules): ReviewInfo | null {
  const last = attempts.at(-1);
  if (!last) return null;
  const cleanCount = attempts.filter((a) => a.outcome === "clean").length;

  let days: number;
  if (last.outcome === "failed") days = rules.failed;
  else if (last.outcome === "hint") days = rules.hint;
  else if (cleanCount >= rules.closeAfterCleanCount) return { closed: true, cleanCount };
  else days = cleanCount === 1 ? rules.cleanFirst : rules.cleanSecond;

  return {
    closed: false,
    dueDate: addDays(last.date, days),
    method: last.outcome === "clean" && rules.oralIfLastClean ? "oral" : "redo",
    cleanCount,
  };
}

/** Задача в очереди: дата повторения не позже сегодняшней и задача не закрыта. */
export function isInQueue(attempts: Attempt[], rules: ReviewRules, today: string): boolean {
  const info = reviewInfo(attempts, rules);
  return info !== null && !info.closed && info.dueDate <= today;
}

export function itemStatus(attempts: Attempt[], rules: ReviewRules, today: string): ItemStatus {
  const info = reviewInfo(attempts, rules);
  if (!info) return "not-started";
  if (info.closed) return "closed";
  return info.dueDate <= today ? "due" : "in-progress";
}
