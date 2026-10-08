import type { Day } from "../data/types";
import { dayProgress, DAY_STATUS_LABEL, dayStatus, plannedDayAt, type DayStatus } from "../domain/calendar";
import { toPercent } from "../domain/progress";
import { minutesOnDate, plannedMinutesForDay } from "../domain/time";
import { extraTasksOn } from "../domain/userState";
import { useTimeEntries } from "../hooks/useTimeEntries";
import { formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import { HeaderBar, StatusBadge, type BadgeTone } from "./HeaderBar";

const STATUS_TONE: Record<DayStatus, BadgeTone> = {
  all: "good",
  partial: "good",
  light: "warn",
  missed: "bad",
  rest: "neutral",
  future: "neutral",
};

/** Статус дня и индикаторы для шапки карточки: «сделано» и время. Оформление общее с карточкой недели. */
export function useDayHeader({ day, date, today }: { day: Day; date: string; today: string }) {
  const { state, startDate, plan } = useUserState();
  const entries = useTimeEntries();
  const planned = plannedDayAt(plan, date, startDate)!;
  const status = dayStatus(planned, state, today);
  const { done, total } = dayProgress(planned, state);
  const label = date === today && status === "future" ? "Сегодня" : DAY_STATUS_LABEL[status];
  const spent = minutesOnDate(entries, date);
  const plannedMin = plannedMinutesForDay(day);
  const percent = toPercent(done, total);

  return {
    badge: <StatusBadge tone={STATUS_TONE[status]}>{status === "rest" ? "Выходной по плану" : label}</StatusBadge>,
    bars:
      status === "rest" ? null : (
        <div className="flex items-center gap-3">
          <HeaderBar
            label="Сделано за день"
            detail={`Сделано ${done} из ${total}`}
            fill={percent}
            text={`${percent}%`}
            done={total > 0 && done === total}
          />
          <HeaderBar
            label="Потрачено за день"
            detail={`Фактически ${formatMinutes(spent)} из ${formatMinutes(plannedMin)} по плану`}
            fill={plannedMin === 0 ? 0 : (spent / plannedMin) * 100}
            text={formatMinutes(spent)}
          />
        </div>
      ),
  };
}

/** Для прошедших дней: невыполненные сессии. Для остальных ничего не показывает. */
export function DayMissed({ day, date, today }: { day: Day; date: string; today: string }) {
  const { state, startDate, plan } = useUserState();
  const planned = plannedDayAt(plan, date, startDate)!;
  const { remainingIds } = dayProgress(planned, state);
  const skipped = day.sessions.filter((s) => remainingIds.includes(s.id));
  const extra = extraTasksOn(state, date);
  if (date >= today || (skipped.length === 0 && extra.length === 0)) return null;

  return (
    <section aria-label="Итог дня" className="mt-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
      {skipped.length > 0 && (
        <>
          <p className="font-medium">Не выполнено:</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700 dark:text-slate-300">
            {skipped.map((s) => (
              <li key={s.id}>
                {s.title}
                {state.sessions[s.id]?.status === "moved" && <span className="text-slate-500"> (отложено)</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {extra.length > 0 && (
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Свои задачи: сделано {extra.filter((t) => t.done).length} из {extra.length}.
        </p>
      )}
    </section>
  );
}
