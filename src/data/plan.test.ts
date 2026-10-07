import { describe, expect, it } from "vitest";
import { itemsById, plan } from "./plan";
import { isMonday } from "../domain/dates";

const sessions = plan.weeks.flatMap((w) => w.days.flatMap((d) => d.sessions));

describe("целостность plan.json", () => {
  it("содержит заявленное число недель по семь дней", () => {
    expect(plan.weeks).toHaveLength(plan.meta.weeksCount);
    for (const week of plan.weeks) expect(week.days).toHaveLength(7);
  });

  it("стартует с понедельника", () => {
    expect(isMonday(plan.meta.startDate)).toBe(true);
  });

  it("id сессий и задач уникальны", () => {
    expect(new Set(sessions.map((s) => s.id)).size).toBe(sessions.length);
    expect(itemsById.size).toBe(plan.items.length);
  });

  it("все itemId указывают на существующие задачи той же недели", () => {
    for (const week of plan.weeks) {
      for (const session of week.days.flatMap((d) => d.sessions)) {
        if (!session.itemId) continue;
        const item = itemsById.get(session.itemId);
        expect(item, session.id).toBeDefined();
        expect(item?.week, session.id).toBe(week.n);
      }
    }
  });

  it("блоки и фазы описаны в словарях", () => {
    for (const s of sessions) expect(plan.blocks[s.block], s.id).toBeDefined();
    for (const w of plan.weeks) expect(plan.phases[w.phase], `неделя ${w.n}`).toBeDefined();
  });

  it("у задач без userNamed есть название", () => {
    for (const item of plan.items) {
      if (!item.userNamed) expect(item.title, item.id).toBeTruthy();
    }
  });

  it("крупные призы стоят в неделях bigPrizeWeeks", () => {
    for (const week of plan.weeks) {
      const isBigWeek = plan.rules.bigPrizeWeeks.includes(week.n);
      expect(week.prize.tier !== "small", `неделя ${week.n}`).toBe(isBigWeek);
    }
  });
});
