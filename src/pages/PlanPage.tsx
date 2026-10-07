import { useEffect, useRef } from "react";
import { Navigate, useParams, useSearchParams } from "react-router";
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
  const [search] = useSearchParams();
  const selectedDate = search.get("day");
  const selectedRef = useRef<HTMLElement>(null);

  const todayLoc = locateDate(plan, today, startDate);
  const weekNumber = params.week === undefined ? defaultWeekNumber(plan, today, startDate) : Number(params.week);
  const week = weeksByNumber.get(weekNumber);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "start" });
  }, [weekNumber, selectedDate]);

  if (!week) return <Navigate to="/plan" replace />;

  return (
    <div className="space-y-4">
      <h1 className="sr-only">План</h1>
      <WeekSwitcher current={week.n} today={todayLoc?.week ?? null} />
      <WeekHeader week={week} />
      <div className="space-y-3">
        {week.days.map((day) => {
          const date = dayDate(startDate, week.n, day.offset);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          return (
            <DayCard
              key={day.dow}
              ref={isSelected ? selectedRef : undefined}
              day={day}
              date={date}
              isToday={isToday}
              isSelected={isSelected}
            />
          );
        })}
      </div>
    </div>
  );
}
