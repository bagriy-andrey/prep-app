import { useMemo } from "react";
import { plan } from "../data/plan";
import { timeEntries, type TimeEntry } from "../domain/time";
import { useUserState } from "../state/UserStateProvider";

export function useTimeEntries(): TimeEntry[] {
  const { state } = useUserState();
  return useMemo(() => timeEntries(plan, state), [state]);
}
