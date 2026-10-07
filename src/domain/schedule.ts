import type { Day, MaintenanceDay, Plan, Week } from "../data/types";
import { addDays, dayOfWeek, diffDays } from "./dates";

/** Дата дня: startDate + (week.n - 1) * 7 + day.offset. */
export function dayDate(startDate: string, week: number, offset: number): string {
  return addDays(startDate, (week - 1) * 7 + offset);
}

export function weekStart(startDate: string, week: number): string {
  return dayDate(startDate, week, 0);
}

export type TodayPosition =
  | { kind: "before"; daysLeft: number }
  | { kind: "in"; week: Week; day: Day; date: string }
  | { kind: "after"; date: string; day: MaintenanceDay | undefined; dow: number };

export function resolveToday(
  plan: Plan,
  today: string,
  startDate: string = plan.meta.startDate,
): TodayPosition {
  const sinceStart = diffDays(startDate, today);
  if (sinceStart < 0) return { kind: "before", daysLeft: -sinceStart };

  const weekIndex = Math.floor(sinceStart / 7);
  const offset = sinceStart % 7;
  if (weekIndex < plan.meta.weeksCount) {
    const week = plan.weeks[weekIndex];
    const day = week.days.find((d) => d.offset === offset);
    if (!day) throw new Error(`В неделе ${week.n} нет дня со сдвигом ${offset}`);
    return { kind: "in", week, day, date: today };
  }

  const dow = dayOfWeek(today);
  return {
    kind: "after",
    date: today,
    dow,
    day: plan.maintenanceWeek.days.find((d) => d.dow === dow),
  };
}

/** Неделя, которую показывать в «Плане» по умолчанию: текущая, до старта первая, после конца последняя. */
export function defaultWeekNumber(plan: Plan, today: string, startDate: string = plan.meta.startDate): number {
  const sinceStart = diffDays(startDate, today);
  if (sinceStart < 0) return 1;
  return Math.min(Math.floor(sinceStart / 7) + 1, plan.meta.weeksCount);
}

/** Пара (номер недели, день) для даты внутри плана; null вне плана. */
export function locateDate(
  plan: Plan,
  date: string,
  startDate: string = plan.meta.startDate,
): { week: number; offset: number } | null {
  const sinceStart = diffDays(startDate, date);
  if (sinceStart < 0) return null;
  const week = Math.floor(sinceStart / 7) + 1;
  if (week > plan.meta.weeksCount) return null;
  return { week, offset: sinceStart % 7 };
}

/** Ключ отметки для сессии недели 17+, у которой нет id: m-<дата>-s<номер с единицы>. */
export function maintenanceSessionId(date: string, index: number): string {
  return `m-${date}-s${index + 1}`;
}
