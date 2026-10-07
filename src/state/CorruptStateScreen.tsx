import { useState } from "react";

interface Props {
  raw: string;
  reason: string;
  onImport(json: string): Promise<void>;
  onStartFresh(): void;
}

export default function CorruptStateScreen({ raw, reason, onImport, onStartFresh }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      await onImport(await file.text());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "prep-tracker-state-damaged.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-xl font-semibold">Не удалось прочитать сохранённые данные</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Данные в браузере повреждены или недоступны. Пока вы не выбрали действие, ничего не перезаписывается.
      </p>
      <p className="mt-2 rounded-lg bg-slate-100 p-2 font-mono text-sm break-words dark:bg-slate-800">{reason}</p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="restore" className="block font-medium">
            Импортировать резервную копию
          </label>
          <input
            id="restore"
            type="file"
            accept="application/json,.json"
            onChange={(e) => void handleFile(e.target.files?.[0])}
            className="mt-1 block w-full text-sm"
          />
          {error && (
            <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {raw && (
          <button type="button" onClick={download} className={secondary}>
            Скачать повреждённые данные
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (window.confirm("Начать заново? Текущие повреждённые данные будут заменены.")) onStartFresh();
          }}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
        >
          Начать заново
        </button>
      </div>
    </main>
  );
}

const secondary =
  "block rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800";
