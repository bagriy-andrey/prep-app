import { useState } from "react";
import LinkButton from "../components/LinkButton";
import { primaryButton, subtleButton } from "../components/ui";
import { plan } from "../data/plan";
import { isMonday, todayString } from "../domain/dates";
import { buildIcs } from "../domain/ics";
import { downloadFile } from "../lib/download";
import { formatDateRu } from "../lib/format";
import { getSyncToken, setSyncToken } from "../storage/remoteAdapter";
import { useUserState } from "../state/UserStateProvider";

const card = "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

export default function SettingsPage() {
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Ресурсы и настройки</h1>
      <div className="space-y-4">
        <Resources />
        <StartDate />
        <Schedule />
        <Sync />
        <Data />
      </div>
    </>
  );
}

function Resources() {
  const tracks = [...new Set(plan.resources.map((r) => r.track))];
  return (
    <section aria-labelledby="resources" className={card}>
      <h2 id="resources" className="font-semibold">
        Ресурсы
      </h2>
      <div className="mt-3 space-y-4">
        {tracks.map((track) => (
          <div key={track}>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{track}</h3>
            <ul className="mt-1 divide-y divide-slate-200 dark:divide-slate-800">
              {plan.resources
                .filter((r) => r.track === track)
                .map((r) => (
                  <li key={r.url} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {r.name}
                        {r.primary && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                            основной
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{r.role}</p>
                    </div>
                    <LinkButton link={{ label: "Открыть", url: r.url, confidence: "checked" }} />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function StartDate() {
  const { state, actions, startDate } = useUserState();
  const [error, setError] = useState<string | null>(null);

  function change(value: string) {
    if (!value) return; // поле очищается на время набора
    if (!isMonday(value)) {
      setError("Дата старта должна быть понедельником");
      return;
    }
    setError(null);
    actions.setStartDate(value);
  }

  return (
    <section aria-labelledby="start-date" className={card}>
      <h2 id="start-date" className="font-semibold">
        Дата старта
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Понедельник первой недели. Сдвигает всё расписание, отметки не меняются. Сейчас: {formatDateRu(startDate)}.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="start-date-input" className="block text-sm font-medium">
            Новая дата
          </label>
          <input
            id="start-date-input"
            type="date"
            value={startDate}
            aria-invalid={error !== null}
            aria-describedby={error ? "start-date-error" : undefined}
            onChange={(e) => change(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        {state.startDate && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              actions.setStartDate(null);
            }}
            className={subtleButton}
          >
            Вернуть дату из плана ({formatDateRu(plan.meta.startDate)})
          </button>
        )}
      </div>
      {error && (
        <p id="start-date-error" role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}

function Schedule() {
  const { startDate } = useUserState();
  return (
    <section aria-labelledby="schedule" className={card}>
      <h2 id="schedule" className="font-semibold">
        Расписание в календарь
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Файл .ics: одно событие на день с суммой минут и списком сессий. Импортируйте его в Google Календарь, Apple
        Календарь или Outlook.
      </p>
      <button
        type="button"
        onClick={() => downloadFile("prep-plan.ics", buildIcs(plan, startDate), "text/calendar;charset=utf-8")}
        className={`${primaryButton} mt-3`}
      >
        Скачать расписание (.ics)
      </button>
    </section>
  );
}

function Sync() {
  const active = getSyncToken() !== null;
  const [token, setToken] = useState("");

  function apply(value: string | null) {
    setSyncToken(value);
    window.location.reload(); // хранилище выбирается при запуске
  }

  return (
    <section aria-labelledby="sync" className={card}>
      <h2 id="sync" className="font-semibold">
        Синхронизация
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {active
          ? "Включена: прогресс сохраняется на сервере и одинаков на всех устройствах."
          : "Выключена: данные только в этом браузере. Введите токен (SYNC_TOKEN из настроек Vercel), чтобы хранить их на сервере."}
      </p>
      {active ? (
        <button type="button" onClick={() => apply(null)} className={`${subtleButton} mt-3`}>
          Отключить на этом устройстве
        </button>
      ) : (
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (token.trim()) apply(token.trim());
          }}
        >
          <div>
            <label htmlFor="sync-token" className="block text-sm font-medium">
              Токен
            </label>
            <input
              id="sync-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <button type="submit" className={primaryButton}>
            Включить
          </button>
        </form>
      )}
    </section>
  );
}

function Data() {
  const { actions } = useUserState();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function exportData() {
    try {
      downloadFile(`prep-tracker-${todayString()}.json`, await actions.exportJson(), "application/json");
      setMessage({ kind: "ok", text: "Резервная копия сохранена в файл." });
    } catch (e) {
      setMessage({ kind: "error", text: `Не удалось экспортировать: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  async function importData(file: File | undefined) {
    if (!file) return;
    if (!window.confirm("Импорт заменит весь текущий прогресс данными из файла. Продолжить?")) return;
    try {
      await actions.importJson(await file.text());
      setMessage({ kind: "ok", text: "Данные импортированы." });
    } catch (e) {
      setMessage({ kind: "error", text: `Не удалось импортировать: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  function reset() {
    if (!window.confirm("Сбросить весь прогресс, заметки и журналы? Это нельзя отменить. Сначала лучше сделать экспорт.")) return;
    actions.reset();
    setMessage({ kind: "ok", text: "Данные сброшены." });
  }

  return (
    <section aria-labelledby="data" className={card}>
      <h2 id="data" className="font-semibold">
        Данные
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Копия лежит в этом браузере, а если включена синхронизация, то и на сервере. Резервный файл не помешает в любом случае.
      </p>
      <div className="mt-3 flex flex-wrap items-start gap-3">
        <button type="button" onClick={() => void exportData()} className={primaryButton}>
          Экспортировать в файл
        </button>
        <div>
          <label htmlFor="import-file" className="block text-sm font-medium">
            Импортировать из файла
          </label>
          <input
            id="import-file"
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              void importData(e.target.files?.[0]);
              e.target.value = "";
            }}
            className="mt-1 block text-sm"
          />
        </div>
        <button type="button" onClick={reset} className={`${subtleButton} text-red-700 dark:text-red-400`}>
          Сбросить всё
        </button>
      </div>
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`mt-3 text-sm ${message.kind === "error" ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
