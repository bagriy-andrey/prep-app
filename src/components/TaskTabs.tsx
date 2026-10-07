import { useRef } from "react";
import type { KeyboardEvent } from "react";
import type { SessionStatus } from "../domain/userState";
import { useCenterActive } from "../hooks/useCenterActive";

export const NEW_TASK_KEY = "__new__";

export interface TaskTab {
  key: string;
  label: string;
  /** Статус задачи; null, если не сделана. Для вкладки «+» не используется. */
  status: SessionStatus | null;
  optional?: boolean;
}

const ICON: Record<SessionStatus | "open", string> = { done: "✓", light: "◐", moved: "➜", open: "○" };
const STATUS_TEXT: Record<SessionStatus | "open", string> = {
  done: "сделано",
  light: "сделано налегке",
  moved: "перенесено",
  open: "не сделано",
};
const TINT: Record<SessionStatus | "open", string> = {
  done: "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  light: "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
  moved: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  open: "border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
};

export const taskTabId = (scope: string, key: string) => `task-tab-${scope}-${key}`;
export const taskPanelId = (scope: string) => `task-panel-${scope}`;

/**
 * Вкладки задач дня: у каждой значок статуса (сделана или нет), в конце вкладка «+» для новой задачи.
 * Активная вкладка прокручивается к центру, переключение стрелками, Home и End.
 */
export default function TaskTabs({
  scope,
  tabs,
  activeKey,
  onSelect,
}: {
  /** Уникальный префикс для id (например, дата дня). */
  scope: string;
  tabs: TaskTab[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  useCenterActive(box, activeKey ?? "");
  const all = [...tabs.map((t) => t.key), NEW_TASK_KEY];

  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = all.length - 1;
    const next =
      e.key === "ArrowRight" ? Math.min(index + 1, last)
      : e.key === "ArrowLeft" ? Math.max(index - 1, 0)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onSelect(all[next]);
    document.getElementById(taskTabId(scope, all[next]))?.focus();
  }

  const base =
    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors";
  const selectedCls = "border-indigo-600 bg-indigo-600 text-white";

  return (
    <div
      ref={box}
      role="tablist"
      aria-label="Задачи дня"
      className="relative flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab, i) => {
        const selected = tab.key === activeKey;
        const state = tab.status ?? "open";
        return (
          <button
            key={tab.key}
            id={taskTabId(scope, tab.key)}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={taskPanelId(scope)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`${base} max-w-56 ${selected ? selectedCls : TINT[state]}`}
          >
            <span aria-hidden="true" className="font-semibold">
              {ICON[state]}
            </span>
            <span className="truncate">{tab.label}</span>
            {tab.optional && <span className="text-xs opacity-70">(необяз.)</span>}
            <span className="sr-only">: {STATUS_TEXT[state]}</span>
          </button>
        );
      })}

      <button
        id={taskTabId(scope, NEW_TASK_KEY)}
        role="tab"
        type="button"
        aria-selected={activeKey === NEW_TASK_KEY}
        aria-controls={taskPanelId(scope)}
        aria-label="Новая задача"
        title="Новая задача"
        tabIndex={activeKey === NEW_TASK_KEY ? 0 : -1}
        onClick={() => onSelect(NEW_TASK_KEY)}
        onKeyDown={(e) => onKeyDown(e, all.length - 1)}
        className={`${base} font-semibold ${
          activeKey === NEW_TASK_KEY
            ? selectedCls
            : "border-dashed border-slate-400 bg-transparent text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        }`}
      >
        <span aria-hidden="true" className="text-base leading-none">
          +
        </span>
      </button>
    </div>
  );
}
