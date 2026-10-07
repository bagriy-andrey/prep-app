import type { ItemStatus } from "../domain/review";

export const STATUS_LABEL: Record<ItemStatus, string> = {
  "not-started": "Не начата",
  "in-progress": "В работе",
  due: "К повторению",
  closed: "Закрыта",
};

const STYLE: Record<ItemStatus, string> = {
  "not-started": "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "in-progress": "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  due: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  closed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

export default function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
