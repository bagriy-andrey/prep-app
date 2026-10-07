import { useEffect, useState } from "react";
import { todayString } from "../domain/dates";

/** Сегодняшняя дата (локальная). Обновляется после полуночи и при возврате на вкладку. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayString());

  useEffect(() => {
    const refresh = () => setToday(todayString());
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return today;
}
