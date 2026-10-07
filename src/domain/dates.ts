// Даты везде строки YYYY-MM-DD в локальном часовом поясе, без времени.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDate(value: string): Date {
  const match = DATE_RE.exec(value);
  if (!match) throw new Error(`Некорректная дата: ${value}`);
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    throw new Error(`Некорректная дата: ${value}`);
  }
  return date;
}

export function formatDate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/** Целое число дней от `from` до `to` (отрицательное, если `to` раньше). */
export function diffDays(from: string, to: string): number {
  const a = parseDate(from);
  const b = parseDate(to);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000);
}

/** День недели: 1 это понедельник, 7 это воскресенье. */
export function dayOfWeek(value: string): number {
  const day = parseDate(value).getDay();
  return day === 0 ? 7 : day;
}

export function isMonday(value: string): boolean {
  return dayOfWeek(value) === 1;
}

export function todayString(now: Date = new Date()): string {
  return formatDate(now);
}
