import type { Plan } from "../data/types";
import { createInitialState, type UserState } from "./userState";

export function seedMocks(plan: Plan): UserState["mocks"] {
  return plan.mocks.map((m) => ({ week: m.week, type: m.type }));
}

export function seedStories(plan: Plan): UserState["stories"] {
  return plan.stories.map((s) => ({ topic: s.topic, ready: false }));
}

export function seedApplications(plan: Plan): UserState["applications"] {
  return plan.applications.map((a) => ({
    company: a.company,
    status: "Запланирована",
    notes: `Роль: ${a.role}. Подача: неделя ${a.applyWeek}. Собеседования ожидаются: ${a.interviewsExpected}.`,
  }));
}

/** Состояние первого запуска: журналы заполнены заготовками из плана. */
export function createSeededState(plan: Plan): UserState {
  return {
    ...createInitialState(),
    mocks: seedMocks(plan),
    stories: seedStories(plan),
    applications: seedApplications(plan),
  };
}
