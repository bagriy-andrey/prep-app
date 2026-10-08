import { useId, useRef } from "react";
import { Link } from "react-router";
import type { Week } from "../data/types";
import { prizeInfo } from "../domain/prizes";
import { formatDateRu, plural, TIER_LABEL } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import { primaryButton, subtleButton } from "./ui";

const STATUS_TEXT = { locked: "Пока заблокирован", available: "Доступен", claimed: "Получен" } as const;

/** Кнопка «Посмотреть приз» и модальное окно с описанием приза недели. */
export default function PrizeInfoButton({ week }: { week: Week }) {
  const { state, actions, plan } = useUserState();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const info = prizeInfo(plan, week, state);
  const first = info.requiredWeeks[0];
  const last = info.requiredWeeks.at(-1);
  const claimedOn = state.prizesClaimed[week.n];

  return (
    <>
      <button
        type="button"
        aria-label="Посмотреть приз за эту неделю"
        title="Посмотреть приз за эту неделю"
        className="rounded-full border border-slate-300 px-2 py-0.5 text-base leading-none hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        onClick={() => dialog.current?.showModal()}
      >
        <span aria-hidden="true">🎁</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="p-6 text-center">
          <p aria-hidden="true" className="text-5xl">
            🎁
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Неделя {week.n} · {TIER_LABEL[week.prize.tier]}
          </p>
          <h2 id={titleId} className="text-xl font-semibold">
            {week.prize.title}
          </h2>
          <p className="mt-1 text-sm font-medium">{STATUS_TEXT[info.status]}</p>

          <div className="mt-4 rounded-xl bg-slate-100 p-3 text-left text-sm dark:bg-slate-800">
            <p>
              <strong className="font-semibold">Условие:</strong>{" "}
              {info.requiredWeeks.length === 1
                ? `завершить неделю ${week.n}`
                : `завершить недели ${first}–${last} (${plan.rules.bigPrizeRequires})`}
              .
            </p>
            {info.requiredWeeks.length > 1 && (
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Завершено недель: {info.closedWeeks} из {info.requiredWeeks.length}.
              </p>
            )}
            {info.status === "locked" && (
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Осталось {info.remainingSessions}{" "}
                {plural(info.remainingSessions, ["сессия", "сессии", "сессий"])}.
              </p>
            )}
            {info.status === "claimed" && claimedOn && (
              <p className="mt-1 text-slate-600 dark:text-slate-400">Получен {formatDateRu(claimedOn)}.</p>
            )}
            <p className="mt-1 text-slate-600 dark:text-slate-400">Неделя завершена, когда {plan.rules.weekClosed}.</p>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {info.status === "available" && (
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  actions.claimPrize(week.n);
                  dialog.current?.close();
                }}
              >
                Получил
              </button>
            )}
            <Link to="/prizes" className={subtleButton} onClick={() => dialog.current?.close()}>
              Все призы
            </Link>
            <button type="button" autoFocus className={subtleButton} onClick={() => dialog.current?.close()}>
              Закрыть
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
