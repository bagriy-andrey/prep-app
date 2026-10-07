// Экспорт расписания в .ics: одно событие на день с суммой минут и списком сессий.

import type { Plan } from "../data/types";
import { formatMinutes } from "../lib/format";
import { addDays } from "./dates";
import { dayDate } from "./schedule";

const compact = (date: string) => date.replaceAll("-", "");

function escapeText(text: string): string {
  return text.replaceAll("\\", "\\\\").replaceAll(";", "\;").replaceAll(",", "\\,").replace(/\r?\n/g, "\\n");
}

/** Складывает строку по 75 байт (UTF-8), не разрывая символ. Продолжение начинается с пробела. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // у продолжений один байт занимает пробел
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function stamp(now: Date): string {
  const p = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${p(now.getUTCFullYear(), 4)}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}T${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}Z`;
}

export function buildIcs(plan: Plan, startDate: string, now: Date = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//prep-app//plan//RU",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(plan.meta.title)}`,
  ];

  for (const week of plan.weeks) {
    for (const day of week.days) {
      const sessions = day.sessions.filter((s) => s.block !== "rest");
      const minutes = sessions.filter((s) => !s.optional).reduce((sum, s) => sum + s.minutes, 0);
      if (minutes === 0) continue;

      const date = dayDate(startDate, week.n, day.offset);
      const description = [
        `Неделя ${week.n}: ${week.title}`,
        ...sessions.map(
          (s) =>
            `${plan.blocks[s.block] ?? s.block}, ${formatMinutes(s.minutes)}${s.optional ? " (необязательно)" : ""}: ${s.title}`,
        ),
      ].join("\n");

      lines.push(
        "BEGIN:VEVENT",
        `UID:prep-w${String(week.n).padStart(2, "0")}-d${day.dow}@prep-app`,
        `DTSTAMP:${stamp(now)}`,
        `DTSTART;VALUE=DATE:${compact(date)}`,
        `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
        `SUMMARY:${escapeText(`Подготовка к интервью: ${formatMinutes(minutes)}`)}`,
        `DESCRIPTION:${escapeText(description)}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
