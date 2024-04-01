"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { type StoreApi, useStore } from "zustand";

import { type GroupStore, createGroupStore } from "@/store/group";

export const GroupStoreContext = createContext<StoreApi<GroupStore> | null>(
  null,
);

export interface GroupStoreProviderProps {
  children: ReactNode;
}

export const GroupStoreProvider = ({ children }: GroupStoreProviderProps) => {
  const storeRef = useRef<StoreApi<GroupStore>>();
  if (!storeRef.current) {
    storeRef.current = createGroupStore({});
  }

  return (
    <GroupStoreContext.Provider value={storeRef.current}>
      {children}
    </GroupStoreContext.Provider>
  );
};

export const useGroupStore = <T,>(selector: (store: GroupStore) => T): T => {
  const groupStoreContext = useContext(GroupStoreContext);

  if (!groupStoreContext) {
    throw new Error(`useGroupStore must be use within GroupStoreProvider`);
  }

  return useStore(groupStoreContext, selector);
};
