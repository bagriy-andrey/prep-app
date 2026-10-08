// Перенос сессий плана между днями и неделями. plan.json не меняется:
// «эффективный» план строится из исходного и перечня переносов из состояния.

import type { Day, Plan, Session, Week } from "../data/types";
import type { SessionMove, UserState } from "./userState";

export interface SessionPlace {
  week: number;
  offset: number;
}

/** Где сессия стоит в исходном плане; undefined, если сессии с таким id нет. */
export function sessionOrigin(plan: Plan, sessionId: string): SessionPlace | undefined {
  for (const week of plan.weeks) {
    for (const day of week.days) {
      if (day.sessions.some((s) => s.id === sessionId)) return { week: week.n, offset: day.offset };
    }
  }
  return undefined;
}

/** Переносимы только обязательные и необязательные сессии, но не выходной. */
export function isMovable(session: Pick<Session, "block">): boolean {
  return session.block !== "rest";
}

const samePlace = (a: SessionPlace, b: SessionPlace) => a.week === b.week && a.offset === b.offset;

/**
 * План с учётом переносов. Перенесённая сессия добавляется в конец целевого дня.
 * Переносы на несуществующий день и неизвестные id игнорируются. Без переносов возвращает тот же объект.
 */
export function applyMoves(plan: Plan, moves: Record<string, SessionMove>): Plan {
  const entries = Object.entries(moves);
  if (entries.length === 0) return plan;

  const sessions = new Map<string, Session>();
  const origin = new Map<string, SessionPlace>();
  for (const week of plan.weeks) {
    for (const day of week.days) {
      for (const s of day.sessions) {
        sessions.set(s.id, s);
        origin.set(s.id, { week: week.n, offset: day.offset });
      }
    }
  }

  const key = (p: SessionPlace) => `${p.week}:${p.offset}`;
  const removed = new Set<string>();
  const added = new Map<string, Session[]>();
  for (const [id, target] of entries) {
    const session = sessions.get(id);
    const from = origin.get(id);
    if (!session || !from || !isMovable(session) || samePlace(from, target)) continue;
    const targetDay = plan.weeks[target.week - 1]?.days.find((d) => d.offset === target.offset);
    if (!targetDay) continue;
    removed.add(id);
    added.set(key(target), [...(added.get(key(target)) ?? []), session]);
  }
  if (removed.size === 0) return plan;

  const weeks: Week[] = plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day): Day => {
      const extra = added.get(key({ week: week.n, offset: day.offset }));
      const kept = day.sessions.filter((s) => !removed.has(s.id));
      if (!extra && kept.length === day.sessions.length) return day;
      return { ...day, sessions: [...kept, ...(extra ?? [])] };
    }),
  }));
  return { ...plan, weeks };
}

/** Место сессии с учётом переноса. */
export function currentPlace(plan: Plan, state: Pick<UserState, "sessionMoves">, sessionId: string): SessionPlace | undefined {
  const origin = sessionOrigin(plan, sessionId);
  if (!origin) return undefined;
  const move = state.sessionMoves[sessionId];
  return move && plan.weeks[move.week - 1]?.days.some((d) => d.offset === move.offset) ? move : origin;
}
