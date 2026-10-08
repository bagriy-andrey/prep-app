import type { Week } from "../data/types";
import { weekProgress } from "../domain/progress";
import { weekRange } from "../domain/schedule";
import { entriesInRange, plannedMinutesForWeek, sumMinutes } from "../domain/time";
import { useTimeEntries } from "../hooks/useTimeEntries";
import { formatDateRange, formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import PhaseBadge from "./PhaseBadge";
import PrizeInfoButton from "./PrizeInfoButton";
import { cardHeaderClass, HeaderBar, StatusBadge } from "./HeaderBar";
import WeekNote from "./WeekNote";

export default function WeekHeader({ week }: { week: Week }) {
  const { state, startDate, plan } = useUserState();
  const range = weekRange(startDate, week.n);
  const spent = sumMinutes(entriesInRange(useTimeEntries(), range.from, range.to));
  const progress = weekProgress(week, state);
  const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);
  const cp = week.checkpoint;
  const planned = plannedMinutesForWeek(plan, week.n);
  return (
    <header className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className={cardHeaderClass}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">
            Неделя {week.n}
            <span className="text-sm font-normal text-slate-600 dark:text-slate-400"> · {formatDateRange(range.from, range.to)}</span>
          </h2>
          <PhaseBadge phase={week.phase} />
          <StatusBadge tone={progress.closed ? "good" : "neutral"}>
            {progress.closed ? "Завершена" : progress.done === 0 ? "Не начата" : "В процессе"}
          </StatusBadge>
          <PrizeInfoButton week={week} />
        </div>
        <div className="flex items-center gap-3">
          <HeaderBar
            label="Сессии недели"
            detail={`Сделано ${progress.done} из ${progress.total}`}
            fill={percent}
            text={`${percent}%`}
            done={progress.closed}
          />
          <HeaderBar
            label="Потрачено за неделю"
            detail={`Фактически ${formatMinutes(spent)} из ${formatMinutes(planned)} по плану`}
            fill={planned === 0 ? 0 : (spent / planned) * 100}
            text={formatMinutes(spent)}
          />
        </div>
      </div>

      <p className="mt-2 font-medium">{week.title}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">Веб-основы: {week.webTopic}</p>
      <div className="mt-3">
        <WeekNote week={week.n} />
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
