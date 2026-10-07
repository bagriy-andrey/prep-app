import { plan } from "../data/plan";
import Countdown from "../components/Countdown";
import DayCard from "../components/DayCard";
import PhaseBadge from "../components/PhaseBadge";
import PrizeBadge from "../components/PrizeBadge";
import SessionRow from "../components/SessionRow";
import { useToday } from "../hooks/useToday";
import { dayName, formatDateRu } from "../lib/format";
import { resolveToday } from "../domain/schedule";

export default function TodayPage() {
  const today = useToday();
  const pos = resolveToday(plan, today);

  if (pos.kind === "before") {
    return (
      <>
        <h1 className="mb-4 text-xl font-semibold">{plan.meta.title}</h1>
        <Countdown daysLeft={pos.daysLeft} startDate={plan.meta.startDate} />
      </>
    );
  }

  if (pos.kind === "after") {
    return (
      <>
        <h1 className="text-xl font-semibold">
          {dayName(pos.dow)}, {formatDateRu(today)}
        </h1>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{plan.maintenanceWeek.title}</p>
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {pos.day ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {pos.day.sessions.map((s, i) => (
                <SessionRow key={i} {...s} />
              ))}
            </ul>
          ) : (
            <p>Сегодня по плану отдых.</p>
          )}
        </section>
      </>
    );
  }

  const { week, day } = pos;
  return (
    <>
      <h1 className="text-xl font-semibold">Сегодня</h1>
      <div className="mt-1 mb-4 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Неделя {week.n} из {plan.meta.weeksCount}</span>
          <PhaseBadge phase={week.phase} />
        </div>
        <p className="font-medium">{week.title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">Веб-основы: {week.webTopic}</p>
      </div>
      <DayCard day={day} date={today} isToday isSelected={false} />
      <div className="mt-4">
        <PrizeBadge prize={week.prize} />
      </div>
    </>
  );
}
