import { forwardRef } from "react";
import type { Day } from "../data/types";
import { dayName, formatDateRu, formatMinutes } from "../lib/format";
import LightAlternative from "./LightAlternative";
import SessionRow from "./SessionRow";

interface Props {
  day: Day;
  date: string;
  isToday: boolean;
  isSelected: boolean;
}

const DayCard = forwardRef<HTMLElement, Props>(function DayCard({ day, date, isToday, isSelected }, ref) {
  const total = day.sessions.filter((s) => !s.optional).reduce((sum, s) => sum + s.minutes, 0);
  const ring = isToday
    ? "border-indigo-500 ring-2 ring-indigo-500/30"
    : isSelected
      ? "border-slate-500 ring-2 ring-slate-500/30"
      : "border-slate-200 dark:border-slate-800";
  const headingId = `day-${date}`;

  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      aria-current={isToday ? "date" : undefined}
      className={`scroll-mt-16 rounded-xl border bg-white p-4 dark:bg-slate-900 ${ring}`}
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 id={headingId} className="font-semibold">
          {dayName(day.dow)}, {formatDateRu(date)}
          {isToday && <span className="ml-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">сегодня</span>}
        </h3>
        {total > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">{formatMinutes(total)}</span>}
      </header>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {day.sessions.map((s) => (
          <SessionRow key={s.id} {...s} />
        ))}
      </ul>
      {day.lightAlternative && <LightAlternative text={day.lightAlternative} />}
    </section>
  );
});

export default DayCard;
