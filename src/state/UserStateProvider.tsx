import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { plan } from "../data/plan";
import { todayString } from "../domain/dates";
import { claimPrize } from "../domain/prizes";
import { createSeededState } from "../domain/seed";
import {
  addAttempt,
  addEntry,
  createInitialState,
  markUnmarked,
  removeEntry,
  removeLastAttempt,
  setDayNote,
  setItemText,
  setItemTitle,
  setSessionStatus,
  setStartDate,
  updateEntry,
  type ItemTextField,
  type JournalEntries,
  type JournalEntry,
  type JournalKey,
  type Outcome,
  type SessionStatus,
  type UserState,
} from "../domain/userState";
import { LocalStorageAdapter } from "../storage/localStorageAdapter";
import type { LoadResult, StorageAdapter } from "../storage/types";
import CorruptStateScreen from "./CorruptStateScreen";

type Action =
  | { type: "replace"; state: UserState }
  | { type: "addAttempt"; itemId: string; outcome: Outcome; date: string }
  | { type: "removeLastAttempt"; itemId: string }
  | { type: "setItemTitle"; itemId: string; title: string }
  | { type: "setItemText"; itemId: string; field: ItemTextField; text: string }
  | { type: "setDayNote"; date: string; text: string }
  | { type: "setSession"; id: string; status: SessionStatus | null; date: string }
  | { type: "markUnmarked"; ids: string[]; status: SessionStatus; date: string }
  | { type: "claimPrize"; week: number; date: string }
  | { type: "setStartDate"; date: string | null }
  | { type: "addEntry"; key: JournalKey; entry: JournalEntry }
  | { type: "updateEntry"; key: JournalKey; index: number; patch: Partial<JournalEntry> }
  | { type: "removeEntry"; key: JournalKey; index: number };

function reducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case "replace":
      return action.state;
    case "addAttempt":
      return addAttempt(state, action.itemId, action.outcome, action.date);
    case "removeLastAttempt":
      return removeLastAttempt(state, action.itemId);
    case "setItemTitle":
      return setItemTitle(state, action.itemId, action.title);
    case "setItemText":
      return setItemText(state, action.itemId, action.field, action.text);
    case "setDayNote":
      return setDayNote(state, action.date, action.text);
    case "setSession":
      return setSessionStatus(state, action.id, action.status, action.date);
    case "markUnmarked":
      return markUnmarked(state, action.ids, action.status, action.date);
    case "claimPrize":
      return claimPrize(plan, state, action.week, action.date);
    case "setStartDate":
      try {
        return setStartDate(state, action.date);
      } catch {
        return state; // не понедельник: интерфейс проверяет дату заранее
      }
    case "addEntry":
      return addEntry(state, action.key, action.entry);
    case "updateEntry":
      return updateEntry(state, action.key, action.index, action.patch);
    case "removeEntry":
      return removeEntry(state, action.key, action.index);
  }
}

export interface UserStateActions {
  addAttempt(itemId: string, outcome: Outcome): void;
  removeLastAttempt(itemId: string): void;
  setItemTitle(itemId: string, title: string): void;
  setItemText(itemId: string, field: ItemTextField, text: string): void;
  setDayNote(date: string, text: string): void;
  /** status = null снимает отметку. */
  setSession(id: string, status: SessionStatus | null): void;
  markUnmarked(ids: string[], status: SessionStatus): void;
  claimPrize(week: number): void;
  /** Дата старта (понедельник); null возвращает дату из плана. */
  setStartDate(date: string | null): void;
  addEntry<K extends JournalKey>(key: K, entry: JournalEntries[K]): void;
  updateEntry<K extends JournalKey>(key: K, index: number, patch: Partial<JournalEntries[K]>): void;
  removeEntry(key: JournalKey, index: number): void;
  /** JSON-текст текущего состояния для файла резервной копии. */
  exportJson(): Promise<string>;
  /** Заменяет состояние данными из JSON. Бросает ошибку, если данные неверны. */
  importJson(json: string): Promise<void>;
  /** Полный сброс: прогресс очищается, журналы заполняются заготовками плана. */
  reset(): void;
}

interface Ctx {
  state: UserState;
  actions: UserStateActions;
  /** Текст ошибки последнего сохранения; null, если всё сохранено. */
  saveError: string | null;
  startDate: string;
}

const UserStateContext = createContext<Ctx | null>(null);

