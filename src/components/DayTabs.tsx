import { useRef } from "react";
import type { KeyboardEvent } from "react";
import type { Week } from "../data/types";
import { dayProgress, DAY_STATUS_LABEL, dayStatus, plannedDayAt } from "../domain/calendar";
import { parseDate } from "../domain/dates";
import { toPercent } from "../domain/progress";
import { dayDate } from "../domain/schedule";
import type { DayStatus } from "../domain/calendar";
import { useCenterActive } from "../hooks/useCenterActive";
import { dayName, dayShort, monthShort } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

interface Props {
  week: Week;
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
}

// Кнопка дня: рамка по статусу, заливка слева направо по проценту выполненного. Статус дублируется подписью в aria-label.
const TAB_STYLE: Record<DayStatus, { box: string; fill: string }> = {
  all: { box: "border-emerald-500 bg-white dark:bg-slate-900", fill: "bg-emerald-300 dark:bg-emerald-700" },
  partial: { box: "border-emerald-300 bg-white dark:border-emerald-800 dark:bg-slate-900", fill: "bg-emerald-200 dark:bg-emerald-900" },
  light: { box: "border-amber-400 bg-white dark:border-amber-700 dark:bg-slate-900", fill: "bg-amber-200 dark:bg-amber-900" },
  missed: { box: "border-rose-300 bg-rose-100 dark:border-rose-800 dark:bg-rose-950", fill: "" },
  rest: { box: "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500", fill: "" },
  future: { box: "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900", fill: "bg-indigo-100 dark:bg-indigo-950" },
};

export const DAY_PANEL_ID = "day-panel";
export const dayTabId = (date: string) => `day-tab-${date}`;

/** Переключатель дней недели: на каждой кнопке процент выполненного за день. */
export default function DayTabs({ week, selectedDate, today, onSelect }: Props) {
  const { state, startDate, plan } = useUserState();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const box = useRef<HTMLDivElement>(null);
  useCenterActive(box, selectedDate);
  const dates = week.days.map((d) => dayDate(startDate, week.n, d.offset));

  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = dates.length - 1;
    const next =
      e.key === "ArrowRight" ? Math.min(index + 1, last)
      : e.key === "ArrowLeft" ? Math.max(index - 1, 0)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onSelect(dates[next]);
    refs.current[dates[next]]?.focus();
  }

  return (
    <div
      ref={box}
      role="tablist"
      aria-label={`Дни недели ${week.n}`}
      className="relative flex gap-1.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible sm:pb-0"
    >
      {week.days.map((day, i) => {
        const date = dates[i];
        const planned = plannedDayAt(plan, date, startDate)!;
        const status = dayStatus(planned, state, today);
        const { done, total } = dayProgress(planned, state);
        const percent = toPercent(done, total);
        const selected = date === selectedDate;
        const isToday = date === today;
        const label = planned.rest
          ? "Отдых"
          : `${percent}%`;
        return (
          <button
            key={date}
            ref={(el) => {
              refs.current[date] = el;
            }}
            role="tab"
            type="button"
            id={dayTabId(date)}
            aria-selected={selected}
            aria-controls={DAY_PANEL_ID}
            tabIndex={selected ? 0 : -1}
            aria-label={`${dayName(day.dow)}, ${parseDate(date).getDate()} ${monthShort(date)}: ${DAY_STATUS_LABEL[status]}${planned.rest ? "" : `, выполнено ${percent}%`}${isToday ? ", сегодня" : ""}`}
            onClick={() => onSelect(date)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative min-w-32 shrink-0 overflow-hidden rounded-md border px-2 py-1.5 text-center text-sm sm:min-w-0 ${TAB_STYLE[status].box} ${
              selected ? "ring-2 ring-indigo-600 ring-offset-1 dark:ring-indigo-400 dark:ring-offset-slate-950" : ""
            }`}
          >
            {percent > 0 && !planned.rest && (
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 ${TAB_STYLE[status].fill}`}
                style={{ width: `${percent}%` }}
              />
            )}
            <span className="relative whitespace-nowrap tabular-nums">
              <span className="font-semibold">{dayShort(day.dow)}</span> {parseDate(date).getDate()} {monthShort(date)}
              <span aria-hidden="true"> · {label}</span>
              {isToday && <span aria-hidden="true" className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 align-middle" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
