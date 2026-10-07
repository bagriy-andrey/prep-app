import { Link } from "react-router";
import Countdown from "../components/Countdown";
import DayCard from "../components/DayCard";
import LoadWarning from "../components/LoadWarning";
import PhaseBadge from "../components/PhaseBadge";
import DayNote from "../components/DayNote";
import PrizeBadge from "../components/PrizeBadge";
import StreakStats from "../components/StreakStats";
import TimeStats from "../components/TimeStats";
import ReviewQueue from "../components/ReviewQueue";
import WeekNote from "../components/WeekNote";
import WeekProgressBar from "../components/WeekProgressBar";
import { plan } from "../data/plan";
import type { Day } from "../data/types";
import { prizeInfo } from "../domain/prizes";
import { weekProgress } from "../domain/progress";
import { maintenanceSessionId, resolveToday } from "../domain/schedule";
import { useToday } from "../hooks/useToday";
import { dayName, formatDateRu, plural } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

export default function TodayPage() {
  const today = useToday();
  const { state, startDate } = useUserState();
  const pos = resolveToday(plan, today, startDate);

  if (pos.kind === "before") {
    return (
      <>
        <h1 className="mb-4 text-xl font-semibold">{plan.meta.title}</h1>
        <Countdown daysLeft={pos.daysLeft} startDate={startDate} />
      </>
    );
  }

  if (pos.kind === "after") {
    // У сессий недели 17+ нет id: ключ отметки строится из даты и номера.
    const maintenanceDay: Day | null = pos.day
      ? {
          dow: pos.dow,
          offset: 0,
          lightAlternative: null,
          sessions: pos.day.sessions.map((s, i) => ({ ...s, id: maintenanceSessionId(today, i) })),
        }
      : null;
    return (
      <>
        <h1 className="text-xl font-semibold">
          {dayName(pos.dow)}, {formatDateRu(today)}
        </h1>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{plan.maintenanceWeek.title}</p>
        <LoadWarning today={today} />
        {maintenanceDay ? (
          <DayCard key={today} day={maintenanceDay} date={today} isToday />
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            Сегодня по плану отдых.
          </p>
        )}
        <ReviewQueue today={today} />
        <DayNote date={today} />
      </>
    );
  }

  const { week, day } = pos;
  const progress = weekProgress(week, state);
  const prize = prizeInfo(plan, week, state);

  return (
    <>
      <h1 className="text-xl font-semibold">Сегодня</h1>
      <div className="mt-1 mb-4 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            Неделя {week.n} из {plan.meta.weeksCount}
          </span>
          <PhaseBadge phase={week.phase} />
        </div>
        <p className="font-medium">{week.title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">Веб-основы: {week.webTopic}</p>
      </div>

      <LoadWarning today={today} />

      <DayCard key={today} day={day} date={today} isToday />

      <ReviewQueue today={today} />

      <DayNote date={today} />

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <WeekNote week={week.n} />
      </div>

      <section
        aria-label="Прогресс недели"
        className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <WeekProgressBar progress={progress} label="Сессии недели" />
        <StreakStats today={today} />
        <TimeStats today={today} />
        <div className="space-y-1">
          <PrizeBadge prize={week.prize} />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {prize.status === "claimed" ? (
              "Приз получен."
            ) : prize.status === "available" ? (
              <>
                Приз доступен.{" "}
                <Link to="/prizes" className="text-indigo-700 underline dark:text-indigo-300">
                  Получить
                </Link>
              </>
            ) : (
              `До приза осталось ${prize.remainingSessions} ${plural(prize.remainingSessions, ["сессия", "сессии", "сессий"])}${
                prize.requiredWeeks.length > 1 ? ` (недели ${prize.requiredWeeks[0]}–${prize.requiredWeeks.at(-1)})` : ""
              }.`
            )}
          </p>
        </div>
      </section>
    </>
  );
}
