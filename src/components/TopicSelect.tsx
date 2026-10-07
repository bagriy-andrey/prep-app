import { TOPICS, type TopicKey } from "../domain/topics";

export default function TopicSelect({
  value,
  onChange,
  label,
}: {
  value: TopicKey;
  onChange: (topic: TopicKey) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as TopicKey)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
    >
      {TOPICS.map((t) => (
        <option key={t.key} value={t.key}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
