// Отметка сессий и закрытие недели (разд. 6.2, 6.3).

import type { Plan, Session, Week } from "../data/types";
import type { SessionStatus, UserState } from "./userState";

/** В подсчёты не входят необязательные сессии и выходной. */
export function countsTowardProgress(session: Session): boolean {
  return !session.optional && session.block !== "rest";
}

/** Сессии с задачей отмечаются попыткой, остальные вручную. */
export function isManualSession(session: Pick<Session, "itemId">): boolean {
  return !session.itemId;
}

export function isSessionDone(session: Pick<Session, "id" | "itemId">, state: UserState): boolean {
  if (session.itemId) return (state.items[session.itemId]?.attempts.length ?? 0) > 0;
  const status = state.sessions[session.id]?.status;
  return status === "done" || status === "light";
}

/**
 * Статус сессии для интерфейса: ручная сессия берёт отметку, сессия с задачей
 * считается сделанной (done) после первой попытки. null, если сессия ещё открыта.
 */
export function sessionStatus(session: Pick<Session, "id" | "itemId">, state: UserState): SessionStatus | null {
  if (isManualSession(session)) return state.sessions[session.id]?.status ?? null;
  return isSessionDone(session, state) ? "done" : null;
}

export interface WeekProgress {
  done: number;
  total: number;
  remaining: number;
  closed: boolean;
}

export function weekSessions(week: Week): Session[] {
  return week.days.flatMap((d) => d.sessions);
}

export function weekProgress(week: Week, state: UserState): WeekProgress {
  const required = weekSessions(week).filter(countsTowardProgress);
  const done = required.filter((s) => isSessionDone(s, state)).length;
  return { done, total: required.length, remaining: required.length - done, closed: done === required.length };
}

export const isWeekClosed = (week: Week, state: UserState) => weekProgress(week, state).closed;

/** Сессии, которым «Отметить день» может поставить статус: ручные, кроме выходного. */
export function markableSessionIds(sessions: Session[]): string[] {
  return sessions.filter((s) => isManualSession(s) && s.block !== "rest").map((s) => s.id);
}

/** Доля выполненного в целых процентах; для пустого списка 0. */
export function toPercent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export interface CourseProgress {
  done: number;
  total: number;
  percent: number;
  closedWeeks: number;
  weeks: number;
}

/**
 * Общий прогресс курса из прогресса недель: сумма сделанных обязательных сессий
 * по всем неделям делится на сумму всех обязательных сессий.
 */
export function courseProgress(plan: Plan, state: UserState): CourseProgress {
  const weeks = plan.weeks.map((w) => weekProgress(w, state));
  const done = weeks.reduce((sum, w) => sum + w.done, 0);
  const total = weeks.reduce((sum, w) => sum + w.total, 0);
  return {
    done,
    total,
    percent: toPercent(done, total),
    closedWeeks: weeks.filter((w) => w.closed).length,
    weeks: weeks.length,
  };
}
