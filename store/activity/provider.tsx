"use client";

import { type ReactNode, createContext, useState, useContext } from "react";
import { type StoreApi, useStore } from "zustand";

import { type ActivityStore, createActivityStore } from "@/store/activity";

export const ActivityStoreContext =
  createContext<StoreApi<ActivityStore> | null>(null);

export interface ActivityStoreProviderProps {
  children: ReactNode;
}

export const ActivityStoreProvider = ({
  children,
}: ActivityStoreProviderProps) => {
  const [store] = useState(() => createActivityStore());

  return (
    <ActivityStoreContext.Provider value={store}>
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
