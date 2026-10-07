import { parseDate } from "../domain/dates";

const DAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const dayName = (dow: number) => DAY_NAMES[dow - 1];
export const dayShort = (dow: number) => DAY_SHORT[dow - 1];

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
export const formatDateRu = (date: string) => dateFormat.format(parseDate(date));

/** Склонение: plural(1, ["день","дня","дней"]) → "день". */
export function plural(n: number, forms: [string, string, string]): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}

export const TIER_LABEL = {
  small: "Малый приз",
  big: "Крупный приз",
  final: "Финальный приз",
} as const;
