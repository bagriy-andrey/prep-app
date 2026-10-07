import { OUTCOME_LABEL, type Outcome } from "../domain/userState";
import { chipButton, chipIdle } from "./ui";

const OUTCOMES: Outcome[] = ["clean", "hint", "failed"];

/** Три кнопки исхода попытки. */
export default function OutcomeButtons({
  onPick,
  label,
}: {
  onPick: (outcome: Outcome) => void;
  /** Подпись группы для скринридера. */
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {OUTCOMES.map((o) => (
        <button key={o} type="button" onClick={() => onPick(o)} className={`${chipButton} ${chipIdle}`}>
          {OUTCOME_LABEL[o]}
        </button>
      ))}
    </div>
  );
}
