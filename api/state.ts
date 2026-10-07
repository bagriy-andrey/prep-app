import { timingSafeEqual } from "node:crypto";

// Единственный пользователь: состояние лежит одним значением в Redis (Upstash через Vercel Marketplace).
// Доступ закрыт токеном SYNC_TOKEN, который передаётся в заголовке Authorization: Bearer.

const KEY = "prep-tracker-state";
const MAX_BYTES = 2_000_000;

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  send(body: string): void;
}

function redisEnv() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis не настроен");
  return { url, token };
}

async function redis(command: unknown[]): Promise<unknown> {
  const { url, token } = redisEnv();
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`Redis ответил ${response.status}`);
  return ((await response.json()) as { result: unknown }).result;
}

function authorized(req: Req): boolean {
  const expected = process.env.SYNC_TOKEN;
  const header = req.headers.authorization;
  if (!expected || typeof header !== "string") return false;
  const given = Buffer.from(header.replace(/^Bearer /, ""));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!authorized(req)) return res.status(401).send(JSON.stringify({ error: "Неверный токен" }));

  try {
    if (req.method === "GET") {
      const value = await redis(["GET", KEY]);
      if (typeof value !== "string") return res.status(404).send(JSON.stringify({ error: "Пусто" }));
      return res.status(200).send(value);
    }
    if (req.method === "PUT") {
      const body = req.body;
      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return res.status(400).send(JSON.stringify({ error: "Ожидается JSON-объект" }));
      }
      const text = JSON.stringify(body);
      if (text.length > MAX_BYTES) return res.status(413).send(JSON.stringify({ error: "Слишком большие данные" }));
      await redis(["SET", KEY, text]);
      return res.status(200).send(JSON.stringify({ ok: true }));
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).send(JSON.stringify({ error: "Метод не поддерживается" }));
  } catch (e) {
    return res.status(500).send(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
  }
}
