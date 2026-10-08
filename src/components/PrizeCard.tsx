import type { Week } from "../data/types";
import { prizeInfo, type PrizeStatus } from "../domain/prizes";
import { formatDateRu, plural, TIER_LABEL } from "../lib/format";
import { useUserState } from "../state/UserStateProvider";
import { primaryButton } from "./ui";

const STATUS_LABEL: Record<PrizeStatus, string> = {
  locked: "Заблокирован",
  available: "Доступен",
  claimed: "Получен",
};

const STATUS_STYLE: Record<PrizeStatus, string> = {
  locked: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  available: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  claimed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

export default function PrizeCard({ week }: { week: Week }) {
  const { state, actions, plan } = useUserState();
  const info = prizeInfo(plan, week, state);
  const isBlockPrize = week.prize.tier !== "small";
  const claimedOn = state.prizesClaimed[week.n];

  return (
    <li
      className={`rounded-xl border bg-white p-4 dark:bg-slate-900 ${
        info.status === "available" ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-200 dark:border-slate-800"
      } ${info.status === "locked" ? "opacity-80" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm text-slate-500 dark:text-slate-400">
          Неделя {week.n} · {TIER_LABEL[week.prize.tier]}
        </h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[info.status]}`}>
          {STATUS_LABEL[info.status]}
        </span>
      </div>

      <p className="mt-1 text-lg font-semibold">{week.prize.title}</p>

      {isBlockPrize && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Завершено недель блока: {info.closedWeeks} из {info.requiredWeeks.length} ({info.requiredWeeks[0]}–
          {info.requiredWeeks.at(-1)})
        </p>
      )}

      {info.status === "locked" && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Осталось {info.remainingSessions} {plural(info.remainingSessions, ["сессия", "сессии", "сессий"])}
        </p>
      )}
      {info.status === "claimed" && claimedOn && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Получен {formatDateRu(claimedOn)}</p>
      )}

      {info.status !== "claimed" && (
        <button
          type="button"
          disabled={info.status !== "available"}
          onClick={() => actions.claimPrize(week.n)}
          className={`${primaryButton} mt-3`}
        >
          Получил
        </button>
      )}
    </li>
  );
}
