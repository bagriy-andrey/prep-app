import type { Week } from "../data/types";
import { weekProgress } from "../domain/progress";
import { weekRange } from "../domain/schedule";
import { entriesInRange, plannedMinutesForWeek, sumMinutes } from "../domain/time";
import { useTimeEntries } from "../hooks/useTimeEntries";
import { plan } from "../data/plan";
import { formatDateRange, formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import PhaseBadge from "./PhaseBadge";
import PrizeBadge from "./PrizeBadge";
import WeekProgressBar from "./WeekProgressBar";

export default function WeekHeader({ week }: { week: Week }) {
  const { state, startDate } = useUserState();
  const range = weekRange(startDate, week.n);
  const spent = sumMinutes(entriesInRange(useTimeEntries(), range.from, range.to));
  const progress = weekProgress(week, state);
  const cp = week.checkpoint;
  return (
    <header className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">
          Неделя {week.n}
          <span className="font-normal text-slate-600 dark:text-slate-400"> · {formatDateRange(range.from, range.to)}</span>
        </h2>
        <PhaseBadge phase={week.phase} />
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            progress.closed
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {progress.closed ? "Закрыта" : "Не закрыта"}
        </span>
      </div>
      <p className="mt-1 font-medium">{week.title}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">Веб-основы: {week.webTopic}</p>
      <div className="mt-3">
        <WeekProgressBar progress={progress} label="Сессии недели" />
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Потрачено за неделю: <strong className="font-semibold text-slate-900 dark:text-slate-100">{formatMinutes(spent)}</strong>{" "}
          из {formatMinutes(plannedMinutesForWeek(plan, week.n))} по плану
        </p>
      </div>
      <div className="mt-3">
        <PrizeBadge prize={week.prize} />
      </div>
      {cp && (
        <p className="mt-3 rounded-lg bg-slate-100 p-2 text-sm dark:bg-slate-800">
          <strong className="font-semibold">Контрольная точка:</strong> алгоритмов {cp.dsa}, JS {cp.js}, UI {cp.ui}, дизайнов{" "}
          {cp.sd}, историй {cp.stories}, моков {cp.mocks}.
        </p>
      )}
    </header>
  );
}
