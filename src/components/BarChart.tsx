import { formatMinutes } from "../lib/format";

export interface Bar {
  key: string;
  label: string;
  /** Минуты. */
  value: number;
  /** Плановое значение: рисуется тонкой чертой. */
  plan?: number;
  /** Приглушить столбец серым (остальное при выделении одного). */
  dim?: boolean;
  /** Дополнительная строка подсказки. */
  detail?: string;
}

// Самый длинный столбец занимает не всю ширину: справа остаётся место для подписи значения.
const PLOT_SHARE = 84;

/**
 * Горизонтальные столбцы одного оттенка: длина кодирует минуты.
 * Значение подписано у конца столбца, подсказка работает при наведении и фокусе с клавиатуры.
 * Все значения есть и в тексте списка, так что подсказка ничего не скрывает.
 */
export default function BarChart({ bars, label }: { bars: Bar[]; label: string }) {
  const max = Math.max(1, ...bars.flatMap((b) => [b.value, b.plan ?? 0]));
  const pos = (v: number) => (v / max) * PLOT_SHARE;

  return (
    <ul aria-label={label} className="space-y-0.5">
      {bars.map((b) => {
        const width = pos(b.value);
        const labelAt = Math.max(width, b.plan !== undefined ? pos(b.plan) : 0);
        return (
          <li
            key={b.key}
            tabIndex={0}
            className="group relative grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2 rounded-md outline-offset-0 sm:grid-cols-[10rem_minmax(0,1fr)]"
          >
            <span className="truncate text-sm text-slate-700 dark:text-slate-300">{b.label}</span>

            <div className="relative h-8 border-l border-[var(--viz-grid)]">
              <div
                aria-hidden="true"
                className="absolute top-1/2 h-4 -translate-y-1/2 rounded-r-[4px] transition-[filter] group-hover:brightness-110 group-focus-visible:brightness-110"
                style={{ width: `${width}%`, background: b.dim ? "var(--viz-bar-dim)" : "var(--viz-bar)" }}
              />
              {b.plan !== undefined && (
                <div
                  aria-hidden="true"
                  className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2"
                  style={{ left: `${pos(b.plan)}%`, background: "var(--viz-plan)" }}
                />
              )}
              <span
                className="absolute top-1/2 -translate-y-1/2 text-sm font-medium whitespace-nowrap tabular-nums"
                style={{ left: `calc(${labelAt}% + 8px)` }}
              >
                {formatMinutes(b.value)}
              </span>

              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md bg-slate-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg group-hover:block group-focus-visible:block dark:bg-slate-100 dark:text-slate-900"
                style={{ left: `${Math.min(labelAt, 60)}%` }}
              >
                <strong className="block text-sm font-semibold">{formatMinutes(b.value)}</strong>
                <span className="opacity-80">{b.label}</span>
                {b.detail && <span className="block opacity-80">{b.detail}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
