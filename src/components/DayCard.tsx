import { useState } from "react";
import { itemsById, plan } from "../data/plan";
import type { Day } from "../data/types";
import { markableSessionIds, sessionStatus } from "../domain/progress";
import { itemTitle } from "../domain/tracker";
import { extraTasksOn } from "../domain/userState";
import { dayName, formatDateRu, formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import AttemptControls from "./AttemptControls";
import ExtraTaskPanel from "./ExtraTaskPanel";
import LightAlternative from "./LightAlternative";
import ManualMarkControls from "./ManualMarkControls";
import NewTaskPanel from "./NewTaskPanel";
import SessionNote from "./SessionNote";
import SessionRow from "./SessionRow";
import TaskTabs, { NEW_TASK_KEY, taskPanelId, taskTabId, type TaskTab } from "./TaskTabs";
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
  // «Отметить день» записывает время по плану. Для «лёгким» время не пишется: по плану оно завышено.
  const plannedById = Object.fromEntries(day.sessions.map((s) => [s.id, s.minutes]));
  const headingId = `day-${date}`;

  const sessions = day.sessions.filter((s) => s.block !== "rest");
  const rest = day.sessions.find((s) => s.block === "rest");
  const extras = extraTasksOn(state, date);

  // Подписи вкладок: название задачи или блок. Повторяющиеся подписи нумеруются.
  const baseLabels = sessions.map((s) => {
    const item = s.itemId ? itemsById.get(s.itemId) : undefined;
    return (item && itemTitle(item, state)) || (item ? "Своя задача" : (plan.blocks[s.block] ?? s.block));
  });
  const seen: Record<string, number> = {};
  const tabs: TaskTab[] = [
    ...sessions.map((s, i) => {
      const label = baseLabels[i];
      const repeated = baseLabels.filter((l) => l === label).length > 1;
      seen[label] = (seen[label] ?? 0) + 1;
      return {
        key: s.id,
        label: repeated ? `${label} ${seen[label]}` : label,
        status: sessionStatus(s, state),
        optional: s.optional,
      };
    }),
    ...extras.map((t) => ({ key: t.id, label: t.title, status: t.done ? ("done" as const) : null })),
  ];

  // По умолчанию открыта первая несделанная задача, а если всё сделано, первая.
  const [selected, setSelected] = useState<string | null>(() => {
    const firstOpen = sessions.find((s) => sessionStatus(s, state) === null);
    return (firstOpen ?? sessions[0])?.id ?? null;
  });
  const activeKey =
    selected !== null && (selected === NEW_TASK_KEY || tabs.some((t) => t.key === selected))
      ? selected
      : (tabs[0]?.key ?? null);

  const activeSession = sessions.find((s) => s.id === activeKey);
  const activeExtra = extras.find((t) => t.id === activeKey);

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

      <TaskTabs scope={date} tabs={tabs} activeKey={activeKey} onSelect={setSelected} />

      <div
        role="tabpanel"
        id={taskPanelId(date)}
        aria-labelledby={activeKey ? taskTabId(date, activeKey) : headingId}
        className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
      >
        {activeSession ? (
          <SessionRow {...activeSession} status={sessionStatus(activeSession, state)}>
            {activeSession.itemId ? (
              <AttemptControls itemId={activeSession.itemId} plannedMinutes={activeSession.minutes} />
            ) : (
              <ManualMarkControls id={activeSession.id} title={activeSession.title} plannedMinutes={activeSession.minutes} />
            )}
            <SessionNote sessionId={activeSession.id} itemId={activeSession.itemId} />
          </SessionRow>
        ) : activeExtra ? (
          <ExtraTaskPanel key={activeExtra.id} task={activeExtra} />
        ) : activeKey === NEW_TASK_KEY ? (
          <NewTaskPanel date={date} onCreated={setSelected} />
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {rest?.title ?? "На этот день задач нет"}. Нажмите «+», чтобы добавить свою задачу.
          </p>
        )}
      </div>

      {markable.length > 0 && (
        <button
          type="button"
          onClick={() => actions.markUnmarked(unmarked, "done", plannedById)}
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
