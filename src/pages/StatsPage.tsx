import { useSearchParams } from "react-router";
import BarChart, { type Bar } from "../components/BarChart";
import { parseDate } from "../domain/dates";
import { locateDate, weekRange } from "../domain/schedule";
import {
  entriesInRange,
  minutesByDay,
  minutesByTopic,
  minutesByWeek,
  minutesOnDate,
  sumMinutes,
} from "../domain/time";
import { useTimeEntries } from "../hooks/useTimeEntries";
import { useToday } from "../hooks/useToday";
import { dayName, formatDateRange, formatDateRu, formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

const card = "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

export default function StatsPage() {
  const today = useToday();
  const { startDate, plan } = useUserState();
  const entries = useTimeEntries();
  const [params, setParams] = useSearchParams();

  const weekParam = Number(params.get("week"));
  const scopeWeek = Number.isInteger(weekParam) && weekParam >= 1 && weekParam <= plan.meta.weeksCount ? weekParam : null;
  const range = scopeWeek ? weekRange(startDate, scopeWeek) : null;
  const scoped = range ? entriesInRange(entries, range.from, range.to) : entries;
  const scopeTotal = sumMinutes(scoped);

  const todayLoc = locateDate(plan, today, startDate);
  const thisWeek = todayLoc ? weekRange(startDate, todayLoc.week) : null;

  const topics = minutesByTopic(scoped);
  const weeks = minutesByWeek(plan, entries, startDate);
  const days = range ? minutesByDay(entries, range.from) : null;

  const tiles = [
    { label: scopeWeek ? `Неделя ${scopeWeek}` : "Весь курс", value: formatMinutes(scopeTotal), big: true },
    { label: "Сегодня", value: formatMinutes(minutesOnDate(entries, today)) },
    {
      label: "Эта неделя",
      value: thisWeek ? formatMinutes(sumMinutes(entriesInRange(entries, thisWeek.from, thisWeek.to))) : "—",
    },
  ];

  const topicBars: Bar[] = topics.map((t) => ({
    key: t.key,
    label: t.label,
    value: t.minutes,
    detail: `${Math.round((t.minutes / scopeTotal) * 100)}% от ${scopeWeek ? "времени недели" : "всего времени"}`,
  }));

  const weekBars: Bar[] = weeks.map((w) => ({
    key: String(w.week),
    label: `Неделя ${w.week}`,
    value: w.minutes,
    plan: w.planned,
    dim: scopeWeek !== null && scopeWeek !== w.week,
    detail: `${formatDateRange(w.from, w.to)} · по плану ${formatMinutes(w.planned)}`,
  }));

  const dayBars: Bar[] =
    days?.map((d) => ({
      key: d.date,
      label: `${dayName(d.dow)}, ${parseDate(d.date).getDate()}`,
      value: d.minutes,
      detail: formatDateRu(d.date),
    })) ?? [];

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Статистика времени</h1>

      <div className="mb-4">
        <label htmlFor="scope" className="block text-sm font-medium">
          Период
        </label>
        <select
          id="scope"
          value={scopeWeek ?? ""}
          onChange={(e) => setParams(e.target.value ? { week: e.target.value } : {}, { replace: true })}
          className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Весь курс</option>
          {plan.weeks.map((w) => {
            const r = weekRange(startDate, w.n);
            return (
              <option key={w.n} value={w.n}>
                Неделя {w.n} · {formatDateRange(r.from, r.to)}
              </option>
            );
          })}
        </select>
      </div>

      <dl aria-label="Итоги" className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className={`${card} !p-3`}>
            <dt className="text-xs text-slate-500 dark:text-slate-400">{t.label}</dt>
            <dd className={t.big ? "text-2xl font-semibold" : "text-lg font-semibold"}>{t.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 space-y-4">
        <section aria-labelledby="by-topic" className={card}>
          <h2 id="by-topic" className="font-semibold">
            По темам
          </h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
            {scopeWeek ? `Неделя ${scopeWeek}` : "Весь курс"}: куда ушло время.
          </p>
          {topicBars.length === 0 ? (
            <Empty />
          ) : (
            <BarChart bars={topicBars} label="Время по темам" />
          )}
        </section>

        <section aria-labelledby="by-week" className={card}>
          <h2 id="by-week" className="font-semibold">
            По неделям
          </h2>
          <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-2.5 w-4 rounded-r-[4px]" style={{ background: "var(--viz-bar)" }} />
              Потрачено
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-4 w-0.5" style={{ background: "var(--viz-plan)" }} />
              По плану
            </span>
          </p>
          {sumMinutes(entries) === 0 ? <Empty /> : <BarChart bars={weekBars} label="Время по неделям" />}
        </section>

        {days && (
          <section aria-labelledby="by-day" className={card}>
            <h2 id="by-day" className="font-semibold">
              По дням, неделя {scopeWeek}
            </h2>
            <div className="mt-3">
              {scopeTotal === 0 ? <Empty /> : <BarChart bars={dayBars} label={`Время по дням недели ${scopeWeek}`} />}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Empty() {
  return (
    <p className="text-sm text-slate-600 dark:text-slate-400">
      Время ещё не записано. Укажите минуты у сессии или попытки в «Плане» или «Сегодня».
    </p>
  );
}
