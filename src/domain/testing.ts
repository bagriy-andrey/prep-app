// Помощники для тестов правил: заполняют состояние по плану.

import { plan } from "../data/plan";
import { countsTowardProgress, isManualSession } from "./progress";
import { addAttempt, createInitialState, setSessionStatus, type SessionStatus, type UserState } from "./userState";

export const DATE = "2026-10-14";

/** Закрывает все обязательные сессии недели: ручные статусом, сессии с задачами попыткой. */
export function completeWeek(
  state: UserState,
  weekNumber: number,
  manualStatus: SessionStatus = "done",
): UserState {
  let next = state;
  for (const session of plan.weeks[weekNumber - 1].days.flatMap((d) => d.sessions)) {
    if (!countsTowardProgress(session)) continue;
    next = isManualSession(session)
      ? setSessionStatus(next, session.id, manualStatus, DATE)
      : addAttempt(next, session.itemId!, "clean", DATE);
  }
  return next;
}

export const emptyState = createInitialState;
