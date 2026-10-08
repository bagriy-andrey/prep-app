import { Link, useSearchParams } from "react-router";
import ItemLinks from "../components/ItemLinks";
import ItemStatusBadge, { STATUS_LABEL } from "../components/ItemStatusBadge";
import { plan } from "../data/plan";
import { diffDays } from "../domain/dates";
import { itemStatus, reviewInfo, type ItemStatus } from "../domain/review";
import { filterItems, ITEM_KINDS, itemState, itemTitle, kindCounts } from "../domain/tracker";
import { locateDate } from "../domain/schedule";
import { TOPICS } from "../domain/topics";
import { extraTasksSorted, OUTCOME_LABEL } from "../domain/userState";
import { useToday } from "../hooks/useToday";
import { formatDateRu, formatMinutes } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";

const STATUSES = Object.keys(STATUS_LABEL) as ItemStatus[];

const select =
  "mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900";

export default function TrackerPage() {
  const today = useToday();
  const { state, startDate } = useUserState();
  const extras = extraTasksSorted(state);
  const [params, setParams] = useSearchParams();

  const kindParam = params.get("kind");
  const weekParam = Number(params.get("week"));
  const statusParam = params.get("status");
  const kind = ITEM_KINDS.find((k) => k === kindParam);
  const week = Number.isInteger(weekParam) && weekParam >= 1 && weekParam <= plan.meta.weeksCount ? weekParam : undefined;
  const status = STATUSES.find((s) => s === statusParam);

  function setFilter(key: "kind" | "week" | "status", value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const counts = kindCounts(plan, state);
  const items = filterItems(plan, state, { kind, week, status }, today);
  const filtered = Boolean(kind || week || status);

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Трекер</h1>

      <section aria-label="Сделано из запланированного">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ITEM_KINDS.map((k) => (
            <li key={k} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">{plan.blocks[k]}</p>
              <p className="text-lg font-semibold tabular-nums">
                {counts[k].done} <span className="text-sm font-normal text-slate-500">из {counts[k].total}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="f-kind" className="text-sm font-medium">
            Тип
          </label>
          <select id="f-kind" value={kind ?? ""} onChange={(e) => setFilter("kind", e.target.value)} className={select}>
            <option value="">Все</option>
            {ITEM_KINDS.map((k) => (
              <option key={k} value={k}>
                {plan.blocks[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-week" className="text-sm font-medium">
            Неделя
          </label>
          <select id="f-week" value={week ?? ""} onChange={(e) => setFilter("week", e.target.value)} className={select}>
            <option value="">Все</option>
            {plan.weeks.map((w) => (
              <option key={w.n} value={w.n}>
                {w.n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="text-sm font-medium">
            Статус
          </label>
          <select id="f-status" value={status ?? ""} onChange={(e) => setFilter("status", e.target.value)} className={select}>
            <option value="">Все</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </form>

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
        Показано задач: {items.length} из {plan.items.length}
        {filtered && (
          <>
            {" · "}
            <button type="button" onClick={() => setParams({}, { replace: true })} className="text-indigo-700 underline dark:text-indigo-300">
              Сбросить фильтры
            </button>
          </>
        )}
      </p>

      {items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          По этим фильтрам задач нет.
        </p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">Все задачи плана</caption>
          <thead className="hidden text-xs text-slate-500 sm:table-header-group dark:text-slate-400">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">Задача</th>
              <th scope="col" className="py-2 pr-3 font-medium">Сложность</th>
              <th scope="col" className="py-2 pr-3 font-medium">Последняя попытка</th>
              <th scope="col" className="py-2 pr-3 font-medium">Повторить</th>
              <th scope="col" className="py-2 font-medium">Ключевая идея</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const own = itemState(state, item.id);
              const last = own.attempts.at(-1);
              const info = reviewInfo(own.attempts, plan.rules.review);
              const itemStat = itemStatus(own.attempts, plan.rules.review, today);
              const title = itemTitle(item, state);
              return (
                <tr
                  key={item.id}
                  className="mb-3 block rounded-xl border border-slate-200 bg-white p-3 sm:mb-0 sm:table-row sm:rounded-none sm:border-0 sm:border-t sm:bg-transparent sm:p-0 dark:border-slate-800 dark:bg-slate-900 sm:dark:bg-transparent"
                >
                  <td className="block sm:table-cell sm:py-3 sm:pr-3 sm:align-top">
                    <Link to={`/tracker/${item.id}`} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
                      {title ?? <span className="italic">Своя задача: название не указано</span>}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{plan.blocks[item.kind]}</span>
                      <span>неделя {item.week}</span>
                      <ItemStatusBadge status={itemStat} />
                    </div>
                    <div className="mt-2">
                      <ItemLinks item={item} />
                    </div>
                  </td>
                  <Cell label="Сложность">{item.difficulty ?? "—"}</Cell>
                  <Cell label="Последняя попытка">
                    {last ? `${OUTCOME_LABEL[last.outcome]}, ${formatDateRu(last.date)}` : "—"}
                  </Cell>
                  <Cell label="Повторить">
                    {!info
                      ? "—"
                      : info.closed
                        ? "Закрыта"
                        : `${formatDateRu(info.dueDate)}${info.dueDate < today ? ` (просрочено на ${diffDays(info.dueDate, today)})` : ""}`}
                  </Cell>
                  <Cell label="Ключевая идея" last>
                    {own.keyIdea || "—"}
                  </Cell>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <section aria-labelledby="extra-tasks" className="mt-8">
        <h2 id="extra-tasks" className="font-semibold">
          Свои задачи
          {extras.length > 0 && <span className="ml-2 text-sm font-normal text-slate-500">{extras.length}</span>}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Сверх плана: в прогресс недель, призы и счётчики выше не входят. Добавляются кнопкой «+» в дне.
        </p>
        {extras.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Своих задач пока нет.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {extras.map((t) => {
              const loc = locateDate(plan, t.date, startDate);
              const when = formatDateRu(t.date);
              return (
                <li key={t.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {loc ? (
                      <Link
                        to={`/plan/${loc.week}?day=${t.date}`}
                        className="text-indigo-700 underline dark:text-indigo-300"
                      >
                        {when}
                      </Link>
                    ) : (
                      when
                    )}{" "}
                    · {TOPICS.find((x) => x.key === t.topic)?.label ?? t.topic}
                    {t.minutes !== undefined ? ` · ${formatMinutes(t.minutes)}` : ""} ·{" "}
                    {t.done ? "выполнена" : "не выполнена"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function Cell({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <td className={`mt-1 block text-sm sm:mt-0 sm:table-cell sm:py-3 sm:align-top ${last ? "" : "sm:pr-3"}`}>
      <span className="text-xs text-slate-500 sm:hidden dark:text-slate-400">{label}: </span>
      {children}
    </td>
  );
}
