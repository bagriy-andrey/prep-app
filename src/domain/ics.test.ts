import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { buildIcs } from "./ics";

const now = new Date(Date.UTC(2026, 9, 7, 12, 30, 0));
const ics = buildIcs(plan, plan.meta.startDate, now);
const events = ics.split("BEGIN:VEVENT").slice(1);
const unfolded = ics.replaceAll("\r\n ", "");

describe("buildIcs", () => {
  it("формирует корректный календарь с переводами строк CRLF", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(/[^\r]\n/.test(ics)).toBe(false);
  });

  it("одно событие на каждый день с учебными минутами", () => {
    const expected = plan.weeks
      .flatMap((w) => w.days)
      .filter((d) => d.sessions.some((s) => !s.optional && s.minutes > 0)).length;
    expect(events).toHaveLength(expected);
    expect(expected).toBe(96);
  });

  it("первое событие: дата, сумма минут и список сессий", () => {
    const first = events[0].replaceAll("\r\n ", "");
    expect(first).toContain("DTSTART;VALUE=DATE:20261012");
    expect(first).toContain("DTEND;VALUE=DATE:20261013");
    expect(first).toContain("SUMMARY:Подготовка к интервью: 1 ч 25 мин"); // 30 + 25 + 30
    expect(first).toContain("Contains Duplicate");
    expect(first).toContain("UID:prep-w01-d1@prep-app");
    expect(first).toContain("DTSTAMP:20261007T123000Z");
  });

  it("необязательные сессии в сумму не входят, но в списке отмечены", () => {
    const saturday = events.find((e) => e.includes("DTSTART;VALUE=DATE:20261017"))!.replaceAll("\r\n ", "");
    expect(saturday).toContain("SUMMARY:Подготовка к интервью: 3 ч"); // 45 + 60 + 45 + 30
    expect(saturday).toContain("(необязательно)");
  });

  it("выходные в календарь не попадают", () => {
    expect(unfolded).not.toContain("DTSTART;VALUE=DATE:20261016");
  });

  it("UID уникальны", () => {
    const uids = unfolded.match(/^UID:.*$/gm)!;
    expect(new Set(uids).size).toBe(uids.length);
  });

  it("запятые, точки с запятой и переводы строк экранированы", () => {
    const description = unfolded.match(/^DESCRIPTION:.*$/gm)![0];
    expect(description).toContain("\\n");
    expect(description).not.toMatch(/[^\\][,;]/); // нет неэкранированных , и ;
  });

  it("физические строки не длиннее 75 байт", () => {
    const encoder = new TextEncoder();
    for (const line of ics.split("\r\n")) expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
  });

  it("учитывает переопределённую дату старта", () => {
    const shifted = buildIcs(plan, "2026-10-19", now);
    expect(shifted).toContain("DTSTART;VALUE=DATE:20261019");
    expect(shifted).not.toContain("DTSTART;VALUE=DATE:20261012");
  });
});
