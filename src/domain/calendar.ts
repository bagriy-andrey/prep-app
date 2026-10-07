// Календарь дней, стрик и предупреждение о нагрузке (разд. 5.3, 6.5, 6.6).

import type { Plan } from "../data/types";
import { addDays, dayOfWeek, diffDays } from "./dates";
import { isSessionDone } from "./progress";
import { locateDate, maintenanceSessionId } from "./schedule";
import type { UserState } from "./userState";

export interface PlannedSession {
  id: string;
  itemId?: string;
  required: boolean;
}

export interface PlannedDay {
  date: string;
  /** Номер недели плана; null после недели 16. */
  week: number | null;
  /** Выходной по плану: стрик не прерывает и не увеличивает. */
  rest: boolean;
  /** Сессии без выходных. */
  sessions: PlannedSession[];
}

/** День по плану для даты; null до старта. После недели 16 дни берутся из maintenanceWeek. */
export function plannedDayAt(plan: Plan, date: string, startDate: string): PlannedDay | null {
  if (diffDays(startDate, date) < 0) return null;

  const loc = locateDate(plan, date, startDate);
  if (loc) {
    const day = plan.weeks[loc.week - 1].days.find((d) => d.offset === loc.offset);
    const sessions = (day?.sessions ?? [])
      .filter((s) => s.block !== "rest")
      .map((s) => ({ id: s.id, itemId: s.itemId, required: !s.optional }));
    return { date, week: loc.week, rest: sessions.length === 0, sessions };
  }

  const day = plan.maintenanceWeek.days.find((d) => d.dow === dayOfWeek(date));
  const sessions = (day?.sessions ?? []).map((_, i) => ({ id: maintenanceSessionId(date, i), required: true }));
  return { date, week: null, rest: sessions.length === 0, sessions };
}

export type DayStatus = "all" | "partial" | "light" | "missed" | "rest" | "future";

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  all: "Всё сделано",
  partial: "Сделано частично",
  light: "Лёгкий день",
  missed: "Пропущен",
  rest: "Выходной",
  future: "Впереди",
};

/** День лёгкий, если хотя бы одна его сессия отмечена как light. */
export function isLightDay(day: PlannedDay, state: UserState): boolean {
  return day.sessions.some((s) => state.sessions[s.id]?.status === "light");
}

/**
 * Статус дня для календаря. Отметки в будущих днях показываются как есть.
 * Сегодняшний день без отметок ещё не пропущен: он «впереди».
 */
export function dayStatus(day: PlannedDay, state: UserState, today: string): DayStatus {
  if (day.rest) return "rest";
  if (isLightDay(day, state)) return "light";

  const required = day.sessions.filter((s) => s.required);
  const done = required.filter((s) => isSessionDone(s, state)).length;
  if (required.length > 0 && done === required.length) return "all";
  if (done > 0) return "partial";
  return day.date < today ? "missed" : "future";
}

/** Даты, в которые сделана сессия (done, light), добавлена попытка или выполнена своя задача. */
function activityDates(state: UserState): Set<string> {
  const dates = new Set<string>();
  for (const mark of Object.values(state.sessions)) {
    if (mark.status === "done" || mark.status === "light") dates.add(mark.date);
  }
  for (const item of Object.values(state.items)) {
    for (const attempt of item.attempts) dates.add(attempt.date);
  }
  for (const task of state.extraTasks) {
    if (task.done) dates.add(task.date);
  }
  return dates;
}

export interface Streak {
  current: number;
  record: number;
}

/**
 * Подряд идущие плановые дни с активностью. Выходные не прерывают и не увеличивают стрик.
 * Сегодняшний день без активности стрик не прерывает.
 */
export function streak(plan: Plan, state: UserState, today: string, startDate: string): Streak {
  const total = diffDays(startDate, today);
  if (total < 0) return { current: 0, record: 0 };

  const active = activityDates(state);
  let run = 0;
  let record = 0;
  for (let i = 0; i <= total; i++) {
    const date = addDays(startDate, i);
    if (plannedDayAt(plan, date, startDate)!.rest) continue;
    if (active.has(date)) {
      run++;
      record = Math.max(record, run);
    } else if (date !== today) {
      run = 0;
    }
  }
  return { current: run, record };
}

export const LOAD_WINDOW_DAYS = 14;

/** Больше половины плановых дней за последние 14 дней отмечены как лёгкие. */
export function hasLoadWarning(plan: Plan, state: UserState, today: string, startDate: string): boolean {
  let planned = 0;
  let light = 0;
  for (let i = 0; i < LOAD_WINDOW_DAYS; i++) {
    const day = plannedDayAt(plan, addDays(today, -i), startDate);
    if (!day || day.rest) continue;
    planned++;
    if (isLightDay(day, state)) light++;
  }
  return light * 2 > planned;
}

export interface DayProgress {
  done: number;
  total: number;
  /** id обязательных сессий, которые ещё не сделаны. */
  remainingIds: string[];
}

/** Прогресс дня по обязательным сессиям; light считается сделанным, moved нет. */
export function dayProgress(day: PlannedDay, state: UserState): DayProgress {
  const required = day.sessions.filter((s) => s.required);
  const remaining = required.filter((s) => !isSessionDone(s, state));
  return { done: required.length - remaining.length, total: required.length, remainingIds: remaining.map((s) => s.id) };
}
