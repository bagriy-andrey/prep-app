import type { ReactNode } from "react";
import { subtleButton } from "./ui";

/** Карточка записи журнала с кнопкой удаления. */
export default function EntryCard({
  title,
  onDelete,
  children,
}: {
  title: string;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      <button
        type="button"
        onClick={() => {
          if (window.confirm(`Удалить запись «${title}»?`)) onDelete();
        }}
        className={`${subtleButton} mt-3 text-red-700 dark:text-red-400`}
      >
        Удалить
      </button>
    </li>
  );
}
