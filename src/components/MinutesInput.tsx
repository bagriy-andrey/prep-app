import { useId } from "react";
import { MAX_MINUTES } from "../domain/userState";

interface Props {
  /** Подпись для скринридера и видимая короткая подпись «Минут». */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Поле «потрачено минут». Значение хранится строкой: пустое поле значит «не указано». */
export default function MinutesInput({ label, value, onChange, placeholder }: Props) {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-1.5 text-sm">
      <label htmlFor={id} className="text-slate-600 dark:text-slate-400">
        <span className="sr-only">{label}. </span>
        <span aria-hidden="true">Минут</span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_MINUTES}
        step={5}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 tabular-nums dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  );
}
