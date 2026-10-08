// Состояние пользователя (разд. 4 спеки) и чистые функции его изменения.

import { dayOfWeek } from "./dates";
import { TOPICS, type TopicKey } from "./topics";

export type Outcome = "clean" | "hint" | "failed";
export type SessionStatus = "done" | "light" | "moved";

export interface Attempt {
  date: string;
  outcome: Outcome;
  /** Потраченное время в минутах; не задано, если не вводилось. */
  minutes?: number;
}

export const MAX_MINUTES = 1440;

/** Минуты из текста поля ввода; undefined для пустого и неверного значения. */
export function parseMinutes(text: string): number | undefined {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const n = Number(trimmed);
  return n <= MAX_MINUTES ? n : undefined;
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
  /** Потраченное время в минутах; учитывается только для done и light. */
  minutes?: number;
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

/**
 * Своя дополнительная задача на день. Сверх плана: на прогресс недели и призы не влияет,
 * время идёт в статистику по теме, выполненная задача считается активностью для стрика.
 */
export interface ExtraTask {
  id: string;
  date: string;
  title: string;
  topic: TopicKey;
  done: boolean;
  /** Потраченное время в минутах; учитывается, как только указано. */
  minutes?: number;
}

/** Куда перенесена сессия плана: неделя и сдвиг дня (0 — понедельник). */
export interface SessionMove {
  week: number;
  offset: number;
}

export interface UserState {
  version: 1;
  startDate?: string;
  items: Record<string, ItemState>;
  sessions: Record<string, SessionMark>;
  dayNotes: Record<string, string>;
  /** Заметки к ручным сессиям (ключ: id сессии). Для сессий с задачей заметка хранится в items[id].note. */
  sessionNotes: Record<string, string>;
  /** Переносы сессий плана на другой день или неделю (ключ: id сессии). */
  sessionMoves: Record<string, SessionMove>;
  /** Заметки к неделям плана (ключ: номер недели). */
  weekNotes: Record<number, string>;
  /** Свои дополнительные задачи. Заметка к задаче лежит в sessionNotes[id]. */
  extraTasks: ExtraTask[];
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
    sessionNotes: {},
    sessionMoves: {},
    weekNotes: {},
    extraTasks: [],
    prizesClaimed: {},
    mocks: [],
    stories: [],
    applications: [],
  };
}

// ---------- изменения (всегда возвращают новый объект) ----------

export function addAttempt(
  state: UserState,
  itemId: string,
  outcome: Outcome,
  date: string,
  minutes?: number,
): UserState {
  const item = state.items[itemId] ?? { attempts: [] };
  const attempt: Attempt = minutes === undefined ? { date, outcome } : { date, outcome, minutes };
  return {
    ...state,
    items: { ...state.items, [itemId]: { ...item, attempts: [...item.attempts, attempt] } },
  };
}

/** Меняет время попытки по номеру; undefined убирает время. */
export function setAttemptMinutes(
  state: UserState,
  itemId: string,
  index: number,
  minutes: number | undefined,
): UserState {
  const item = state.items[itemId];
  if (!item || index < 0 || index >= item.attempts.length) return state;
  const attempts = item.attempts.map((a, i) => {
    if (i !== index) return a;
    const { minutes: _old, ...rest } = a;
    void _old;
    return minutes === undefined ? rest : { ...rest, minutes };
  });
  return { ...state, items: { ...state.items, [itemId]: { ...item, attempts } } };
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

/** Добавляет задачу; необязательная заметка сохраняется под id задачи. */
export function addExtraTask(state: UserState, task: ExtraTask, note?: string): UserState {
  const next = { ...state, extraTasks: [...state.extraTasks, task] };
  return note ? setSessionNote(next, task.id, note) : next;
}

/** Меняет поля задачи. Поле minutes со значением undefined удаляется. */
export function updateExtraTask(
  state: UserState,
  id: string,
  patch: Partial<Omit<ExtraTask, "id">>,
): UserState {
  if (!state.extraTasks.some((t) => t.id === id)) return state;
  return {
    ...state,
    extraTasks: state.extraTasks.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, ...patch };
      if (next.minutes === undefined) delete next.minutes;
      return next;
    }),
  };
}

