import { useId, useState } from "react";
import { useUserState } from "../state/UserStateProvider";

interface Props {
  sessionId: string;
  /** Для сессии с задачей заметка общая с карточкой задачи в трекере. */
  itemId?: string;
}

/** Заметка под сессией. Раскрыта по умолчанию, если заметка уже есть. */
export default function SessionNote({ sessionId, itemId }: Props) {
  const { state, actions } = useUserState();
  const value = itemId ? (state.items[itemId]?.note ?? "") : (state.sessionNotes[sessionId] ?? "");
  const [open, setOpen] = useState(value !== "");
  const id = useId();

  const onChange = (text: string) =>
    itemId ? actions.setItemText(itemId, "note", text) : actions.setSessionNote(sessionId, text);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="mt-2 text-sm"
    >
      <summary className="cursor-pointer text-slate-600 select-none dark:text-slate-400">
        Заметка{value !== "" && <span className="ml-1 text-indigo-600 dark:text-indigo-400">· есть</span>}
      </summary>
      <label htmlFor={id} className="sr-only">
        Заметка к сессии
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={itemId ? "Заметка к задаче (общая с карточкой в трекере)" : "Что получилось, что непонятно"}
        className="mt-1 w-full resize-y rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"
      />
    </details>
  );
}
