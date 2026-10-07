import { NavLink, Outlet } from "react-router";
import { useUserState } from "../state/UserStateProvider";

const links = [
  { to: "/", label: "Сегодня", end: true },
  { to: "/plan", label: "План", end: false },
  { to: "/calendar", label: "Календарь", end: false },
  { to: "/tracker", label: "Трекер", end: false },
  { to: "/stats", label: "Статистика", end: false },
  { to: "/prizes", label: "Призы", end: false },
  { to: "/journals", label: "Журналы", end: false },
  { to: "/settings", label: "Настройки", end: false },
];

export default function AppShell() {
  const { saveError } = useUserState();
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="sticky top-0 z-10 hidden border-b border-slate-200 bg-slate-50/90 backdrop-blur sm:block dark:border-slate-800 dark:bg-slate-950/90">
        <nav aria-label="Основная навигация" className="flex gap-1 px-4 py-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {saveError && (
        <div role="alert" className="bg-red-600 px-4 py-2 text-sm text-white">
          Не удалось сохранить изменения: {saveError}. Скачайте резервную копию или освободите место в браузере.
        </div>
      )}

      <main className="flex-1 px-4 pt-4 pb-24 sm:pb-8">
        <Outlet />
      </main>

      <nav
        aria-label="Основная навигация"
        className="fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-slate-200 bg-slate-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={(s) => `${navClass(s)} flex-1 shrink-0 justify-center py-3`}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium",
    isActive
      ? "bg-indigo-600 text-white"
      : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800",
  ].join(" ");
}
