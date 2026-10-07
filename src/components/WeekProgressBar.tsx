import type { WeekProgress } from "../domain/progress";

export default function WeekProgressBar({ progress, label }: { progress: WeekProgress; label: string }) {
  const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-slate-600 dark:text-slate-400">
          {progress.done} из {progress.total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.done}
        className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className={`h-full rounded-full ${progress.closed ? "bg-emerald-500" : "bg-indigo-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
