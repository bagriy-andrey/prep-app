import type { UserState } from "../domain/userState";

export type LoadResult =
  | { kind: "empty" }
  | { kind: "ok"; state: UserState }
  | { kind: "corrupt"; raw: string; reason: string };

/**
 * Хранилище состояния пользователя. Методы асинхронные, чтобы позже подключить
 * удалённое хранилище без переписывания логики.
 */
export interface StorageAdapter {
  load(): Promise<LoadResult>;
  save(state: UserState): Promise<void>;
  /** Сохранённое состояние как JSON-текст (для файла резервной копии). */
  export(): Promise<string>;
  /** Проверяет JSON, сохраняет и возвращает состояние. Бросает StateParseError или SyntaxError. */
  import(json: string): Promise<UserState>;
}
