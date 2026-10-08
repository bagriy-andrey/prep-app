import { useId, useState } from "react";
import { plan as basePlan } from "../data/plan";
import { sessionOrigin } from "../domain/moves";
import { dayDate } from "../domain/schedule";
import { dayName, formatDateRange, formatDateRu } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import { primaryButton, subtleButton } from "./ui";

const field =
  "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900";

/** Перенос сессии плана на другой день или неделю; перенос можно отменить. */
export default function MoveSessionControls({ sessionId, week, offset }: { sessionId: string; week: number; offset: number }) {
  const { state, actions, plan, startDate } = useUserState();
  const [open, setOpen] = useState(false);
  const weekId = useId();
  const dayId = useId();
  const origin = sessionOrigin(basePlan, sessionId);
  const isMoved = state.sessionMoves[sessionId] !== undefined;

  const weeksCount = plan.meta.weeksCount;
  const [targetWeek, setTargetWeek] = useState(week < weeksCount ? week + 1 : week - 1);
  const [targetOffset, setTargetOffset] = useState(offset);
  if (!origin) return null;

  const days = plan.weeks[targetWeek - 1].days;
  const unchanged = targetWeek === week && targetOffset === offset;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={subtleButton}>
          Перенести
        </button>
        {isMoved && (
          <button type="button" onClick={() => actions.moveSession(sessionId, null)} className={subtleButton}>
            Вернуть на место
          </button>
        )}
        {isMoved && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            По плану: неделя {origin.week}, {dayName(origin.offset + 1).toLowerCase()}
          </span>
        )}
      </div>
      {open && (
        <form
          className="mt-2 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (unchanged) return;
            actions.moveSession(sessionId, { week: targetWeek, offset: targetOffset });
            setOpen(false);
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={weekId} className="text-xs text-slate-500 dark:text-slate-400">
              Неделя
            </label>
            <select
              id={weekId}
              value={targetWeek}
              onChange={(e) => setTargetWeek(Number(e.target.value))}
              className={field}
            >
              {plan.weeks.map((w) => (
                <option key={w.n} value={w.n}>
                  {w.n} · {formatDateRange(dayDate(startDate, w.n, 0), dayDate(startDate, w.n, 6))}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={dayId} className="text-xs text-slate-500 dark:text-slate-400">
              День
            </label>
            <select
              id={dayId}
              value={targetOffset}
              onChange={(e) => setTargetOffset(Number(e.target.value))}
              className={field}
            >
              {days.map((d) => (
                <option key={d.offset} value={d.offset}>
                  {dayName(d.dow)}, {formatDateRu(dayDate(startDate, targetWeek, d.offset))}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={unchanged} className={primaryButton}>
            Перенести сюда
          </button>
        </form>
      )}
    </div>
  );
}
