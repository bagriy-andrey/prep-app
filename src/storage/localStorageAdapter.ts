import { createInitialState, parseUserState, type UserState } from "../domain/userState";
import type { LoadResult, StorageAdapter } from "./types";

export const STORAGE_KEY = "prep-tracker-state";

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly key = STORAGE_KEY,
    private readonly storage: Storage = window.localStorage,
  ) {}

  async load(): Promise<LoadResult> {
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.key);
    } catch (e) {
      // Хранилище недоступно (например, заблокировано): работаем без сохранения.
      return { kind: "corrupt", raw: "", reason: e instanceof Error ? e.message : String(e) };
    }
    if (raw === null) return { kind: "empty" };
    try {
      return { kind: "ok", state: parseUserState(JSON.parse(raw)) };
    } catch (e) {
      return { kind: "corrupt", raw, reason: e instanceof Error ? e.message : String(e) };
    }
  }

  async save(state: UserState): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(state));
  }

  async export(): Promise<string> {
    const raw = this.storage.getItem(this.key);
    return raw ?? JSON.stringify(createInitialState(), null, 2);
  }

  async import(json: string): Promise<UserState> {
    const state = parseUserState(JSON.parse(json));
    await this.save(state);
    return state;
  }
}
