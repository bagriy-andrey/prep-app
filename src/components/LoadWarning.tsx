import { plan } from "../data/plan";
import { hasLoadWarning } from "../domain/calendar";
import { useUserState } from "../state/UserStateProvider";

/** Совет снизить нагрузку, если больше половины плановых дней за 14 дней были лёгкими (6.6). */
export default function LoadWarning({ today }: { today: string }) {
  const { state, startDate } = useUserState();
  if (!hasLoadWarning(plan, state, today, startDate)) return null;
  return (
    <aside
      role="note"
      className="mb-4 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <strong className="font-semibold">Пора снизить нагрузку.</strong> За последние 14 дней больше половины плановых
      дней вы отметили лёгкими. Сократите объём: оставьте повторения и по одной новой задаче в день, остальное
      перенесите на буферные недели.
    </aside>
  );
}
