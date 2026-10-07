// Отметка сессий и закрытие недели (разд. 6.2, 6.3).

import type { Session, Week } from "../data/types";
import type { UserState } from "./userState";

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
