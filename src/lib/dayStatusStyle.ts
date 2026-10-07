import type { DayStatus } from "../domain/calendar";

// Цвет всегда дополнен символом и подписью: статус не передаётся одним цветом.
export const STYLE: Record<DayStatus, { cell: string; mark: string }> = {
  all: { cell: "bg-emerald-500 text-white border-emerald-600", mark: "✓" },
  partial: { cell: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800", mark: "◐" },
  light: { cell: "bg-amber-200 text-amber-950 border-amber-400 dark:bg-amber-900 dark:text-amber-50 dark:border-amber-700", mark: "~" },
  missed: { cell: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800", mark: "✕" },
  rest: { cell: "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-600 dark:border-slate-800", mark: "·" },
  future: { cell: "bg-white text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700", mark: "" },
};
