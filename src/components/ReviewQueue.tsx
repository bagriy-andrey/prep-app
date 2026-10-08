import { useState } from "react";
import { Link } from "react-router";
import { plan } from "../data/plan";
import { REVIEW_METHOD_LABEL } from "../domain/review";
import { itemTitle, reviewQueue, type QueueEntry } from "../domain/tracker";
import { parseMinutes } from "../domain/userState";
import { formatDateRu, plural } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import ItemLinks from "./ItemLinks";
import MinutesInput from "./MinutesInput";
import OutcomeButtons from "./OutcomeButtons";

export default function ReviewQueue({ today }: { today: string }) {
  const { state } = useUserState();
  const queue = reviewQueue(plan, state, today);

  return (
    <section
      aria-labelledby="review-queue"
      className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="review-queue" className="font-semibold">
        Что повторить сегодня
        {queue.length > 0 && <span className="ml-2 text-sm font-normal text-slate-500">{queue.length}</span>}
      </h2>

      {queue.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">На сегодня повторений нет.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
          {queue.map((entry) => (
            <QueueRow key={entry.item.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}

function QueueRow({ entry }: { entry: QueueEntry }) {
  const { state, actions } = useUserState();
  const { item, method, overdueDays, dueDate } = entry;
  const title = itemTitle(item, state) ?? "Своя задача без названия";
  // Время повторения по умолчанию пустое: оно уже входит в сессию «Что повторить сегодня».
  const [minutes, setMinutes] = useState("");
  return (
    <li className="space-y-2 py-3 first:pt-0 last:pb-0">
      <div>
        <Link to={`/tracker/${item.id}`} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
          {title}
        </Link>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <strong className="font-semibold">{REVIEW_METHOD_LABEL[method]}</strong>
          {overdueDays > 0
            ? ` · просрочено на ${overdueDays} ${plural(overdueDays, ["день", "дня", "дней"])} (срок ${formatDateRu(dueDate)})`
            : " · срок сегодня"}
        </p>
      </div>
      <ItemLinks item={item} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <OutcomeButtons
          label={`Исход повторения: ${title}`}
          onPick={(o) => {
            actions.addAttempt(item.id, o, parseMinutes(minutes));
            setMinutes("");
          }}
        />
        <MinutesInput label={`Потрачено минут на повторение: ${title}`} value={minutes} onChange={setMinutes} placeholder="необяз." />
      </div>
    </li>
  );
}
