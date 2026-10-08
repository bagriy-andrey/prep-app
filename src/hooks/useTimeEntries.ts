import { useMemo } from "react";
import { timeEntries, type TimeEntry } from "../domain/time";
import { useUserState } from "../state/UserStateProvider";

export function useTimeEntries(): TimeEntry[] {
  const { state, plan } = useUserState();
  return useMemo(() => timeEntries(plan, state), [plan, state]);
}
