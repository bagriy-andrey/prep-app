import type { Week } from "../data/types";
import PhaseBadge from "./PhaseBadge";
import PrizeBadge from "./PrizeBadge";

export default function WeekHeader({ week }: { week: Week }) {
  const cp = week.checkpoint;
  return (
    <header className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">Неделя {week.n}</h2>
        <PhaseBadge phase={week.phase} />
      </div>
      <p className="mt-1 font-medium">{week.title}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">Веб-основы: {week.webTopic}</p>
      <div className="mt-2">
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
