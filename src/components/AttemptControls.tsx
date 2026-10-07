import { useState } from "react";
import { itemsById } from "../data/plan";
import { OUTCOME_LABEL, parseMinutes } from "../domain/userState";
import { formatDateRu, formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import MinutesInput from "./MinutesInput";
import OutcomeButtons from "./OutcomeButtons";
import { subtleButton } from "./ui";

/**
 * Попытки по задаче: сессия с задачей считается сделанной после первой попытки.
 * Время из поля сохраняется вместе с попыткой при нажатии на исход.
 */
export default function AttemptControls({ itemId, plannedMinutes }: { itemId: string; plannedMinutes: number }) {
  const { state, actions } = useUserState();
  const item = itemsById.get(itemId);
  const itemState = state.items[itemId];
  const attempts = itemState?.attempts ?? [];
  const last = attempts.at(-1);
  const [minutes, setMinutes] = useState(String(plannedMinutes));

  if (!item) return null;
  const label = item.title ?? itemState?.title ?? "задача";

  return (
    <div className="mt-2 space-y-2">
      {item.userNamed && <TitleInput itemId={itemId} hint={item.hint} />}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Попытка:</span>
        <OutcomeButtons
          label={`Добавить попытку: ${label}`}
          onPick={(o) => actions.addAttempt(itemId, o, parseMinutes(minutes))}
        />
        <MinutesInput label={`Потрачено минут на попытку: ${label}`} value={minutes} onChange={setMinutes} />
      </div>

      {last && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          <span>
            Попыток: {attempts.length}, последняя: {OUTCOME_LABEL[last.outcome]}, {formatDateRu(last.date)}
            {last.minutes !== undefined && `, ${formatMinutes(last.minutes)}`}
          </span>
          <button
            type="button"
            onClick={() => actions.removeLastAttempt(itemId)}
            className={`${subtleButton} !px-2 !py-0.5 text-xs`}
          >
            Отменить последнюю
          </button>
        </p>
      )}
    </div>
  );
}

function TitleInput({ itemId, hint }: { itemId: string; hint?: string }) {
  const { state, actions } = useUserState();
  const saved = state.items[itemId]?.title ?? "";
  const [draft, setDraft] = useState(saved);
  const inputId = `title-${itemId}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium">
        Название задачи
      </label>
      <input
        id={inputId}
        type="text"
        value={draft}
        placeholder={hint}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => actions.setItemTitle(itemId, draft)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  );
}