/** Удаляет задачу вместе с её заметкой. */
export function removeExtraTask(state: UserState, id: string): UserState {
  if (!state.extraTasks.some((t) => t.id === id)) return state;
  const sessionNotes = { ...state.sessionNotes };
  delete sessionNotes[id];
  return { ...state, extraTasks: state.extraTasks.filter((t) => t.id !== id), sessionNotes };
}

/** Все свои задачи по порядку дат (при равных датах по порядку добавления). */
export const extraTasksSorted = (state: UserState) =>
  [...state.extraTasks].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

export const extraTasksOn = (state: UserState, date: string) => state.extraTasks.filter((t) => t.date === date);

/** Заметка к ручной сессии. Пустой текст удаляет заметку. */
export function setSessionNote(state: UserState, sessionId: string, text: string): UserState {
  const sessionNotes = { ...state.sessionNotes };
  if (text) sessionNotes[sessionId] = text;
  else delete sessionNotes[sessionId];
  return { ...state, sessionNotes };
}

/** Переносит сессию плана на другой день; null возвращает её на место. */
export function setSessionMove(state: UserState, sessionId: string, target: SessionMove | null): UserState {
  const sessionMoves = { ...state.sessionMoves };
  if (target) sessionMoves[sessionId] = { week: target.week, offset: target.offset };
  else delete sessionMoves[sessionId];
  return { ...state, sessionMoves };
}

/** Заметка к неделе по её номеру. Пустой текст удаляет заметку. */
export function setWeekNote(state: UserState, week: number, text: string): UserState {
  const weekNotes = { ...state.weekNotes };
  if (text) weekNotes[week] = text;
  else delete weekNotes[week];
  return { ...state, weekNotes };
}

/** Заметка дня по дате YYYY-MM-DD. Пустой текст удаляет заметку. */
export function setDayNote(state: UserState, date: string, text: string): UserState {
  const dayNotes = { ...state.dayNotes };
  if (text) dayNotes[date] = text;
  else delete dayNotes[date];
  return { ...state, dayNotes };
}

/**
 * status = null снимает отметку. Время сохраняется вместе с отметкой;
 * для moved его нет, потому что сессия не сделана.
 */
export function setSessionStatus(
  state: UserState,
  sessionId: string,
  status: SessionStatus | null,
  date: string,
  minutes?: number,
): UserState {
  const sessions = { ...state.sessions };
  if (status === null) delete sessions[sessionId];
  else {
    const mark: SessionMark = { status, date };
    if (minutes !== undefined && status !== "moved") mark.minutes = minutes;
    sessions[sessionId] = mark;
  }
  return { ...state, sessions };
}

/** Меняет время уже отмеченной сессии; у неотмеченной ничего не делает. */
export function setSessionMinutes(state: UserState, sessionId: string, minutes: number | undefined): UserState {
  const mark = state.sessions[sessionId];
  if (!mark || mark.status === "moved") return state;
  const { minutes: _old, ...rest } = mark;
  void _old;
  return { ...state, sessions: { ...state.sessions, [sessionId]: minutes === undefined ? rest : { ...rest, minutes } } };
}

