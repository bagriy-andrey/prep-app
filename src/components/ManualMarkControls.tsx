import { useState } from "react";
import { parseMinutes, type SessionStatus } from "../domain/userState";
import { useUserState } from "../state/UserStateProvider";
import MinutesInput from "./MinutesInput";
import { chipActive, chipButton, chipIdle } from "./ui";

const OPTIONS: { status: SessionStatus; label: string; hint: string }[] = [
  { status: "done", label: "Сделал", hint: "Отметить сделанной" },
  { status: "light", label: "Налегке", hint: "Отметить лёгкой" },
  { status: "moved", label: "Перенёс", hint: "Отметить перенесённой" },
];

interface Props {
  id: string;
  title: string;
  /** Минуты по плану: стоят в поле по умолчанию. */
  plannedMinutes: number;
}

/**
 * Ручная отметка сессии со временем. Повторное нажатие на статус снимает отметку.
 * До отметки время набирается в черновике и сохраняется вместе со статусом,
 * после отметки поле правит сохранённое время.
 */
export default function ManualMarkControls({ id, title, plannedMinutes }: Props) {
  const { state, actions } = useUserState();
  const mark = state.sessions[id];
  const current = mark?.status ?? null;
  const [draft, setDraft] = useState(String(plannedMinutes));

  const showTime = current !== "moved";
  const value = mark ? (mark.minutes?.toString() ?? "") : draft;

  function change(next: string) {
    if (mark) actions.setSessionMinutes(id, parseMinutes(next));
    else setDraft(next);
  }

  function toggle(status: SessionStatus) {
    if (current === status) {
      actions.setSession(id, null);
      return;
    }
    // Время из поля переносится на новый статус, для «Перенёс» оно не сохраняется.
    actions.setSession(id, status, parseMinutes(value));
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <div role="group" aria-label={`Отметка: ${title}`} className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.status}
            type="button"
            aria-pressed={current === o.status}
            title={o.hint}
            onClick={() => toggle(o.status)}
            className={`${chipButton} ${current === o.status ? chipActive : chipIdle}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {showTime && <MinutesInput label={`Потрачено минут: ${title}`} value={value} onChange={change} />}
    </div>
  );
}
