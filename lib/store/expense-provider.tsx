"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  type ExpenseStore,
  createExpenseStore,
} from "@/lib/store/expense-store";

export const ExpenseStoreContext = createContext<StoreApi<ExpenseStore> | null>(
  null,
);

export interface ExpenseStoreProviderProps {
  count: number;
  children: ReactNode;
}

export const ExpenseStoreProvider = ({
  count,
  children,
}: ExpenseStoreProviderProps) => {
  const storeRef = useRef<StoreApi<ExpenseStore>>();
  if (!storeRef.current) {
    storeRef.current = createExpenseStore({ count });
  }

  return (
    <ExpenseStoreContext.Provider value={storeRef.current}>
      {children}
    </ExpenseStoreContext.Provider>
  );
};

export const useExpenseStore = <T,>(
  selector: (store: ExpenseStore) => T,
): T => {
  const expenseStoreContext = useContext(ExpenseStoreContext);

  if (!expenseStoreContext) {
    throw new Error(`useExpenseStore must be use within ExpenseStoreProvider`);
  }

  return useStore(expenseStoreContext, selector);
};
