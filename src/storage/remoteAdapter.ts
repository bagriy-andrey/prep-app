import { parseUserState, type UserState } from "../domain/userState";
import { LocalStorageAdapter } from "./localStorageAdapter";
import type { LoadResult, StorageAdapter } from "./types";

export const SYNC_TOKEN_KEY = "prep-sync-token";
const DIRTY_KEY = "prep-sync-dirty";
const ENDPOINT = "/api/state";

export function getSyncToken(): string | null {
  try {
    return window.localStorage.getItem(SYNC_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setSyncToken(token: string | null): void {
  if (token) window.localStorage.setItem(SYNC_TOKEN_KEY, token);
  else window.localStorage.removeItem(SYNC_TOKEN_KEY);
}

function setDirty(value: boolean) {
  try {
    if (value) window.localStorage.setItem(DIRTY_KEY, "1");
    else window.localStorage.removeItem(DIRTY_KEY);
  } catch {
    /* кэш недоступен: синхронизация продолжает работать */
  }
}

function isDirty(): boolean {
  try {
    return window.localStorage.getItem(DIRTY_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Главное хранилище на сервере (/api/state), localStorage служит кэшем.
 * Если сервер недоступен, изменения копятся в кэше (флаг dirty) и уходят на сервер при следующем успешном сохранении или загрузке.
 */
export class RemoteStorageAdapter implements StorageAdapter {
  private readonly local = new LocalStorageAdapter();
  private pending: UserState | null = null;
  private inflight: Promise<void> | null = null;

  constructor(private readonly token: string) {}

  private async request(method: "GET" | "PUT", body?: string): Promise<Response> {
    const response = await fetch(ENDPOINT, {
      method,
      headers: { Authorization: `Bearer ${this.token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body,
    });
    if (response.status === 401) throw new Error("Неверный токен синхронизации");
    return response;
  }

  async load(): Promise<LoadResult> {
    const cached = await this.local.load();
    let response: Response;
    try {
      response = await this.request("GET");
    } catch {
      return cached; // нет сети или токен не подошёл: работаем с кэшем, ошибка появится при сохранении
    }

    const isJson = response.headers.get("content-type")?.includes("application/json");
    if (!isJson || (!response.ok && response.status !== 404)) return cached; // например, dev-сервер без /api

    if (isDirty() && cached.kind === "ok") {
      await this.save(cached.state).catch(() => undefined);
      return cached;
    }
    if (response.status === 404) {
      // На сервере пусто: переносим туда локальные данные.
      if (cached.kind === "ok") await this.save(cached.state).catch(() => undefined);
      return cached;
    }

    const raw = await response.text();
    try {
      const state = parseUserState(JSON.parse(raw));
      await this.local.save(state);
      return { kind: "ok", state };
    } catch (e) {
      return { kind: "corrupt", raw, reason: e instanceof Error ? e.message : String(e) };
    }
  }

  async save(state: UserState): Promise<void> {
    await this.local.save(state);
    setDirty(true);
    this.pending = state;
    this.inflight ??= this.flush().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  // Отправляет последнее состояние; изменения, пришедшие во время запроса, уходят следующим кругом.
  private async flush(): Promise<void> {
    while (this.pending) {
      const state = this.pending;
      this.pending = null;
      let response: Response;
      try {
        response = await this.request("PUT", JSON.stringify(state));
      } catch (e) {
        this.pending ??= state;
        throw e instanceof Error && e.message.includes("токен") ? e : new Error("Нет связи с сервером, данные сохранены на устройстве");
      }
      if (!response.ok) {
        this.pending ??= state;
        throw new Error(`Сервер ответил ${response.status}`);
      }
      if (!this.pending) setDirty(false);
    }
  }

  export(): Promise<string> {
    return this.local.export();
  }

  async import(json: string): Promise<UserState> {
    const state = await this.local.import(json);
    await this.save(state);
    return state;
  }
}
