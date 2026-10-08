import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { plan as basePlan } from "../data/plan";
import { newlyAvailablePrizes, prizeInfo } from "../domain/prizes";
import { TIER_LABEL } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import { primaryButton, subtleButton } from "./ui";

/**
 * Модальное уведомление о разблокированном призе. Показывается, когда действие пользователя
 * (завершение недели) открыло приз. Загрузка, импорт и сброс уведомления не вызывают.
 */
export default function PrizeUnlockModal() {
  const { state, epoch, plan } = useUserState();
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<number[]>([]);
  const previous = useRef({ state, epoch });
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const before = previous.current;
    previous.current = { state, epoch };
    if (before.epoch !== epoch || before.state === state) return;
    const unlocked = newlyAvailablePrizes(basePlan, before.state, state);
    if (unlocked.length > 0) setWeeks(unlocked);
  }, [state, epoch]);

  useEffect(() => {
    const el = dialog.current;
    if (weeks.length > 0 && el && !el.open) el.showModal();
  }, [weeks]);

  if (weeks.length === 0) return null;

  const many = weeks.length > 1;
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={() => setWeeks([])}
      onClick={(e) => {
        // Клик по затемнению (само окно dialog) закрывает уведомление.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="p-6 text-center">
        <p aria-hidden="true" className="text-5xl">
          🎁
        </p>
        <h2 id={titleId} className="mt-2 text-xl font-semibold">
          {many ? "Призы разблокированы!" : "Приз разблокирован!"}
        </h2>

        <ul className="mt-4 space-y-3 text-left">
          {weeks.map((n) => {
            const week = plan.weeks[n - 1];
            const info = prizeInfo(plan, week, state);
            const first = info.requiredWeeks[0];
            const last = info.requiredWeeks.at(-1);
            return (
              <li key={n} className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">{TIER_LABEL[week.prize.tier]}</p>
                <p className="text-lg font-semibold">{week.prize.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {info.requiredWeeks.length === 1 ? `Неделя ${n} завершена.` : `Завершены недели ${first}–${last}.`}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            autoFocus
            className={primaryButton}
            onClick={() => {
              dialog.current?.close();
              navigate("/prizes");
            }}
          >
            К призам
          </button>
          <button type="button" className={subtleButton} onClick={() => dialog.current?.close()}>
            Закрыть
          </button>
        </div>
      </div>
    </dialog>
  );
}
