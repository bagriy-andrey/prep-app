import { plan } from "../data/plan";
import type { Day } from "../data/types";
import { dayProgress, DAY_STATUS_LABEL, dayStatus, plannedDayAt, type DayStatus } from "../domain/calendar";
import { toPercent } from "../domain/progress";
import { minutesOnDate, plannedMinutesForDay } from "../domain/time";
import { useTimeEntries } from "../hooks/useTimeEntries";
import { formatMinutes } from "../lib/format";
import { extraTasksOn } from "../domain/userState";
import { useUserState } from "../state/UserStateProvider";

const HEADLINE: Record<DayStatus, string> = {
  all: "Закончен: всё сделано",
  partial: "Закончен не полностью",
  light: "Лёгкий день",
  missed: "Пропущен: ничего не сделано",
  rest: "Выходной по плану",
  future: "Впереди",
};

/** Итог дня над списком сессий: статус, прогресс и что не сделано. */
export default function DaySummary({ day, date, today }: { day: Day; date: string; today: string }) {
  const { state, startDate } = useUserState();
  const entries = useTimeEntries();
  const planned = plannedDayAt(plan, date, startDate)!;
  const status = dayStatus(planned, state, today);
  const { done, total, remainingIds } = dayProgress(planned, state);
  const isPast = date < today;
  const skipped = day.sessions.filter((s) => remainingIds.includes(s.id));
  const extra = extraTasksOn(state, date);

  if (status === "rest") {
    return <p className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">{HEADLINE.rest}.</p>;
  }

  const headline = date === today && status === "future" ? "Сегодня: пока ничего не отмечено" : HEADLINE[status];

  return (
    <section
      aria-label="Итог дня"
      className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800"
    >
      <p>
        <strong className="font-semibold">{headline}.</strong>{" "}
        <span className="text-slate-600 dark:text-slate-400">
          Сделано {done} из {total} ({toPercent(done, total)}%).
        </span>
        <span className="sr-only"> Статус: {DAY_STATUS_LABEL[status]}.</span>
      </p>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Потрачено: <strong className="font-semibold text-slate-900 dark:text-slate-100">{formatMinutes(minutesOnDate(entries, date))}</strong>
        {" "}из {formatMinutes(plannedMinutesForDay(day))} по плану.
        {extra.length > 0 && ` Свои задачи: сделано ${extra.filter((t) => t.done).length} из ${extra.length}.`}
      </p>
      {isPast && skipped.length > 0 && (
        <div className="mt-2">
          <p className="font-medium">Не выполнено:</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700 dark:text-slate-300">
            {skipped.map((s) => (
              <li key={s.id}>
                {s.title}
                {state.sessions[s.id]?.status === "moved" && <span className="text-slate-500"> (перенесено)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
