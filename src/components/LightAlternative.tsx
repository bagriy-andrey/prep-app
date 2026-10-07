import { subtleButton } from "./ui";

interface Props {
  text: string;
  /** Если задано, показывается кнопка «Отметить день лёгким». */
  onMarkLight?: () => void;
  markLightDisabled?: boolean;
}

export default function LightAlternative({ text, onMarkLight, markLightDisabled }: Props) {
  return (
    <aside className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <p>
        <strong className="font-semibold">Если устал.</strong> {text.replace(/^Устал:\s*/, "")}
      </p>
      {onMarkLight && (
        <button
          type="button"
          onClick={onMarkLight}
          disabled={markLightDisabled}
          className={`${subtleButton} mt-2 border-amber-400 bg-white/60 dark:border-amber-700 dark:bg-transparent`}
        >
          Отметить день лёгким
        </button>
      )}
    </aside>
  );
}
