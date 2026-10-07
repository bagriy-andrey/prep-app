import { Link } from "react-router";
import { plan } from "../data/plan";

export default function WeekSwitcher({ current, today }: { current: number; today: number | null }) {
  return (
    <nav aria-label="Недели плана">
      <ul className="grid grid-cols-8 gap-1.5 sm:grid-cols-16">
        {plan.weeks.map((w) => {
          const active = w.n === current;
          return (
            <li key={w.n}>
              <Link
                to={`/plan/${w.n}`}
                aria-current={active ? "page" : undefined}
                aria-label={`Неделя ${w.n}${w.n === today ? ", текущая" : ""}`}
                className={[
                  "relative flex h-9 items-center justify-center rounded-md border text-sm tabular-nums",
                  active
                    ? "border-indigo-600 bg-indigo-600 font-semibold text-white"
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