export function useUserState(): Ctx {
  const ctx = useContext(UserStateContext);
  if (!ctx) throw new Error("useUserState вызван вне UserStateProvider");
  return ctx;
}

type Phase = { kind: "loading" } | { kind: "ready" } | { kind: "corrupt"; raw: string; reason: string };

export default function UserStateProvider({
  children,
  adapter: adapterProp,
}: {
  children: ReactNode;
  adapter?: StorageAdapter;
}) {
  const adapter = useMemo(() => adapterProp ?? new LocalStorageAdapter(), [adapterProp]);
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [saveError, setSaveError] = useState<string | null>(null);
  // Последнее состояние, которое уже лежит в хранилище: его повторно не пишем.
  const persisted = useRef<UserState | null>(null);
  const latest = useRef(state);
  latest.current = state;

  const applyLoad = useCallback((result: LoadResult) => {
    if (result.kind === "corrupt") {
      setPhase({ kind: "corrupt", raw: result.raw, reason: result.reason });
      return;
    }
    if (result.kind === "ok") {
      persisted.current = result.state;
      dispatch({ type: "replace", state: result.state });
    } else {
      // Первый запуск: журналы заполняются заготовками плана.
      dispatch({ type: "replace", state: createSeededState(plan) });
    }
    setPhase({ kind: "ready" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    adapter.load().then((result) => {
      if (!cancelled) applyLoad(result);
    });
    return () => {
      cancelled = true;
    };
  }, [adapter, applyLoad]);

  // Сохранение после каждого изменения.
  useEffect(() => {
    if (phase.kind !== "ready" || state === persisted.current) return;
    persisted.current = state;
    adapter.save(state).then(
      () => setSaveError(null),
      (e) => setSaveError(e instanceof Error ? e.message : String(e)),
    );
  }, [state, phase.kind, adapter]);

  const actions = useMemo<UserStateActions>(
    () => ({
      addAttempt: (itemId, outcome) => dispatch({ type: "addAttempt", itemId, outcome, date: todayString() }),
      removeLastAttempt: (itemId) => dispatch({ type: "removeLastAttempt", itemId }),
      setItemTitle: (itemId, title) => dispatch({ type: "setItemTitle", itemId, title }),
      setItemText: (itemId, field, text) => dispatch({ type: "setItemText", itemId, field, text }),
      setDayNote: (date, text) => dispatch({ type: "setDayNote", date, text }),
      setSession: (id, status) => dispatch({ type: "setSession", id, status, date: todayString() }),
      markUnmarked: (ids, status) => dispatch({ type: "markUnmarked", ids, status, date: todayString() }),
      claimPrize: (week) => dispatch({ type: "claimPrize", week, date: todayString() }),
      setStartDate: (date) => dispatch({ type: "setStartDate", date }),
      addEntry: (key, entry) => dispatch({ type: "addEntry", key, entry }),
      updateEntry: (key, index, patch) => dispatch({ type: "updateEntry", key, index, patch }),
      removeEntry: (key, index) => dispatch({ type: "removeEntry", key, index }),
      exportJson: async () => {
        const current = latest.current;
        try {
          await adapter.save(current); // чтобы в файл попало всё, что на экране
          persisted.current = current;
          return await adapter.export();
        } catch {
          return JSON.stringify(current, null, 2); // хранилище недоступно: отдаём состояние из памяти
        }
      },
      importJson: async (json) => {
        const imported = await adapter.import(json);
        persisted.current = imported;
        dispatch({ type: "replace", state: imported });
      },
      reset: () => dispatch({ type: "replace", state: createSeededState(plan) }),
    }),
    [adapter],
  );

  if (phase.kind === "loading") return null;

  if (phase.kind === "corrupt") {
    return (
      <CorruptStateScreen
        raw={phase.raw}
        reason={phase.reason}
        onImport={async (json) => {
          const imported = await adapter.import(json);
          persisted.current = imported;
          dispatch({ type: "replace", state: imported });
          setPhase({ kind: "ready" });
        }}
        onStartFresh={() => {
          persisted.current = null;
          dispatch({ type: "replace", state: createSeededState(plan) });
          setPhase({ kind: "ready" });
        }}
      />
    );
  }

  return (
    <UserStateContext.Provider
      value={{ state, actions, saveError, startDate: state.startDate ?? plan.meta.startDate }}
    >
      {children}
    </UserStateContext.Provider>
  );
}
