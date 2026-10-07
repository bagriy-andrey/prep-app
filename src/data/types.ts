export type Tier = "small" | "big" | "final";
export type Confidence = "checked" | "pattern";
export type ItemKind = "dsa" | "js" | "ui" | "fe-sd" | "be-sd";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface PlanLink {
  label: string;
  url: string;
  confidence: Confidence;
}

export interface Session {
  id: string;
  minutes: number;
  block: string;
  title: string;
  itemId?: string;
  links?: PlanLink[];
  optional?: boolean;
}

export interface Day {
  dow: number;
  offset: number;
  lightAlternative: string | null;
  sessions: Session[];
}

export interface Checkpoint {
  dsa: number;
  js: number;
  ui: number;
  sd: number;
  stories: number;
  mocks: number;
}

export interface Week {
  n: number;
  phase: string;
  title: string;
  webTopic: string;
  prize: { title: string; tier: Tier };
  checkpoint?: Checkpoint;
  days: Day[];
}

export interface Item {
  id: string;
  kind: ItemKind;
  title: string | null;
  week: number;
  difficulty: Difficulty | null;
  topic: string;
  links: PlanLink[];
  userNamed?: boolean;
  hint?: string;
}

export interface MaintenanceSession {
  minutes: number;
  block: string;
  title: string;
  links?: PlanLink[];
}

export interface MaintenanceDay {
  dow: number;
  sessions: MaintenanceSession[];
}

export interface MaintenanceWeek {
  title: string;
  days: MaintenanceDay[];
}

export interface ReviewRules {
  failed: number;
  hint: number;
  cleanFirst: number;
  cleanSecond: number;
  closeAfterCleanCount: number;
  oralIfLastClean: boolean;
}

export interface PlanRules {
  review: ReviewRules;
  weekClosed: string;
  bigPrizeWeeks: number[];
  bigPrizeRequires: string;
  prizeWaits: boolean;
}

export interface PlanMeta {
  title: string;
  version: number;
  startDate: string;
  weeksCount: number;
  hoursPerWeek: number;
  locale: string;
  linkConfidence: Record<Confidence, string>;
}

export interface MockTemplate {
  week: number;
  type: string;
}

export interface StoryTemplate {
  topic: string;
  week: number;
}

export interface ApplicationTemplate {
  company: string;
  role: string;
  applyWeek: number;
  interviewsExpected: string;
}

export interface Resource {
  track: string;
  name: string;
  role: string;
  url: string;
  primary: boolean;
}

export interface Plan {
  meta: PlanMeta;
  blocks: Record<string, string>;
  phases: Record<string, string>;
  rules: PlanRules;
  weeks: Week[];
  items: Item[];
  maintenanceWeek: MaintenanceWeek;
  mocks: MockTemplate[];
  stories: StoryTemplate[];
  applications: ApplicationTemplate[];
  resources: Resource[];
}
