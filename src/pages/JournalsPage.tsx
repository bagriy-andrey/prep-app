import { useSearchParams } from "react-router";
import EntryCard from "../components/EntryCard";
import NoteField from "../components/NoteField";
import { primaryButton, subtleButton, chipActive, chipButton, chipIdle } from "../components/ui";
import { plan } from "../data/plan";
import { seedApplications, seedMocks, seedStories } from "../domain/seed";
import type { JournalKey } from "../domain/userState";
import { useUserState } from "../state/UserStateProvider";
import { useToday } from "../hooks/useToday";
import { defaultWeekNumber } from "../domain/schedule";

const TABS: { key: JournalKey; label: string }[] = [
  { key: "mocks", label: "Моки" },
  { key: "stories", label: "Истории" },
  { key: "applications", label: "Подачи" },
];

const STATUS_SUGGESTIONS = ["Запланирована", "Подана", "Скрининг", "Собеседование", "Оффер", "Отказ", "Закрыта"];

export default function JournalsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.key === params.get("tab"))?.key ?? "mocks";

  return (
    <>
      <h1 className="mb-3 text-xl font-semibold">Журналы</h1>
      <div role="tablist" aria-label="Журналы" className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="journal-panel"
            onClick={() => setParams({ tab: t.key }, { replace: true })}
            className={`${chipButton} ${tab === t.key ? chipActive : chipIdle}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="journal-panel" aria-labelledby={`tab-${tab}`}>
        {tab === "mocks" && <MocksTab />}
        {tab === "stories" && <StoriesTab />}
        {tab === "applications" && <ApplicationsTab />}
      </div>
    </>
  );
}

function EmptyList({ journal, onSeed }: { journal: string; onSeed: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
      <p>В журнале «{journal}» пока нет записей.</p>
      <button type="button" onClick={onSeed} className={`${subtleButton} mt-2`}>
        Добавить заготовки из плана
      </button>
    </div>
  );
}

function MocksTab() {
  const { state, actions, startDate } = useUserState();
  const today = useToday();
  return (
    <>
      {state.mocks.length === 0 ? (
        <EmptyList
          journal="Моки"
          onSeed={() => seedMocks(plan).forEach((m) => actions.addEntry("mocks", m))}
        />
      ) : (
        <ul className="space-y-3">
          {state.mocks.map((m, i) => (
            <EntryCard key={i} title={m.type || `Мок ${i + 1}`} onDelete={() => actions.removeEntry("mocks", i)}>
              <div>
                <label htmlFor={`mock-week-${i}`} className="block text-sm font-medium">
                  Неделя
                </label>
                <select
                  id={`mock-week-${i}`}
                  value={m.week}
                  onChange={(e) => actions.updateEntry("mocks", i, { week: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  {plan.weeks.map((w) => (
                    <option key={w.n} value={w.n}>
                      {w.n}
                    </option>
                  ))}
                </select>
              </div>
              <NoteField label="Тип" singleLine value={m.type} onChange={(type) => actions.updateEntry("mocks", i, { type })} />
              <NoteField
                label="Дата"
                type="date"
                value={m.date ?? ""}
                onChange={(date) => actions.updateEntry("mocks", i, { date: date || undefined })}
              />
              <NoteField
                label="Оценка и три ошибки"
                value={m.notes ?? ""}
                onChange={(notes) => actions.updateEntry("mocks", i, { notes: notes || undefined })}
              />
            </EntryCard>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => actions.addEntry("mocks", { week: defaultWeekNumber(plan, today, startDate), type: "" })}
        className={`${primaryButton} mt-4`}
      >
        Добавить мок
      </button>
    </>
  );
}

function StoriesTab() {
  const { state, actions } = useUserState();
  const ready = state.stories.filter((s) => s.ready).length;
  return (
    <>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
        Готово историй: {ready} из {state.stories.length}
      </p>
      {state.stories.length === 0 ? (
        <EmptyList journal="Истории" onSeed={() => seedStories(plan).forEach((s) => actions.addEntry("stories", s))} />
      ) : (
        <ul className="space-y-3">
          {state.stories.map((s, i) => (
            <EntryCard key={i} title={s.topic || `История ${i + 1}`} onDelete={() => actions.removeEntry("stories", i)}>
              <NoteField label="Тема" singleLine value={s.topic} onChange={(topic) => actions.updateEntry("stories", i, { topic })} />
              <label className="flex items-center gap-2 self-end pb-1.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={s.ready}
                  onChange={(e) => actions.updateEntry("stories", i, { ready: e.target.checked })}
                  className="h-4 w-4"
                />
                История готова
              </label>
              <NoteField
                label="Ситуация и действия"
                value={s.situation ?? ""}
                onChange={(situation) => actions.updateEntry("stories", i, { situation: situation || undefined })}
              />
              <NoteField
                label="Результат в цифрах"
                value={s.result ?? ""}
                onChange={(result) => actions.updateEntry("stories", i, { result: result || undefined })}
              />
            </EntryCard>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => actions.addEntry("stories", { topic: "", ready: false })} className={`${primaryButton} mt-4`}>
        Добавить историю
      </button>
    </>
  );
}

function ApplicationsTab() {
  const { state, actions } = useUserState();
  return (
    <>
      {state.applications.length === 0 ? (
        <EmptyList
          journal="Подачи"
          onSeed={() => seedApplications(plan).forEach((a) => actions.addEntry("applications", a))}
        />
      ) : (
        <ul className="space-y-3">
          {state.applications.map((a, i) => (
            <EntryCard key={i} title={a.company || `Подача ${i + 1}`} onDelete={() => actions.removeEntry("applications", i)}>
              <NoteField label="Компания" singleLine value={a.company} onChange={(company) => actions.updateEntry("applications", i, { company })} />
              <div>
                <label htmlFor={`app-status-${i}`} className="block text-sm font-medium">
                  Статус
                </label>
                <input
                  id={`app-status-${i}`}
                  type="text"
                  list="app-status-list"
                  value={a.status}
                  onChange={(e) => actions.updateEntry("applications", i, { status: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <NoteField
                label="Реферал"
                singleLine
                value={a.referral ?? ""}
                onChange={(referral) => actions.updateEntry("applications", i, { referral: referral || undefined })}
              />
              <NoteField
                label="Дата подачи"
                type="date"
                value={a.appliedOn ?? ""}
                onChange={(appliedOn) => actions.updateEntry("applications", i, { appliedOn: appliedOn || undefined })}
              />
              <NoteField
                label="Следующий шаг"
                singleLine
                value={a.nextStep ?? ""}
                onChange={(nextStep) => actions.updateEntry("applications", i, { nextStep: nextStep || undefined })}
              />
              <NoteField
                label="Заметки"
                value={a.notes ?? ""}
                onChange={(notes) => actions.updateEntry("applications", i, { notes: notes || undefined })}
              />
            </EntryCard>
          ))}
        </ul>
      )}
      <datalist id="app-status-list">
        {STATUS_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={() => actions.addEntry("applications", { company: "", status: "Запланирована" })}
        className={`${primaryButton} mt-4`}
      >
        Добавить подачу
      </button>
    </>
  );
}
