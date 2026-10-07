import { useUserState } from "../state/UserStateProvider";
import NoteField from "./NoteField";

export default function DayNote({ date }: { date: string }) {
  const { state, actions } = useUserState();
  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <NoteField
        label="Заметка дня"
        value={state.dayNotes[date] ?? ""}
        onChange={(text) => actions.setDayNote(date, text)}
        placeholder="Что получилось, что мешало, что завтра"
      />
    </section>
  );
}
