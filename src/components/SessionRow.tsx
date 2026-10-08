import type { ReactNode } from "react";
import { plan } from "../data/plan";
import type { PlanLink } from "../data/types";
import type { SessionStatus } from "../domain/userState";
import { formatMinutes } from "../lib/format";
import LinkButton from "./LinkButton";

interface Props {
  minutes: number;
  block: string;
  title: string;
  links?: PlanLink[];
  optional?: boolean;
  /** Статус сессии; null, если она ещё не сделана. */
  status?: SessionStatus | null;
  /** Элементы управления (отметка или попытки). */
  children?: ReactNode;
}

export const STATUS_LABEL: Record<SessionStatus, string> = {
  done: "Выполнено",
  light: "Коротко",
  moved: "Отложено",
};

const STATUS_STYLE: Record<SessionStatus, string> = {
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  light: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  moved: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

/** Содержимое одной сессии: блок, время, название, ссылки и элементы управления. */
export default function SessionRow({ minutes, block, title, links, optional, status, children }: Props) {
  const isRest = block === "rest";
  const finished = status === "done" || status === "light";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {plan.blocks[block] ?? block}
        </span>
        {!isRest && <span>{formatMinutes(minutes)}</span>}
        {optional && <span>необязательно</span>}
        {status && (
          <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
        )}
      </div>
      <p className={`mt-1 ${isRest || finished ? "text-slate-500 dark:text-slate-400" : ""}`}>{title}</p>
      {links && links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {links.map((link) => (
            <LinkButton key={link.url} link={link} />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
