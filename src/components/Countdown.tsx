import { formatDateRu, plural } from "../lib/format";

export default function Countdown({ daysLeft, startDate }: { daysLeft: number; startDate: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">До старта плана</p>
      <p className="my-2 text-5xl font-bold tabular-nums">{daysLeft}</p>
      <p className="text-lg">{plural(daysLeft, ["день", "дня", "дней"])}</p>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Старт: {formatDateRu(startDate)}</p>
    </section>
  );
}
