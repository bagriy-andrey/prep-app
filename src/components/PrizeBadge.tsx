import type { Week } from "../data/types";
import { TIER_LABEL } from "../lib/format";

export default function PrizeBadge({ prize }: { prize: Week["prize"] }) {
  return (
    <span className="text-sm text-slate-700 dark:text-slate-300">
      <span aria-hidden="true">🎁 </span>
      {TIER_LABEL[prize.tier]}: <strong className="font-semibold">{prize.title}</strong>
    </span>
  );
}
