import type { ReactNode } from "react";

/** Шапка карточки недели и дня: заголовок слева, индикаторы справа. */
export const cardHeaderClass = "flex flex-wrap items-center justify-between gap-x-4 gap-y-2";

const BADGE_TONE = {
  neutral: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  bad: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
} as const;

export type BadgeTone = keyof typeof BADGE_TONE;

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONE[tone]}`}>{children}</span>
  );
}

interface BarProps {
  /** Что показывает индикатор: первая строка подсказки. */
  label: string;
  /** Уточнение в подсказке: «0 из 3», «потрачено 20 мин из 1 ч 15 мин». */
  detail: string;
  /** Заполнение, 0–100. */
  fill: number;
  /** Текст внутри полосы. */
  text: string;
  done?: boolean;
  /** Классы ширины полосы; по умолчанию фиксированная. */
  widthClass?: string;
}

/** Полоса прогресса с текстом внутри. Подсказка по наведению и фокусу (на телефоне по нажатию). */
export function HeaderBar({ label, detail, fill, text, done, widthClass = "w-28 sm:w-32" }: BarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(fill)));
  return (
    <div className={`group relative ${widthClass === "w-full" ? "w-full" : ""}`}>
      <div
        tabIndex={0}
        role="progressbar"
        aria-label={`${label}: ${detail}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${text}. ${detail}`}
        className={`relative h-6 overflow-hidden rounded-full bg-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-800 ${widthClass}`}
      >
        <div
          className={`h-full ${done ? "bg-emerald-300 dark:bg-emerald-700" : "bg-indigo-300 dark:bg-indigo-700"}`}
          style={{ width: `${percent}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {text}
        </span>
      </div>
      <div
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-20 mt-1 hidden w-max max-w-[16rem] rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-focus-within:block group-hover:block dark:bg-slate-100 dark:text-slate-900"
      >
        <p className="font-semibold">{label}</p>
        <p>{detail}</p>
      </div>
    </div>
  );
}
