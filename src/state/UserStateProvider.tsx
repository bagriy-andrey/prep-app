import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { plan } from "../data/plan";
import { todayString } from "../domain/dates";
import { claimPrize } from "../domain/prizes";
import {
  addAttempt,
  createInitialState,
  markUnmarked,
  removeLastAttempt,
  setDayNote,
  setItemText,
  setItemTitle,
  setSessionStatus,
  type ItemTextField,
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
  | { type: "claimPrize"; week: number; date: string };

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

  const applyLoad = useCallback((result: LoadResult) => {
    if (result.kind === "corrupt") {
      setPhase({ kind: "corrupt", raw: result.raw, reason: result.reason });
      return;
    }
    if (result.kind === "ok") {
      persisted.current = result.state;
      dispatch({ type: "replace", state: result.state });
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
    }),
    [],
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
          dispatch({ type: "replace", state: createInitialState() });
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
