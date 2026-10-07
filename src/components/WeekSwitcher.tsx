import { Link } from "react-router";
import { plan } from "../data/plan";
import { isWeekClosed } from "../domain/progress";
import { useUserState } from "../state/UserStateProvider";

export default function WeekSwitcher({ current, today }: { current: number; today: number | null }) {
  const { state } = useUserState();
  return (
    <nav aria-label="Недели плана">
      <ul className="grid grid-cols-8 gap-1.5 sm:grid-cols-16">
        {plan.weeks.map((w) => {
          const active = w.n === current;
          const closed = isWeekClosed(w, state);
          return (
            <li key={w.n}>
              <Link
                to={`/plan/${w.n}`}
                aria-current={active ? "page" : undefined}
                aria-label={`Неделя ${w.n}${w.n === today ? ", текущая" : ""}${closed ? ", закрыта" : ""}`}
                className={[
                  "relative flex h-9 items-center justify-center rounded-md border text-sm tabular-nums",
                  active
                    ? "border-indigo-600 bg-indigo-600 font-semibold text-white"
                    : closed
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                      : "border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                {w.n}
                {w.n === today && !active && (
                  <span aria-hidden="true" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
