import { useId } from "react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Одна строка (input) вместо многострочного поля. */
  singleLine?: boolean;
  /** Тип поля для однострочного ввода, по умолчанию text. */
  type?: "text" | "date" | "number";
  placeholder?: string;
  /** Классы обёртки, например ширина в сетке карточки. */
  className?: string;
}

const field =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900";

/** Текстовое поле заметки: значение сохраняется при каждом изменении. */
export default function NoteField({ label, value, onChange, singleLine, type = "text", placeholder, className }: Props) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {singleLine || type !== "text" ? (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={field}
        />
      ) : (
        <textarea
          id={id}
          rows={4}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${field} resize-y`}
        />
      )}
    </div>
  );
}
