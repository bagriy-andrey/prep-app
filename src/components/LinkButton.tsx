import type { PlanLink } from "../data/types";

export default function LinkButton({ link }: { link: PlanLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm text-indigo-700 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
    >
      {link.label}
      <span aria-hidden="true">↗</span>
      <span className="sr-only">(откроется в новой вкладке)</span>
    </a>
  );
}
