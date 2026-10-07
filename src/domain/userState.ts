// Состояние пользователя (разд. 4 спеки) и чистые функции его изменения.

import { dayOfWeek } from "./dates";

export type Outcome = "clean" | "hint" | "failed";
export type SessionStatus = "done" | "light" | "moved";

export interface Attempt {
  date: string;
  outcome: Outcome;
}

export interface ItemState {
  title?: string;
  attempts: Attempt[];
  keyIdea?: string;
  note?: string;
}

/** Ручная отметка сессии. Дата ставится в момент отметки: по ней считаются стрик и календарь. */
export interface SessionMark {
  status: SessionStatus;
  date: string;
}

export interface MockEntry {
  week: number;
  type: string;
  date?: string;
  notes?: string;
}

export interface StoryEntry {
  topic: string;
  situation?: string;
  ready: boolean;
  result?: string;
}

export interface ApplicationEntry {
  company: string;
  status: string;
  referral?: string;
  appliedOn?: string;
  nextStep?: string;
  notes?: string;
}

export interface UserState {
  version: 1;
  startDate?: string;
  items: Record<string, ItemState>;
  sessions: Record<string, SessionMark>;
  dayNotes: Record<string, string>;
  prizesClaimed: Record<number, string>;
  mocks: MockEntry[];
  stories: StoryEntry[];
  applications: ApplicationEntry[];
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  clean: "Сам",
  hint: "С подсказкой",
  failed: "Не решил",
};

export function createInitialState(): UserState {
  return {
    version: 1,
    items: {},
    sessions: {},
    dayNotes: {},
    prizesClaimed: {},
    mocks: [],
    stories: [],
    applications: [],
  };
}

// ---------- изменения (всегда возвращают новый объект) ----------

export function addAttempt(state: UserState, itemId: string, outcome: Outcome, date: string): UserState {
  const item = state.items[itemId] ?? { attempts: [] };
  return {
    ...state,
    items: { ...state.items, [itemId]: { ...item, attempts: [...item.attempts, { date, outcome }] } },
  };
}

/** Убирает последнюю попытку: исправление случайного нажатия. */
export function removeLastAttempt(state: UserState, itemId: string): UserState {
  const item = state.items[itemId];
  if (!item || item.attempts.length === 0) return state;
  return {
    ...state,
    items: { ...state.items, [itemId]: { ...item, attempts: item.attempts.slice(0, -1) } },
  };
}

export function setItemTitle(state: UserState, itemId: string, title: string): UserState {
  const item = state.items[itemId] ?? { attempts: [] };
  const trimmed = title.trim();
  const next = { ...item };
  if (trimmed) next.title = trimmed;
  else delete next.title;
  return { ...state, items: { ...state.items, [itemId]: next } };
}

export type ItemTextField = "keyIdea" | "note";

/** Ключевая идея и заметка к задаче. Пустой текст удаляет поле. Текст хранится как введён, без обрезки. */
export function setItemText(state: UserState, itemId: string, field: ItemTextField, text: string): UserState {
  const item = state.items[itemId] ?? { attempts: [] };
  const next = { ...item };
  if (text) next[field] = text;
  else delete next[field];
  return { ...state, items: { ...state.items, [itemId]: next } };
}

/** Заметка дня по дате YYYY-MM-DD. Пустой текст удаляет заметку. */
export function setDayNote(state: UserState, date: string, text: string): UserState {
  const dayNotes = { ...state.dayNotes };
  if (text) dayNotes[date] = text;
  else delete dayNotes[date];
  return { ...state, dayNotes };
}

/** status = null снимает отметку. */
export function setSessionStatus(
  state: UserState,
  sessionId: string,
  status: SessionStatus | null,
  date: string,
): UserState {
  const sessions = { ...state.sessions };
  if (status === null) delete sessions[sessionId];
  else sessions[sessionId] = { status, date };
  return { ...state, sessions };
}

/** Ставит статус всем ещё не отмеченным сессиям из списка (разд. 6.2, «Отметить день»). */
export function markUnmarked(
  state: UserState,
  sessionIds: string[],
  status: SessionStatus,
  date: string,
): UserState {
  const todo = sessionIds.filter((id) => !state.sessions[id]);
  if (todo.length === 0) return state;
  const sessions = { ...state.sessions };
  for (const id of todo) sessions[id] = { status, date };
  return { ...state, sessions };
}

export type JournalKey = "mocks" | "stories" | "applications";
export interface JournalEntries {
  mocks: MockEntry;
  stories: StoryEntry;
  applications: ApplicationEntry;
}
export type JournalEntry = JournalEntries[JournalKey];

function withJournal(state: UserState, key: JournalKey, list: JournalEntry[]): UserState {
  return { ...state, [key]: list };
}

