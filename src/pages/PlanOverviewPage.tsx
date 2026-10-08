import { useState } from "react";
import { Link } from "react-router";
import PhaseBadge from "../components/PhaseBadge";
import { subtleButton } from "../components/ui";
import { dayDate, defaultWeekNumber, weekRange } from "../domain/schedule";
import { TOPICS } from "../domain/topics";
import { extraTasksOn } from "../domain/userState";
import { weekProgress } from "../domain/progress";
import { plannedMinutesForDay, plannedMinutesForWeek } from "../domain/time";
import { useToday } from "../hooks/useToday";
import { dayName, formatDateRange, formatDateRu, formatMinutes, TIER_LABEL } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

/** Описание всего плана на одной странице: недели, дни и сессии. */
export default function PlanOverviewPage() {
  const { state, startDate, plan } = useUserState();
  const today = useToday();
  const current = defaultWeekNumber(plan, today, startDate);
  const [open, setOpen] = useState<Set<number>>(() => new Set([current]));

  const setAll = (all: boolean) => setOpen(all ? new Set(plan.weeks.map((w) => w.n)) : new Set());
  const toggle = (n: number, isOpen: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(n);
      else next.delete(n);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Весь план</h1>
        <Link to="/plan" className={subtleButton}>
          К неделе
        </Link>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {plan.meta.title}: {plan.meta.weeksCount} недель, около {plan.meta.hoursPerWeek} ч в неделю.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={subtleButton} onClick={() => setAll(true)}>
          Развернуть все
        </button>
        <button type="button" className={subtleButton} onClick={() => setAll(false)}>
          Свернуть все
        </button>
      </div>

      <ol className="space-y-3">
        {plan.weeks.map((week) => {
          const range = weekRange(startDate, week.n);
          const progress = weekProgress(week, state);
          return (
            <li key={week.n}>
              <details
                open={open.has(week.n)}
                onToggle={(e) => toggle(week.n, e.currentTarget.open)}
                className={`rounded-xl border bg-white p-4 dark:bg-slate-900 ${
                  week.n === current ? "border-indigo-500" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <summary className="cursor-pointer">
                  <span className="font-semibold">Неделя {week.n}</span>
                  <span className="text-slate-600 dark:text-slate-400"> · {formatDateRange(range.from, range.to)}</span>
                  <span className="ml-2 inline-flex align-middle">
                    <PhaseBadge phase={week.phase} />
                  </span>
                  <span className="mt-1 block font-medium">{week.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    Сессий {progress.done} из {progress.total}
                    {progress.closed ? " · завершена" : ""} · {formatMinutes(plannedMinutesForWeek(plan, week.n))} по плану
                  </span>
                </summary>

                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-slate-600 dark:text-slate-400">Веб-основы: {week.webTopic}</p>
                  <p>
                    <span aria-hidden="true">🎁 </span>
                    {TIER_LABEL[week.prize.tier]}: <strong className="font-semibold">{week.prize.title}</strong>
                  </p>
                  {week.checkpoint && (
                    <p className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                      <strong className="font-semibold">Контрольная точка:</strong> алгоритмов {week.checkpoint.dsa}, JS{" "}
                      {week.checkpoint.js}, UI {week.checkpoint.ui}, дизайнов {week.checkpoint.sd}, историй{" "}
                      {week.checkpoint.stories}, моков {week.checkpoint.mocks}.
                    </p>
                  )}
                  <ul className="space-y-3">
                    {week.days.map((day) => {
                      const date = dayDate(startDate, week.n, day.offset);
                      const sessions = day.sessions.filter((s) => s.block !== "rest");
                      const extras = extraTasksOn(state, date);
                      return (
                        <li key={day.offset}>
                          <p className="font-medium">
                            <Link
                              to={`/plan/${week.n}?day=${date}`}
                              className="text-indigo-700 underline dark:text-indigo-300"
                            >
                              {dayName(day.dow)}, {formatDateRu(date)}
                            </Link>
                            {sessions.length > 0 && (
                              <span className="font-normal text-slate-500 dark:text-slate-400">
                                {" "}
                                · {formatMinutes(plannedMinutesForDay(day))}
                              </span>
                            )}
                          </p>
                          {sessions.length === 0 && extras.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400">
                              {day.sessions.find((s) => s.block === "rest")?.title ?? "Отдых"}
                            </p>
                          ) : (
                            <ul className="mt-1 list-disc space-y-0.5 pl-5">
                              {sessions.map((s) => (
                                <li key={s.id}>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {plan.blocks[s.block] ?? s.block}, {formatMinutes(s.minutes)}
                                    {s.optional ? ", необязательно" : ""}:{" "}
                                  </span>
                                  {s.title}
                                </li>
                              ))}
                              {extras.map((t) => (
                                <li key={t.id}>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    Своя задача, {TOPICS.find((x) => x.key === t.topic)?.label ?? t.topic}
                                    {t.minutes !== undefined ? `, ${formatMinutes(t.minutes)}` : ""}:{" "}
                                  </span>
                                  {t.title}
                                  {t.done && <span className="text-emerald-700 dark:text-emerald-400"> ✓</span>}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <Link to={`/plan/${week.n}`} className={subtleButton + " inline-block"}>
                    Открыть неделю
                  </Link>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
