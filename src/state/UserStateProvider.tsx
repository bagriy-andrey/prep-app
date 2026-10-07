import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { plan } from "../data/plan";
import { todayString } from "../domain/dates";
import type { TopicKey } from "../domain/topics";
import { newId } from "../lib/id";
import { claimPrize } from "../domain/prizes";
import { createSeededState } from "../domain/seed";
import {
  addAttempt,
  addEntry,
  addExtraTask,
  createInitialState,
  markUnmarked,
  removeEntry,
  removeExtraTask,
  removeLastAttempt,
  setDayNote,
  setItemText,
  setAttemptMinutes,
  setItemTitle,
  setSessionMinutes,
  setSessionNote,
  setSessionStatus,
  setStartDate,
  setWeekNote,
  updateEntry,
  updateExtraTask,
  type ExtraTask,
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
  | { type: "addAttempt"; itemId: string; outcome: Outcome; date: string; minutes?: number }
  | { type: "setAttemptMinutes"; itemId: string; index: number; minutes?: number }
  | { type: "setSessionMinutes"; id: string; minutes?: number }
  | { type: "removeLastAttempt"; itemId: string }
  | { type: "setItemTitle"; itemId: string; title: string }
  | { type: "setItemText"; itemId: string; field: ItemTextField; text: string }
  | { type: "setDayNote"; date: string; text: string }
  | { type: "setSessionNote"; id: string; text: string }
  | { type: "setWeekNote"; week: number; text: string }
  | { type: "addExtraTask"; task: ExtraTask; note?: string }
  | { type: "updateExtraTask"; id: string; patch: Partial<Omit<ExtraTask, "id">> }
  | { type: "removeExtraTask"; id: string }
  | { type: "setSession"; id: string; status: SessionStatus | null; date: string; minutes?: number }
  | { type: "markUnmarked"; ids: string[]; status: SessionStatus; date: string; minutesById?: Record<string, number> }
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
      return addAttempt(state, action.itemId, action.outcome, action.date, action.minutes);
    case "setAttemptMinutes":
      return setAttemptMinutes(state, action.itemId, action.index, action.minutes);
    case "setSessionMinutes":
      return setSessionMinutes(state, action.id, action.minutes);
    case "removeLastAttempt":
      return removeLastAttempt(state, action.itemId);
    case "setItemTitle":
      return setItemTitle(state, action.itemId, action.title);
    case "setItemText":
      return setItemText(state, action.itemId, action.field, action.text);
    case "setDayNote":
      return setDayNote(state, action.date, action.text);
    case "setSessionNote":
      return setSessionNote(state, action.id, action.text);
    case "setWeekNote":
      return setWeekNote(state, action.week, action.text);
    case "addExtraTask":
      return addExtraTask(state, action.task, action.note);
    case "updateExtraTask":
      return updateExtraTask(state, action.id, action.patch);
    case "removeExtraTask":
      return removeExtraTask(state, action.id);
    case "setSession":
      return setSessionStatus(state, action.id, action.status, action.date, action.minutes);
    case "markUnmarked":
      return markUnmarked(state, action.ids, action.status, action.date, action.minutesById);
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
  /** minutes: потраченное время; undefined, если не указано. */
  addAttempt(itemId: string, outcome: Outcome, minutes?: number): void;
  setAttemptMinutes(itemId: string, index: number, minutes: number | undefined): void;
  setSessionMinutes(id: string, minutes: number | undefined): void;
  removeLastAttempt(itemId: string): void;
  setItemTitle(itemId: string, title: string): void;
  setItemText(itemId: string, field: ItemTextField, text: string): void;
  setDayNote(date: string, text: string): void;
  setSessionNote(id: string, text: string): void;
  setWeekNote(week: number, text: string): void;
  /** Добавляет свою дополнительную задачу на день (с необязательной заметкой) и возвращает её id. */
  addExtraTask(task: { date: string; title: string; topic: TopicKey; minutes?: number; note?: string }): string;
  updateExtraTask(id: string, patch: Partial<Omit<ExtraTask, "id">>): void;
  removeExtraTask(id: string): void;
  /** status = null снимает отметку. */
  setSession(id: string, status: SessionStatus | null, minutes?: number): void;
  /** minutesById: время по умолчанию для отмечаемых сессий. */
  markUnmarked(ids: string[], status: SessionStatus, minutesById?: Record<string, number>): void;
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
  /**
   * Растёт, когда состояние заменено целиком (загрузка, импорт, сброс).
   * Отличает такую замену от действий пользователя: например, при ней не показывают уведомления.
   */
  epoch: number;
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
  const [epoch, setEpoch] = useState(0);
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
    setEpoch((e) => e + 1);
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
      addAttempt: (itemId, outcome, minutes) =>
        dispatch({ type: "addAttempt", itemId, outcome, date: todayString(), minutes }),
      setAttemptMinutes: (itemId, index, minutes) => dispatch({ type: "setAttemptMinutes", itemId, index, minutes }),
      setSessionMinutes: (id, minutes) => dispatch({ type: "setSessionMinutes", id, minutes }),
      removeLastAttempt: (itemId) => dispatch({ type: "removeLastAttempt", itemId }),
      setItemTitle: (itemId, title) => dispatch({ type: "setItemTitle", itemId, title }),
      setItemText: (itemId, field, text) => dispatch({ type: "setItemText", itemId, field, text }),
      setDayNote: (date, text) => dispatch({ type: "setDayNote", date, text }),
      setSessionNote: (id, text) => dispatch({ type: "setSessionNote", id, text }),
      setWeekNote: (week, text) => dispatch({ type: "setWeekNote", week, text }),
      addExtraTask: ({ note, ...task }) => {
        const id = newId();
        dispatch({ type: "addExtraTask", task: { ...task, id, done: false }, note });
        return id;
      },
      updateExtraTask: (id, patch) => dispatch({ type: "updateExtraTask", id, patch }),
      removeExtraTask: (id) => dispatch({ type: "removeExtraTask", id }),
      setSession: (id, status, minutes) => dispatch({ type: "setSession", id, status, date: todayString(), minutes }),
      markUnmarked: (ids, status, minutesById) =>
        dispatch({ type: "markUnmarked", ids, status, date: todayString(), minutesById }),
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
        setEpoch((e) => e + 1);
      },
      reset: () => {
        dispatch({ type: "replace", state: createSeededState(plan) });
        setEpoch((e) => e + 1);
      },
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
          setEpoch((e) => e + 1);
          setPhase({ kind: "ready" });
        }}
        onStartFresh={() => {
          persisted.current = null;
          dispatch({ type: "replace", state: createSeededState(plan) });
          setEpoch((e) => e + 1);
          setPhase({ kind: "ready" });
        }}
      />
    );
  }

  return (
    <UserStateContext.Provider
      value={{ state, actions, saveError, epoch, startDate: state.startDate ?? plan.meta.startDate }}
    >
      {children}
    </UserStateContext.Provider>
  );
}
