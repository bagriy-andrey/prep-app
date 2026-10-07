import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { TOPICS, type TopicKey } from "../domain/topics";
import { extraTasksOn, parseMinutes, type ExtraTask } from "../domain/userState";
import { useUserState } from "../state/UserStateProvider";
import MinutesInput from "./MinutesInput";
import SessionNote from "./SessionNote";
import { primaryButton, subtleButton } from "./ui";

const field =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900";

function TopicSelect({ value, onChange, label }: { value: TopicKey; onChange: (t: TopicKey) => void; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as TopicKey)} className={field}>
      {TOPICS.map((t) => (
        <option key={t.key} value={t.key}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

/** Свои дополнительные задачи дня: сверх плана, на прогресс недели не влияют. */
export default function ExtraTasks({ date }: { date: string }) {
  const { state } = useUserState();
  const tasks = extraTasksOn(state, date);
  const headingId = `extra-${date}`;
  const done = tasks.filter((t) => t.done).length;

  return (
    <section aria-labelledby={headingId} className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
      <h4 id={headingId} className="text-sm font-semibold">
        Свои задачи
        {tasks.length > 0 && (
          <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
            {done} из {tasks.length}
          </span>
        )}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400">Сверх плана: на прогресс недели и призы не влияют.</p>

      {tasks.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}

      <AddForm date={date} />
    </section>
  );
}

function TaskRow({ task }: { task: ExtraTask }) {
  const { actions } = useUserState();
  const [draft, setDraft] = useState(task.title);
  const titleId = useId();

  function commitTitle() {
    const title = draft.trim();
    if (title && title !== task.title) actions.updateExtraTask(task.id, { title });
    else setDraft(task.title); // пустое название не сохраняем
  }

  return (
    <li className="space-y-2 py-3 first:pt-2">
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
      <div className="flex flex-wrap items-center gap-2 pl-7">
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
      <div className="pl-7">
        <SessionNote sessionId={task.id} />
      </div>
    </li>
  );
}

function AddForm({ date }: { date: string }) {
  const { actions } = useUserState();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState<TopicKey>("other");
  const [minutes, setMinutes] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    actions.addExtraTask({ date, title: trimmed, topic, minutes: parseMinutes(minutes) });
    setTitle("");
    setMinutes("");
    titleRef.current?.focus();
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1">
        <label htmlFor={titleId} className="block text-sm font-medium">
          Новая задача
        </label>
        <input
          id={titleId}
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: разобрать LRU Cache"
          className={`${field} mt-1 w-full`}
        />
      </div>
      <TopicSelect label="Тема новой задачи" value={topic} onChange={setTopic} />
      <MinutesInput label="Потрачено минут на новую задачу" value={minutes} onChange={setMinutes} />
      <button type="submit" disabled={title.trim() === ""} className={primaryButton}>
        Добавить
      </button>
    </form>
  );
}
