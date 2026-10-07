import { useId, useState } from "react";
import { parseMinutes, type ExtraTask } from "../domain/userState";
import { useUserState } from "../state/UserStateProvider";
import MinutesInput from "./MinutesInput";
import SessionNote from "./SessionNote";
import TopicSelect from "./TopicSelect";
import { subtleButton } from "./ui";

const field =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900";

/** Содержимое вкладки своей задачи: отметка, название, тема, время, заметка, удаление. */
export default function ExtraTaskPanel({ task }: { task: ExtraTask }) {
  const { actions } = useUserState();
  const [draft, setDraft] = useState(task.title);
  const titleId = useId();

  function commitTitle() {
    const title = draft.trim();
    if (title && title !== task.title) actions.updateExtraTask(task.id, { title });
    else setDraft(task.title); // пустое название не сохраняем
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Своя задача. Сверх плана: на прогресс недели и призы не влияет.
      </p>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => actions.updateExtraTask(task.id, { done: e.target.checked })}
          aria-label={`Сделано: ${task.title}`}
          className="h-5 w-5 shrink-0"
        />
        <label htmlFor={titleId} className="sr-only">
          Название задачи
        </label>
        <input
          id={titleId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className={`${field} min-w-0 flex-1 ${task.done ? "text-slate-500 line-through dark:text-slate-400" : ""}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TopicSelect
          label={`Тема: ${task.title}`}
          value={task.topic}
          onChange={(topic) => actions.updateExtraTask(task.id, { topic })}
        />
        <MinutesInput
          label={`Потрачено минут: ${task.title}`}
          value={task.minutes?.toString() ?? ""}
          onChange={(v) => actions.updateExtraTask(task.id, { minutes: parseMinutes(v) })}
        />
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Удалить задачу «${task.title}»?`)) actions.removeExtraTask(task.id);
          }}
          className={`${subtleButton} !px-2 !py-1 text-xs text-red-700 dark:text-red-400`}
        >
          Удалить
        </button>
      </div>

      <SessionNote sessionId={task.id} />
    </div>
  );
}
