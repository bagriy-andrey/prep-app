import { Navigate, useParams, useSearchParams } from "react-router";
import DaySummary from "../components/DaySummary";
import DayTabs, { DAY_PANEL_ID, dayTabId } from "../components/DayTabs";
import DayCard from "../components/DayCard";
import WeekHeader from "../components/WeekHeader";
import WeekSwitcher from "../components/WeekSwitcher";
import { plan, weeksByNumber } from "../data/plan";
import { defaultWeekNumber, locateDate, dayDate } from "../domain/schedule";
import { useToday } from "../hooks/useToday";
import { useUserState } from "../state/UserStateProvider";

export default function PlanPage() {
  const today = useToday();
  const { startDate } = useUserState();
  const params = useParams();
  const [search, setSearch] = useSearchParams();

  const todayLoc = locateDate(plan, today, startDate);
  const weekNumber = params.week === undefined ? defaultWeekNumber(plan, today, startDate) : Number(params.week);
  const week = weeksByNumber.get(weekNumber);
  if (!week) return <Navigate to="/plan" replace />;

  // День выбирается по ?day=; без него (или с датой не из этой недели) это сегодня, а иначе понедельник.
  const dates = week.days.map((d) => ({ day: d, date: dayDate(startDate, week.n, d.offset) }));
  const selected =
    dates.find((d) => d.date === search.get("day")) ?? dates.find((d) => d.date === today) ?? dates[0];

  return (
    <div className="space-y-4">
      <h1 className="sr-only">План</h1>
      <WeekSwitcher current={week.n} today={todayLoc?.week ?? null} />
      <WeekHeader week={week} />
      <DayTabs
        week={week}
        selectedDate={selected.date}
        today={today}
        onSelect={(date) => setSearch({ day: date }, { replace: true })}
      />
      <div role="tabpanel" id={DAY_PANEL_ID} aria-labelledby={dayTabId(selected.date)} className="space-y-3">
        <DaySummary day={selected.day} date={selected.date} today={today} />
        <DayCard key={selected.date} day={selected.day} date={selected.date} isToday={selected.date === today} />
      </div>
    </div>
  );
}
