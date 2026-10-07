import { Link, useParams } from "react-router";
import { useState } from "react";
import MinutesInput from "../components/MinutesInput";
import ItemLinks from "../components/ItemLinks";
import ItemStatusBadge from "../components/ItemStatusBadge";
import NoteField from "../components/NoteField";
import OutcomeButtons from "../components/OutcomeButtons";
import { subtleButton } from "../components/ui";
import { itemsById, plan } from "../data/plan";
import { itemStatus, REVIEW_METHOD_LABEL, reviewInfo } from "../domain/review";
import { itemState, itemTitle } from "../domain/tracker";
import { OUTCOME_LABEL, parseMinutes } from "../domain/userState";
import { useToday } from "../hooks/useToday";
import { formatDateRu } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import NotFoundPage from "./NotFoundPage";

export default function ItemPage() {
  const { itemId = "" } = useParams();
  const item = itemsById.get(itemId);
  if (!item) return <NotFoundPage />;
  return <ItemCard itemId={itemId} />;
}

function ItemCard({ itemId }: { itemId: string }) {
  const today = useToday();
  const { state, actions } = useUserState();
  const item = itemsById.get(itemId)!;
  const own = itemState(state, itemId);
  const title = itemTitle(item, state);
  const status = itemStatus(own.attempts, plan.rules.review, today);
  const info = reviewInfo(own.attempts, plan.rules.review);

  return (
    <article className="space-y-4">
      <Link to="/tracker" className="text-sm text-indigo-700 hover:underline dark:text-indigo-300">
        ← К трекеру
      </Link>

      <header>
        <h1 className="text-xl font-semibold">{title ?? "Своя задача: название не указано"}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          <span>{plan.blocks[item.kind]}</span>
          <span>неделя {item.week}</span>
          {item.difficulty && <span>{item.difficulty}</span>}
          <span>{item.topic}</span>
          <ItemStatusBadge status={status} />
        </div>
        {item.hint && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.hint}</p>}
      </header>

      {item.userNamed && <TitleField itemId={itemId} saved={own.title ?? ""} />}

      <ItemLinks item={item} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">Повторение</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {!info
            ? "Попыток ещё не было."
            : info.closed
              ? `Задача закрыта: ${info.cleanCount} чистых попыток.`
              : `Следующее повторение: ${formatDateRu(info.dueDate)}${info.dueDate < today ? " (просрочено)" : ""}. ${REVIEW_METHOD_LABEL[info.method]}.`}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">Попытки</h2>
        {own.attempts.length === 0 ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Пока пусто.</p>
        ) : (
          <ol className="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
            {own.attempts.map((a, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5">
                <span>
                  {OUTCOME_LABEL[a.outcome]}
                  <span className="ml-2 text-slate-600 dark:text-slate-400">{formatDateRu(a.date)}</span>
                </span>
                <MinutesInput
                  label={`Потрачено минут, попытка ${i + 1}`}
                  value={a.minutes?.toString() ?? ""}
                  onChange={(v) => actions.setAttemptMinutes(itemId, i, parseMinutes(v))}
                />
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm">Добавить:</span>
          <OutcomeButtons label="Добавить попытку" onPick={(o) => actions.addAttempt(itemId, o)} />
          <span className="text-xs text-slate-500 dark:text-slate-400">Время попытки можно указать в списке выше.</span>
          {own.attempts.length > 0 && (
            <button type="button" onClick={() => actions.removeLastAttempt(itemId)} className={`${subtleButton} !px-2 !py-1 text-xs`}>
              Отменить последнюю
            </button>
          )}
        </div>
      </section>

      <NoteField
        label="Ключевая идея (одной строкой)"
        singleLine
        value={own.keyIdea ?? ""}
        onChange={(text) => actions.setItemText(itemId, "keyIdea", text)}
        placeholder="Например: хеш-таблица значение → индекс"
      />
      <NoteField label="Заметка" value={own.note ?? ""} onChange={(text) => actions.setItemText(itemId, "note", text)} />
    </article>
  );
}

function TitleField({ itemId, saved }: { itemId: string; saved: string }) {
  const { actions } = useUserState();
  const [draft, setDraft] = useState(saved);
  return (
    <div>
      <label htmlFor="item-title" className="block text-sm font-medium">
        Название задачи
      </label>
      <input
        id="item-title"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => actions.setItemTitle(itemId, draft)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  );
}