/** Ставит статус всем ещё не отмеченным сессиям из списка (разд. 6.2, «Отметить день»). */
export function markUnmarked(
  state: UserState,
  sessionIds: string[],
  status: SessionStatus,
  date: string,
  minutesById: Record<string, number> = {},
): UserState {
  const todo = sessionIds.filter((id) => !state.sessions[id]);
  if (todo.length === 0) return state;
  const sessions = { ...state.sessions };
  for (const id of todo) {
    const minutes = minutesById[id];
    sessions[id] = minutes === undefined || status === "moved" ? { status, date } : { status, date, minutes };
  }
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
const isMinutes = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= MAX_MINUTES;

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
      if (a.minutes !== undefined && !isMinutes(a.minutes)) fail(`items.${id}.attempts: неверное время`);
    }
    for (const key of ["title", "keyIdea", "note"]) optionalString(value, key, `items.${id}`);
    items[id] = value as unknown as ItemState;
  }

  if (!isRecord(raw.sessions)) fail("sessions: ожидался объект");
  for (const [id, mark] of Object.entries(raw.sessions)) {
    if (!isRecord(mark) || !isStatus(mark.status) || !isDate(mark.date)) fail(`sessions.${id}: неверная отметка`);
    if (mark.minutes !== undefined && !isMinutes(mark.minutes)) fail(`sessions.${id}: неверное время`);
  }

  if (!isRecord(raw.dayNotes)) fail("dayNotes: ожидался объект");
  for (const [date, note] of Object.entries(raw.dayNotes)) {
    if (!isDate(date) || typeof note !== "string") fail(`dayNotes.${date}: неверная заметка`);
  }

  // Поле добавлено позже: в старых сохранениях его нет.
  const sessionNotes = raw.sessionNotes ?? {};
  if (!isRecord(sessionNotes)) fail("sessionNotes: ожидался объект");
  for (const [id, note] of Object.entries(sessionNotes)) {
    if (typeof note !== "string") fail(`sessionNotes.${id}: ожидалась строка`);
  }

  // Поле добавлено позже: в старых сохранениях его нет.
  const sessionMoves = raw.sessionMoves ?? {};
  if (!isRecord(sessionMoves)) fail("sessionMoves: ожидался объект");
  for (const [id, move] of Object.entries(sessionMoves)) {
    if (
      !isRecord(move) ||
      !Number.isInteger(move.week) ||
      (move.week as number) < 1 ||
      !Number.isInteger(move.offset) ||
      (move.offset as number) < 0 ||
      (move.offset as number) > 6
    ) {
      fail(`sessionMoves.${id}: неверный перенос`);
    }
  }

  // Поле добавлено позже: в старых сохранениях его нет.
  const weekNotes = raw.weekNotes ?? {};
  if (!isRecord(weekNotes)) fail("weekNotes: ожидался объект");
  for (const [week, note] of Object.entries(weekNotes)) {
    if (!/^[1-9]\d*$/.test(week) || typeof note !== "string") fail(`weekNotes.${week}: неверная заметка`);
  }

  // Поле добавлено позже: в старых сохранениях его нет.
  const extraTasks = raw.extraTasks ?? [];
  if (!Array.isArray(extraTasks)) fail("extraTasks: ожидался массив");
  const topicKeys = new Set<string>(TOPICS.map((t) => t.key));
  const taskIds = new Set<string>();
  for (const t of extraTasks) {
    if (
      !isRecord(t) ||
      typeof t.id !== "string" ||
      t.id === "" ||
      !isDate(t.date) ||
      typeof t.title !== "string" ||
      typeof t.topic !== "string" ||
      !topicKeys.has(t.topic) ||
      typeof t.done !== "boolean" ||
      (t.minutes !== undefined && !isMinutes(t.minutes))
    ) {
      fail("extraTasks: неверная задача");
    }
    if (taskIds.has(t.id)) fail(`extraTasks: повторяющийся id ${t.id}`);
    taskIds.add(t.id);
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
    sessionNotes: sessionNotes as Record<string, string>,
    sessionMoves: sessionMoves as Record<string, SessionMove>,
    weekNotes: weekNotes as Record<number, string>,
    extraTasks: extraTasks as ExtraTask[],
    prizesClaimed: raw.prizesClaimed as Record<number, string>,
    mocks: raw.mocks as MockEntry[],
    stories: raw.stories as StoryEntry[],
    applications: raw.applications as ApplicationEntry[],
  };
}
