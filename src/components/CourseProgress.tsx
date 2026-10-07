import { plan } from "../data/plan";
import { courseProgress } from "../domain/progress";
import { plural } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

/** Общий прогресс курса: виден на всех экранах. */
export default function CourseProgress() {
  const { state } = useUserState();
  const p = courseProgress(plan, state);
  const detail = `Закрыто ${p.closedWeeks} из ${p.weeks} ${plural(p.weeks, ["недели", "недель", "недель"])}; сделано ${p.done} из ${p.total} сессий`;
  return (
    <div className="min-w-0" title={detail}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">Курс</span>
        <span className="tabular-nums text-slate-600 dark:text-slate-400">
          <span>
            закрыто {p.closedWeeks} из {p.weeks} нед. ·{" "}
          </span>
          <strong className="font-semibold text-slate-900 dark:text-slate-100">{p.percent}%</strong>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Общий прогресс курса"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p.percent}
        aria-valuetext={`${p.percent}%. ${detail}`}
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className={`h-full rounded-full ${p.percent === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
          style={{ width: `${p.percent}%` }}
        />
      </div>
    </div>
  );
}
