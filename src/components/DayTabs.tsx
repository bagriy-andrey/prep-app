import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { plan } from "../data/plan";
import type { Week } from "../data/types";
import { dayProgress, DAY_STATUS_LABEL, dayStatus, plannedDayAt } from "../domain/calendar";
import { parseDate } from "../domain/dates";
import { toPercent } from "../domain/progress";
import { dayDate } from "../domain/schedule";
import { STYLE } from "../lib/dayStatusStyle";
import { dayName, dayShort } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

interface Props {
  week: Week;
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
}

export const DAY_PANEL_ID = "day-panel";
export const dayTabId = (date: string) => `day-tab-${date}`;

/** Переключатель дней недели: на каждой кнопке процент выполненного за день. */
export default function DayTabs({ week, selectedDate, today, onSelect }: Props) {
  const { state, startDate } = useUserState();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
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
    <div role="tablist" aria-label={`Дни недели ${week.n}`} className="grid grid-cols-7 gap-1.5">
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
            aria-label={`${dayName(day.dow)}, ${parseDate(date).getDate()}: ${DAY_STATUS_LABEL[status]}${planned.rest ? "" : `, выполнено ${percent}%`}${isToday ? ", сегодня" : ""}`}
            onClick={() => onSelect(date)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative flex min-h-16 flex-col items-center justify-center rounded-lg border px-0.5 py-1.5 text-center leading-tight ${STYLE[status].cell} ${
              selected ? "ring-2 ring-indigo-600 ring-offset-1 dark:ring-indigo-400 dark:ring-offset-slate-950" : ""
            }`}
          >
            <span className="text-[11px] opacity-80">{dayShort(day.dow)}</span>
            <span className="text-base font-semibold tabular-nums">{parseDate(date).getDate()}</span>
            <span className="text-[11px] font-medium tabular-nums" aria-hidden="true">
              {label}
            </span>
            {isToday && (
              <span aria-hidden="true" className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
