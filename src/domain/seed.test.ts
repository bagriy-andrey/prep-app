import { describe, expect, it } from "vitest";
import { plan } from "../data/plan";
import { createSeededState } from "./seed";
import { parseUserState } from "./userState";

describe("createSeededState", () => {
  const state = createSeededState(plan);

  it("заполняет журналы заготовками из плана", () => {
    expect(state.mocks).toHaveLength(plan.mocks.length);
    expect(state.mocks[0]).toEqual({ week: plan.mocks[0].week, type: plan.mocks[0].type });
    expect(state.stories).toHaveLength(plan.stories.length);
    expect(state.stories.every((s) => s.ready === false)).toBe(true);
    expect(state.applications).toHaveLength(plan.applications.length);
    expect(state.applications[0]).toMatchObject({ company: plan.applications[0].company, status: "Запланирована" });
  });

  it("не трогает прогресс и проходит проверку формата", () => {
    expect(state.items).toEqual({});
    expect(state.sessions).toEqual({});
    expect(parseUserState(JSON.parse(JSON.stringify(state)))).toEqual({ ...state, startDate: undefined });
  });
});
