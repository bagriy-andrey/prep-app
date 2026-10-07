import { useState } from "react";
import { useUserState } from "../state/UserStateProvider";

/** Заметка к неделе. Раскрыта по умолчанию, если заметка уже есть. */
export default function WeekNote({ week }: { week: number }) {
  const { state, actions } = useUserState();
  const value = state.weekNotes[week] ?? "";
  const [open, setOpen] = useState(value !== "");
  const id = `week-note-${week}`;
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="text-sm">
      <summary className="cursor-pointer font-medium select-none">
        Заметка недели {week}
        {value !== "" && <span className="ml-1 font-normal text-indigo-600 dark:text-indigo-400">· есть</span>}
      </summary>
      <label htmlFor={id} className="sr-only">
        Заметка недели {week}
      </label>
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={(e) => actions.setWeekNote(week, e.target.value)}
        placeholder="Итоги недели, слабые места, что перенести"
        className="mt-1 w-full resize-y rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"
      />
    </details>
  );
}
