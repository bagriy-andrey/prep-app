import { courseProgress } from "../domain/progress";
import { useUserState } from "../state/UserStateProvider";
import { HeaderBar } from "./HeaderBar";

/** Общий прогресс курса: виден на всех экранах. Оформление общее с индикаторами недели. */
export default function CourseProgress() {
  const { state, plan } = useUserState();
  const p = courseProgress(plan, state);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400">Курс</span>
      <HeaderBar
        label="Прогресс курса"
        detail={`Завершено ${p.closedWeeks} из ${p.weeks} нед.; сделано ${p.done} из ${p.total} сессий`}
        fill={p.percent}
        text={`${p.percent}%`}
        done={p.percent === 100}
        widthClass="w-full"
      />
    </div>
  );
}
