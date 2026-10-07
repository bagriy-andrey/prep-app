// Учёт потраченного времени: за день, неделю, весь курс и по темам.
// Время считается по датам, в которые оно записано (отметка сессии или попытка), а не по плановым.

import type { Day, Plan } from "../data/types";
import { addDays, dayOfWeek } from "./dates";
import { countsTowardProgress } from "./progress";
import { weekRange } from "./schedule";
import type { UserState } from "./userState";

export type TopicKey =
  | "algorithms"
  | "js"
  | "ui"
  | "system-design"
  | "web"
  | "behavioral"
  | "mock"
  | "review"
  | "other";

/** Темы статистики: каждая объединяет блоки плана. */
export const TOPICS: { key: TopicKey; label: string; blocks: string[] }[] = [
  { key: "algorithms", label: "Алгоритмы", blocks: ["dsa", "warmup"] },
  { key: "js", label: "JS-кодинг", blocks: ["js"] },
  { key: "ui", label: "UI-компоненты", blocks: ["ui"] },
  { key: "system-design", label: "System design", blocks: ["fe-sd", "be-sd", "sd-review", "sd-theory"] },
  { key: "web", label: "Веб-основы и теория", blocks: ["web", "theory"] },
  { key: "behavioral", label: "Behavioral", blocks: ["behavioral"] },
  { key: "mock", label: "Моки и симуляции", blocks: ["mock", "simulation"] },
  { key: "review", label: "Повторения", blocks: ["review"] },
  { key: "other", label: "Прочее", blocks: ["checkpoint", "week-review", "spare"] },
];

export function topicOfBlock(block: string): TopicKey {
  return TOPICS.find((t) => t.blocks.includes(block))?.key ?? "other";
}

const MAINTENANCE_ID = /^m-(\d{4}-\d{2}-\d{2})-s(\d+)$/;

const blockIndexCache = new WeakMap<Plan, Map<string, string>>();

function blockIndex(plan: Plan): Map<string, string> {
  let index = blockIndexCache.get(plan);
  if (!index) {
    index = new Map(plan.weeks.flatMap((w) => w.days.flatMap((d) => d.sessions.map((s) => [s.id, s.block] as const))));
    blockIndexCache.set(plan, index);
  }
  return index;
}

/** Блок сессии по её id, включая сессии недели 17+ (m-<дата>-s<номер>). */
export function blockOfSession(plan: Plan, sessionId: string): string | undefined {
  const known = blockIndex(plan).get(sessionId);
  if (known) return known;
  const m = MAINTENANCE_ID.exec(sessionId);
  if (!m) return undefined;
  const day = plan.maintenanceWeek.days.find((d) => d.dow === dayOfWeek(m[1]));
  return day?.sessions[Number(m[2]) - 1]?.block;
}

export interface TimeEntry {
  date: string;
  minutes: number;
  topic: TopicKey;
}

/** Все записи времени: сделанные сессии (done, light) и попытки по задачам. */
export function timeEntries(plan: Plan, state: UserState): TimeEntry[] {
  const entries: TimeEntry[] = [];
  for (const [id, mark] of Object.entries(state.sessions)) {
    if (mark.status === "moved" || !mark.minutes) continue;
    const block = blockOfSession(plan, id);
    entries.push({ date: mark.date, minutes: mark.minutes, topic: block ? topicOfBlock(block) : "other" });
  }
  for (const [itemId, item] of Object.entries(state.items)) {
    const kind = plan.items.find((i) => i.id === itemId)?.kind;
    for (const attempt of item.attempts) {
      if (!attempt.minutes) continue;
      entries.push({ date: attempt.date, minutes: attempt.minutes, topic: kind ? topicOfBlock(kind) : "other" });
    }
  }
  return entries;
}

export const sumMinutes = (entries: TimeEntry[]) => entries.reduce((sum, e) => sum + e.minutes, 0);

export const minutesOnDate = (entries: TimeEntry[], date: string) =>
  sumMinutes(entries.filter((e) => e.date === date));

/** Включая обе границы. */
export const entriesInRange = (entries: TimeEntry[], from: string, to: string) =>
  entries.filter((e) => e.date >= from && e.date <= to);

export interface TopicTime {
  key: TopicKey;
  label: string;
  minutes: number;
}

/** Время по темам, от большего к меньшему, без тем с нулём. */
export function minutesByTopic(entries: TimeEntry[]): TopicTime[] {
  return TOPICS.map((t) => ({
    key: t.key,
    label: t.label,
    minutes: sumMinutes(entries.filter((e) => e.topic === t.key)),
  }))
    .filter((t) => t.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

/** Плановое время дня: обязательные сессии. */
export const plannedMinutesForDay = (day: Day) =>
  day.sessions.filter(countsTowardProgress).reduce((sum, s) => sum + s.minutes, 0);

export const plannedMinutesForWeek = (plan: Plan, week: number) =>
  plan.weeks[week - 1].days.reduce((sum, d) => sum + plannedMinutesForDay(d), 0);

export interface WeekTime {
  week: number;
  from: string;
  to: string;
  minutes: number;
  planned: number;
}

export function minutesByWeek(plan: Plan, entries: TimeEntry[], startDate: string): WeekTime[] {
  return plan.weeks.map((w) => {
    const { from, to } = weekRange(startDate, w.n);
    return {
      week: w.n,
      from,
      to,
      minutes: sumMinutes(entriesInRange(entries, from, to)),
      planned: plannedMinutesForWeek(plan, w.n),
    };
  });
}

export interface DayTime {
  date: string;
  dow: number;
  minutes: number;
}

/** Время по семи дням недели плана. */
export function minutesByDay(entries: TimeEntry[], weekFrom: string): DayTime[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekFrom, i);
    return { date, dow: i + 1, minutes: minutesOnDate(entries, date) };
  });
}
