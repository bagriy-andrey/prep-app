import { plan } from "../data/plan";
import type { PlanLink } from "../data/types";
import { formatMinutes } from "../lib/format";
import LinkButton from "./LinkButton";

interface Props {
  minutes: number;
  block: string;
  title: string;
  links?: PlanLink[];
  optional?: boolean;
}

export default function SessionRow({ minutes, block, title, links, optional }: Props) {
  const isRest = block === "rest";
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {plan.blocks[block] ?? block}
        </span>
        {!isRest && <span>{formatMinutes(minutes)}</span>}
        {optional && <span>необязательно</span>}
      </div>
      <p className={`mt-1 ${isRest ? "text-slate-500 dark:text-slate-400" : ""}`}>{title}</p>
      {links && links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {links.map((link) => (
            <LinkButton key={link.url} link={link} />
          ))}
        </div>
      )}
    </li>
  );
}
