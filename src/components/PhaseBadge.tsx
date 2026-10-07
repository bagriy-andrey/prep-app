import { plan } from "../data/plan";

const COLORS: Record<string, string> = {
  topics: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  "topics-mix": "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  buffer: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  simulation: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

export default function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[phase] ?? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200"}`}
    >
      {plan.phases[phase] ?? phase}
    </span>
  );
}
