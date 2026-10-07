// Трекер задач и очередь повторений (разд. 5.3-5.4, 6.1).

import type { Item, ItemKind, Plan } from "../data/types";
import { diffDays } from "./dates";
import { reviewInfo, itemStatus, type ItemStatus, type ReviewMethod } from "./review";
import type { ItemState, UserState } from "./userState";

export const ITEM_KINDS: ItemKind[] = ["dsa", "js", "ui", "fe-sd", "be-sd"];

const EMPTY: ItemState = { attempts: [] };

export function itemState(state: UserState, itemId: string): ItemState {
  return state.items[itemId] ?? EMPTY;
}

/** Название задачи: из плана или то, что вписал пользователь; null для своей задачи без названия. */
export function itemTitle(item: Item, state: UserState): string | null {
  return item.title ?? state.items[item.id]?.title ?? null;
}

export interface KindCount {
  done: number;
  total: number;
}

/** Сделано из запланированного по типам. Сделана задача, у которой есть хотя бы одна попытка. */
export function kindCounts(plan: Plan, state: UserState): Record<ItemKind, KindCount> {
  const counts = Object.fromEntries(ITEM_KINDS.map((k) => [k, { done: 0, total: 0 }])) as Record<ItemKind, KindCount>;
  for (const item of plan.items) {
    counts[item.kind].total++;
    if (itemState(state, item.id).attempts.length > 0) counts[item.kind].done++;
  }
  return counts;
}

export interface TrackerFilters {
  kind?: ItemKind;
  week?: number;
  status?: ItemStatus;
}

export function filterItems(plan: Plan, state: UserState, filters: TrackerFilters, today: string): Item[] {
  return plan.items.filter((item) => {
    if (filters.kind && item.kind !== filters.kind) return false;
    if (filters.week && item.week !== filters.week) return false;
    if (filters.status) {
      const status = itemStatus(itemState(state, item.id).attempts, plan.rules.review, today);
      if (status !== filters.status) return false;
    }
    return true;
  });
}

export interface QueueEntry {
  item: Item;
  dueDate: string;
  method: ReviewMethod;
  /** На сколько дней повторение просрочено; 0, если срок сегодня. */
  overdueDays: number;
}

/** Очередь повторений на сегодня: сначала самые просроченные, при равенстве порядок плана. */
export function reviewQueue(plan: Plan, state: UserState, today: string): QueueEntry[] {
  const queue: QueueEntry[] = [];
  for (const item of plan.items) {
    const info = reviewInfo(itemState(state, item.id).attempts, plan.rules.review);
    if (!info || info.closed || info.dueDate > today) continue;
    queue.push({ item, dueDate: info.dueDate, method: info.method, overdueDays: diffDays(info.dueDate, today) });
  }
  return queue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
