// Темы статистики времени: каждая объединяет блоки плана.

export type TopicKey =
  | "algorithms"
  | "js"
  | "ui"
  | "system-design"
  | "web"
  | "behavioral"
  | "mock"
  | "review"
  | "other";

/** Темы статистики: каждая объединяет блоки плана. */
export const TOPICS: { key: TopicKey; label: string; blocks: string[] }[] = [
  { key: "algorithms", label: "Алгоритмы", blocks: ["dsa", "warmup"] },
  { key: "js", label: "JS-кодинг", blocks: ["js"] },
  { key: "ui", label: "UI-компоненты", blocks: ["ui"] },
  { key: "system-design", label: "System design", blocks: ["fe-sd", "be-sd", "sd-review", "sd-theory"] },
  { key: "web", label: "Веб-основы и теория", blocks: ["web", "theory"] },
  { key: "behavioral", label: "Behavioral", blocks: ["behavioral"] },
  { key: "mock", label: "Моки и симуляции", blocks: ["mock", "simulation"] },
  { key: "review", label: "Повторения", blocks: ["review"] },
  { key: "other", label: "Прочее", blocks: ["checkpoint", "week-review", "spare"] },
];

export function topicOfBlock(block: string): TopicKey {
  return TOPICS.find((t) => t.blocks.includes(block))?.key ?? "other";
}
