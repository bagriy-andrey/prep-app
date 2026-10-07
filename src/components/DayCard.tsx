import type { Day } from "../data/types";
import { isManualSession, isSessionDone, markableSessionIds } from "../domain/progress";
import type { SessionStatus } from "../domain/userState";
import { dayName, formatDateRu, formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import AttemptControls from "./AttemptControls";
import LightAlternative from "./LightAlternative";
import ManualMarkControls from "./ManualMarkControls";
import SessionNote from "./SessionNote";
import SessionRow from "./SessionRow";
import { subtleButton } from "./ui";

interface Props {
  day: Day;
  date: string;
  isToday: boolean;
}

export default function DayCard({ day, date, isToday }: Props) {
  const { state, actions } = useUserState();
  const total = day.sessions.filter((s) => !s.optional).reduce((sum, s) => sum + s.minutes, 0);
  const markable = markableSessionIds(day.sessions);
  const unmarked = markable.filter((id) => !state.sessions[id]);
  const headingId = `day-${date}`;

  return (
    <section
      aria-labelledby={headingId}
      aria-current={isToday ? "date" : undefined}
      className={`rounded-xl border bg-white p-4 dark:bg-slate-900 ${
        isToday ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 id={headingId} className="font-semibold">
          {dayName(day.dow)}, {formatDateRu(date)}
          {isToday && <span className="ml-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">сегодня</span>}
        </h3>
        {total > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">{formatMinutes(total)}</span>}
      </header>

      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {day.sessions.map((s) => {
          const status: SessionStatus | null = isManualSession(s)
            ? (state.sessions[s.id]?.status ?? null)
            : isSessionDone(s, state)
              ? "done"
              : null;
          const isRest = s.block === "rest";
          return (
            <SessionRow key={s.id} {...s} status={status}>
              {isRest ? null : (
                <>
                  {s.itemId ? <AttemptControls itemId={s.itemId} /> : <ManualMarkControls id={s.id} title={s.title} />}
                  <SessionNote sessionId={s.id} itemId={s.itemId} />
                </>
              )}
            </SessionRow>
          );
        })}
      </ul>

      {markable.length > 0 && (
        <button
          type="button"
          onClick={() => actions.markUnmarked(unmarked, "done")}
          disabled={unmarked.length === 0}
          className={`${subtleButton} mt-3`}
        >
          Отметить день
        </button>
      )}

      {day.lightAlternative && (
        <LightAlternative
          text={day.lightAlternative}
          onMarkLight={markable.length > 0 ? () => actions.markUnmarked(unmarked, "light") : undefined}
          markLightDisabled={unmarked.length === 0}
        />
      )}
    </section>
  );
}
