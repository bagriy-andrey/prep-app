import raw from "./plan.json";
import type { Item, Plan, Week } from "./types";

export const plan = raw as unknown as Plan;

export const itemsById: ReadonlyMap<string, Item> = new Map(
  plan.items.map((item) => [item.id, item]),
);

export const weeksByNumber: ReadonlyMap<number, Week> = new Map(
  plan.weeks.map((week) => [week.n, week]),
);
