import { useRef } from "react";
import { Link } from "react-router";
import { plan } from "../data/plan";
import { toPercent, weekProgress } from "../domain/progress";
import { useCenterActive } from "../hooks/useCenterActive";
import { useUserState } from "../state/UserStateProvider";

const arrow =
  "flex h-12 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-lg hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800";

/** Слайдер недель: активная неделя по центру (кроме начала и конца курса), на кнопке процент выполненного. */
export default function WeekSwitcher({ current, today }: { current: number; today: number | null }) {
  const { state } = useUserState();
  const track = useRef<HTMLUListElement>(null);
  useCenterActive(track, current);

  return (
    <nav aria-label="Недели плана" className="flex items-center gap-1.5">
      {current > 1 ? (
        <Link to={`/plan/${current - 1}`} aria-label="Предыдущая неделя" className={arrow}>
          <span aria-hidden="true">‹</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={`${arrow} invisible`} />
      )}

      <ul
        ref={track}
        className="relative flex min-w-0 flex-1 snap-x gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {plan.weeks.map((w) => {
          const active = w.n === current;
          const progress = weekProgress(w, state);
          const percent = toPercent(progress.done, progress.total);
          return (
            <li key={w.n} className="shrink-0 snap-center">
              <Link
                to={`/plan/${w.n}`}
                aria-current={active ? "page" : undefined}
                aria-label={`Неделя ${w.n}, выполнено ${percent}%${progress.closed ? ", закрыта" : ""}${w.n === today ? ", текущая" : ""}`}
                className={[
                  "relative flex h-12 w-16 flex-col items-center justify-center rounded-md border leading-tight tabular-nums",
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : progress.closed
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                      : "border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                <span className="text-sm font-semibold">{w.n}</span>
                <span aria-hidden="true" className="text-[11px] opacity-80">
                  {percent}%
                </span>
                {w.n === today && !active && (
                  <span aria-hidden="true" className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {current < plan.meta.weeksCount ? (
        <Link to={`/plan/${current + 1}`} aria-label="Следующая неделя" className={arrow}>
          <span aria-hidden="true">›</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={`${arrow} invisible`} />
      )}
    </nav>
  );
}
