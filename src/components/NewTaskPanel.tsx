import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { TopicKey } from "../domain/topics";
import { parseMinutes } from "../domain/userState";
import { useUserState } from "../state/UserStateProvider";
import MinutesInput from "./MinutesInput";
import NoteField from "./NoteField";
import TopicSelect from "./TopicSelect";
import { primaryButton } from "./ui";

/** Вкладка «+»: форма новой задачи с темой, временем и заметкой. После создания открывается вкладка задачи. */
export default function NewTaskPanel({ date, onCreated }: { date: string; onCreated: (id: string) => void }) {
  const { actions } = useUserState();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState<TopicKey>("other");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const id = actions.addExtraTask({
      date,
      title: trimmed,
      topic,
      minutes: parseMinutes(minutes),
      note: note || undefined,
    });
    setTitle("");
    setMinutes("");
    setNote("");
    onCreated(id);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Своя задача сверх плана: на прогресс недели и призы не влияет, время идёт в статистику по теме.
      </p>
      <div>
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
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TopicSelect label="Тема новой задачи" value={topic} onChange={setTopic} />
        <MinutesInput label="Потрачено минут на новую задачу" value={minutes} onChange={setMinutes} />
      </div>
      <NoteField label="Заметка (необязательно)" value={note} onChange={setNote} placeholder="Что хочется не забыть" />
      <button type="submit" disabled={title.trim() === ""} className={primaryButton}>
        Добавить задачу
      </button>
    </form>
  );
}
