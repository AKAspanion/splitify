"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  type ActivityStore,
  createActivityStore,
} from "@/lib/store/activity-store";

export const ActivityStoreContext =
  createContext<StoreApi<ActivityStore> | null>(null);

export interface ActivityStoreProviderProps {
  children: ReactNode;
}

export const ActivityStoreProvider = ({
  children,
}: ActivityStoreProviderProps) => {
  const storeRef = useRef<StoreApi<ActivityStore>>();
  if (!storeRef.current) {
    storeRef.current = createActivityStore();
  }

  return (
    <ActivityStoreContext.Provider value={storeRef.current}>
      {children}
    </ActivityStoreContext.Provider>
  );
};

export const useActivityStore = <T,>(
  selector: (store: ActivityStore) => T,
): T => {
  const activityStoreContext = useContext(ActivityStoreContext);

  if (!activityStoreContext) {
    throw new Error(
      `useActivityStore must be use within ActivityStoreProvider`,
    );
  }

  return useStore(activityStoreContext, selector);
};
