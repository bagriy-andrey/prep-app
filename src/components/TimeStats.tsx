import { plan } from "../data/plan";
import { entriesInRange, minutesOnDate, sumMinutes } from "../domain/time";
import { locateDate, weekRange } from "../domain/schedule";
import { useTimeEntries } from "../hooks/useTimeEntries";
import { formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

/** Потраченное время: сегодня, эта неделя, весь курс. */
export default function TimeStats({ today }: { today: string }) {
  const { startDate } = useUserState();
  const entries = useTimeEntries();
  const loc = locateDate(plan, today, startDate);
  const week = loc ? weekRange(startDate, loc.week) : null;
  const stats = [
    { label: "Сегодня", value: formatMinutes(minutesOnDate(entries, today)) },
    { label: "Неделя", value: week ? formatMinutes(sumMinutes(entriesInRange(entries, week.from, week.to))) : "—" },
    { label: "Весь курс", value: formatMinutes(sumMinutes(entries)) },
  ];
  return (
    <dl aria-label="Потраченное время" className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
          <dt className="text-xs text-slate-500 dark:text-slate-400">{s.label}</dt>
          <dd className="text-sm font-semibold tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
