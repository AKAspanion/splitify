import { createStore } from "zustand/vanilla";
import type { Activity } from "@/types/shared";

export type ActivityState = {
  activities: Activity[];
  pageLoading: boolean;
  page: number;
  count: number | undefined;
};

export type ActivityActions = {
  clearActivities: () => void;
};

export type ActivityStore = ActivityState & ActivityActions;

export const defaultInitState: ActivityState = {
  activities: [],
  pageLoading: false,
  page: 0,
  count: Infinity,
};

export const createActivityStore = (
  propState: Partial<ActivityState> = defaultInitState,
) => {
  const initState = { ...defaultInitState, ...propState };
  return createStore<ActivityStore>()((set) => ({
    ...initState,
    clearActivities: () => set(() => ({ activities: [] })),
  }));
};