export function addEntry(state: UserState, key: JournalKey, entry: JournalEntry): UserState {
  return withJournal(state, key, [...state[key], entry]);
}

/** Меняет поля записи. Поля со значением undefined удаляются. */
export function updateEntry(state: UserState, key: JournalKey, index: number, patch: Partial<JournalEntry>): UserState {
  const list = state[key];
  if (index < 0 || index >= list.length) return state;
  const next: Record<string, unknown> = { ...list[index], ...patch };
  for (const field of Object.keys(next)) if (next[field] === undefined) delete next[field];
  return withJournal(state, key, list.map((e, i) => (i === index ? (next as unknown as JournalEntry) : e)));
}

export function removeEntry(state: UserState, key: JournalKey, index: number): UserState {
  if (index < 0 || index >= state[key].length) return state;
  return withJournal(state, key, state[key].filter((_, i) => i !== index));
}

/** Переопределяет дату старта; null возвращает дату из плана. Дата должна быть понедельником. */
export function setStartDate(state: UserState, date: string | null): UserState {
  const next = { ...state };
  if (date === null) {
    delete next.startDate;
    return next;
  }
  if (!isDate(date) || dayOfWeek(date) !== 1) throw new StateParseError("Дата старта должна быть понедельником");
  next.startDate = date;
  return next;
}

// ---------- чтение сохранённых данных ----------

export class StateParseError extends Error {}

function fail(message: string): never {
  throw new StateParseError(message);
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isOutcome = (v: unknown): v is Outcome => v === "clean" || v === "hint" || v === "failed";
const isStatus = (v: unknown): v is SessionStatus => v === "done" || v === "light" || v === "moved";

function optionalString(obj: Record<string, unknown>, key: string, where: string) {
  if (obj[key] !== undefined && typeof obj[key] !== "string") fail(`${where}.${key}: ожидалась строка`);
}

/**
 * Проверяет произвольные данные и приводит их к UserState.
 * Бросает StateParseError, если данные повреждены или версия неизвестна.
 */
export function parseUserState(raw: unknown): UserState {
  if (!isRecord(raw)) fail("Состояние должно быть объектом");
  if (raw.version !== 1) fail(`Неизвестная версия состояния: ${String(raw.version)}`);

  if (raw.startDate !== undefined && !isDate(raw.startDate)) fail("startDate: ожидалась дата YYYY-MM-DD");

  const items: Record<string, ItemState> = {};
  if (!isRecord(raw.items)) fail("items: ожидался объект");
  for (const [id, value] of Object.entries(raw.items)) {
    if (!isRecord(value)) fail(`items.${id}: ожидался объект`);
    if (!Array.isArray(value.attempts)) fail(`items.${id}.attempts: ожидался массив`);
    for (const a of value.attempts) {
      if (!isRecord(a) || !isDate(a.date) || !isOutcome(a.outcome)) fail(`items.${id}.attempts: неверная попытка`);
    }
    for (const key of ["title", "keyIdea", "note"]) optionalString(value, key, `items.${id}`);
    items[id] = value as unknown as ItemState;
  }

  if (!isRecord(raw.sessions)) fail("sessions: ожидался объект");
  for (const [id, mark] of Object.entries(raw.sessions)) {
    if (!isRecord(mark) || !isStatus(mark.status) || !isDate(mark.date)) fail(`sessions.${id}: неверная отметка`);
  }

  if (!isRecord(raw.dayNotes)) fail("dayNotes: ожидался объект");
  for (const [date, note] of Object.entries(raw.dayNotes)) {
    if (!isDate(date) || typeof note !== "string") fail(`dayNotes.${date}: неверная заметка`);
  }

  if (!isRecord(raw.prizesClaimed)) fail("prizesClaimed: ожидался объект");
  for (const [week, date] of Object.entries(raw.prizesClaimed)) {
    if (!/^\d+$/.test(week) || !isDate(date)) fail(`prizesClaimed.${week}: неверная запись`);
  }

  for (const key of ["mocks", "stories", "applications"] as const) {
    if (!Array.isArray(raw[key])) fail(`${key}: ожидался массив`);
    if (!raw[key].every(isRecord)) fail(`${key}: ожидались объекты`);
  }

  return {
    version: 1,
    startDate: raw.startDate as string | undefined,
    items,
    sessions: raw.sessions as Record<string, SessionMark>,
    dayNotes: raw.dayNotes as Record<string, string>,
    prizesClaimed: raw.prizesClaimed as Record<number, string>,
    mocks: raw.mocks as MockEntry[],
    stories: raw.stories as StoryEntry[],
    applications: raw.applications as ApplicationEntry[],
  };
}
