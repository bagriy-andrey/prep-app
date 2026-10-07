import { plan } from "../data/plan";
import { streak } from "../domain/calendar";
import { plural } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

const days = (n: number) => `${n} ${plural(n, ["день", "дня", "дней"])}`;

export default function StreakStats({ today }: { today: string }) {
  const { state, startDate } = useUserState();
  const { current, record } = streak(plan, state, today, startDate);
  return (
    <p className="text-sm">
      <span aria-hidden="true">🔥 </span>
      Стрик: <strong className="font-semibold">{days(current)}</strong>
      <span className="text-slate-600 dark:text-slate-400"> · рекорд {days(record)}</span>
    </p>
  );
}
