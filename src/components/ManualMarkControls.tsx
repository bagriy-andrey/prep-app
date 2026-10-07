import type { SessionStatus } from "../domain/userState";
import { useUserState } from "../state/UserStateProvider";
import { chipActive, chipButton, chipIdle } from "./ui";

const OPTIONS: { status: SessionStatus; label: string; hint: string }[] = [
  { status: "done", label: "Сделал", hint: "Отметить сделанной" },
  { status: "light", label: "Налегке", hint: "Отметить лёгкой" },
  { status: "moved", label: "Перенёс", hint: "Отметить перенесённой" },
];

/** Ручная отметка сессии. Повторное нажатие снимает отметку. */
export default function ManualMarkControls({ id, title }: { id: string; title: string }) {
  const { state, actions } = useUserState();
  const current = state.sessions[id]?.status ?? null;
  return (
    <div role="group" aria-label={`Отметка: ${title}`} className="mt-2 flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.status}
          type="button"
          aria-pressed={current === o.status}
          title={o.hint}
          onClick={() => actions.setSession(id, current === o.status ? null : o.status)}
          className={`${chipButton} ${current === o.status ? chipActive : chipIdle}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
