// Проверка ссылок из src/data/plan.json (разд. 8 спеки).
// Запуск: npm run check-links [-- --concurrency 4 --delay 300 --pattern-only]

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plan, PlanLink } from "../src/data/types";

const plan = JSON.parse(
  readFileSync(fileURLToPath(new URL("../src/data/plan.json", import.meta.url)), "utf8"),
) as Plan;

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
}

const CONCURRENCY = arg("concurrency", 4);
const DELAY_MS = arg("delay", 300);
const TIMEOUT_MS = 15_000;
const patternOnly = process.argv.includes("--pattern-only");

interface Found {
  url: string;
  where: string[];
  confidence: PlanLink["confidence"];
}

const found = new Map<string, Found>();

function add(url: string, where: string, confidence: PlanLink["confidence"]) {
  const entry = found.get(url);
  if (!entry) {
    found.set(url, { url, where: [where], confidence });
    return;
  }
  if (entry.where.length < 3) entry.where.push(where);
  if (confidence === "pattern") entry.confidence = "pattern";
}

for (const week of plan.weeks)
  for (const day of week.days)
    for (const s of day.sessions) for (const l of s.links ?? []) add(l.url, s.id, l.confidence);
for (const item of plan.items) for (const l of item.links) add(l.url, item.id, l.confidence);
for (const r of plan.resources) add(r.url, `resource:${r.name}`, "pattern");
for (const d of plan.maintenanceWeek.days)
  for (const s of d.sessions) for (const l of s.links ?? []) add(l.url, "maintenanceWeek", l.confidence);

// Поиск YouTube не проверить запросом: всегда отдаёт 200.
const isSearchLink = (url: string) => /(^|\.)youtube\.com\/results/.test(url.replace(/^https?:\/\//, ""));

type Verdict =
  | { kind: "ok"; status: number }
  | { kind: "broken"; status: number | string }
  | { kind: "blocked"; status: number | string };

async function request(url: string, method: "HEAD" | "GET"): Promise<Response> {
  return fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; prep-app-link-check)",
      accept: "text/html,*/*",
    },
  });
}

// leetcode.com закрыт от ботов (403), но публичный GraphQL отвечает: задача есть или `null`.
async function checkLeetCode(slug: string): Promise<Verdict> {
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 (compatible; prep-app-link-check)" },
      body: JSON.stringify({
        query: "query($s:String!){question(titleSlug:$s){title}}",
        variables: { s: slug },
      }),
    });
    if (!res.ok) return { kind: "blocked", status: res.status };
    const body = (await res.json()) as { data?: { question: { title: string } | null } };
    if (!body.data) return { kind: "blocked", status: "нет data" };
    return body.data.question ? { kind: "ok", status: 200 } : { kind: "broken", status: "задачи нет на LeetCode" };
  } catch (e) {
    return { kind: "blocked", status: e instanceof Error ? e.message : String(e) };
  }
}

async function check(url: string): Promise<Verdict> {
  const leet = /^https:\/\/leetcode\.com\/problems\/([^/?#]+)/.exec(url);
  if (leet) return checkLeetCode(leet[1]);

  let res: Response | undefined;
  let error: string | undefined;
  for (const method of ["HEAD", "GET"] as const) {
    try {
      res = await request(url, method);
      error = undefined;
      // Многие серверы не умеют HEAD: повторяем GET.
      if (res.status < 400) break;
    } catch (e) {
      error = e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e);
    }
  }
  if (!res) return { kind: "broken", status: error ?? "нет ответа" };
  if (res.status >= 200 && res.status < 400) return { kind: "ok", status: res.status };
  // Защита от ботов: ответ не говорит о том, жива ли страница.
  if ([401, 403, 429, 999].includes(res.status) || res.headers.has("cf-mitigated")) {
    return { kind: "blocked", status: res.status };
  }
  return { kind: "broken", status: res.status };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const all = [...found.values()];
  const skipped = all.filter((f) => isSearchLink(f.url));
  const queue = all.filter((f) => !isSearchLink(f.url) && (!patternOnly || f.confidence === "pattern"));
  console.log(
    `Уникальных адресов: ${all.length}. Проверяю: ${queue.length}. Поиск YouTube пропущен: ${skipped.length}.\n`,
  );

  const broken: [Found, Verdict][] = [];
  const blocked: [Found, Verdict][] = [];
  let done = 0;

  async function worker() {
    for (let f = queue.shift(); f; f = queue.shift()) {
      const verdict = await check(f.url);
      if (verdict.kind === "broken") broken.push([f, verdict]);
      if (verdict.kind === "blocked") blocked.push([f, verdict]);
      done++;
      if (done % 25 === 0) console.log(`  проверено ${done}`);
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const print = (title: string, rows: [Found, Verdict][]) => {
    console.log(`\n${title}: ${rows.length}`);
    for (const [f, v] of rows) {
      console.log(`  [${v.kind === "ok" ? "ok" : v.status}] ${f.url}\n      ${f.confidence}; ${f.where.join(", ")}`);
    }
  };

  print("НЕ 2xx/3xx (исправить)", broken);
  print("Блокируют автоматические запросы (проверить вручную)", blocked);
  console.log(`\nПоиск YouTube (не проверяется): ${skipped.length}`);

  process.exit(broken.length > 0 ? 1 : 0);
}

main();
