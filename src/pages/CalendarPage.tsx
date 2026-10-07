import { Link } from "react-router";
import PhaseBadge from "../components/PhaseBadge";
import { plan } from "../data/plan";
import { DAY_STATUS_LABEL, dayStatus, plannedDayAt, type DayStatus } from "../domain/calendar";
import { STYLE } from "../lib/dayStatusStyle";
import { prizeInfo } from "../domain/prizes";
import { dayDate } from "../domain/schedule";
import { parseDate } from "../domain/dates";
import { useToday } from "../hooks/useToday";
import { dayName, dayShort, formatDateRu, TIER_LABEL } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

const LEGEND: DayStatus[] = ["all", "partial", "light", "missed", "rest", "future"];
const ROW = "grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] items-center gap-1";

export default function CalendarPage() {
  const today = useToday();
  const { state, startDate } = useUserState();

  return (
    <>
      <h1 className="mb-3 text-xl font-semibold">Календарь</h1>

      <ul aria-label="Обозначения" className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {LEGEND.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[11px] ${STYLE[s].cell}`}
            >
              {STYLE[s].mark}
            </span>
            {DAY_STATUS_LABEL[s]}
          </li>
        ))}
      </ul>

      <div role="group" aria-label="Сетка недель" className="space-y-1">
        <div className={`${ROW} text-center text-xs text-slate-500 dark:text-slate-400`} aria-hidden="true">
          <span />
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <span key={d}>{dayShort(d)}</span>
          ))}
        </div>

        {plan.weeks.map((week) => {
          const isBuffer = week.phase === "buffer";
          const isBlockEnd = plan.rules.bigPrizeWeeks.includes(week.n);
          const prize = prizeInfo(plan, week, state);
          return (
            <div key={week.n} className="space-y-1">
              <div
                className={`${ROW} rounded-lg ${isBuffer ? "bg-amber-50 p-1 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:ring-amber-800" : "p-1"}`}
              >
                <div className="text-xs leading-tight">
                  <span className="block font-semibold">Нед. {week.n}</span>
                  {isBuffer && <span className="block text-amber-800 dark:text-amber-300">буфер</span>}
                </div>
                {week.days.map((day) => {
                  const date = dayDate(startDate, week.n, day.offset);
                  const status = dayStatus(plannedDayAt(plan, date, startDate)!, state, today);
                  const isToday = date === today;
                  const label = `${dayName(day.dow)}, ${formatDateRu(date)}, неделя ${week.n}: ${DAY_STATUS_LABEL[status]}${isToday ? ", сегодня" : ""}`;
                  return (
                    <Link
                      key={date}
                      to={`/plan/${week.n}?day=${date}`}
                      aria-label={label}
                      title={label}
                      className={`relative flex h-11 flex-col items-center justify-center rounded-md border text-xs leading-none ${STYLE[status].cell} ${isToday ? "ring-2 ring-indigo-600 ring-offset-1 dark:ring-indigo-400 dark:ring-offset-slate-950" : ""}`}
                    >
                      <span className="tabular-nums">{parseDate(date).getDate()}</span>
                      <span aria-hidden="true" className="mt-0.5 h-3 text-[11px]">
                        {STYLE[status].mark}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 px-1 pb-1 text-xs text-slate-500 dark:text-slate-400">
                <PhaseBadge phase={week.phase} />
                <span className="truncate">{week.title}</span>
              </div>

              {isBlockEnd && (
                <Link
                  to="/prizes"
                  className={`mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                    prize.status === "available"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                      : prize.status === "claimed"
                        ? "border-emerald-400 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                        : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <span>
                    <span aria-hidden="true">🎁 </span>
                    {TIER_LABEL[week.prize.tier]}: <strong className="font-semibold">{week.prize.title}</strong>
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {prize.status === "claimed"
                      ? "получен"
                      : prize.status === "available"
                        ? "доступен"
                        : `закрыто недель блока: ${prize.closedWeeks} из ${prize.requiredWeeks.length}`}
                  </span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
