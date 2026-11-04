"use client";

import { type ReactNode, createContext, useState, useContext } from "react";
import { type StoreApi, useStore } from "zustand";

import { type ExpenseStore, createExpenseStore } from "@/store/expense";

export const ExpenseStoreContext = createContext<StoreApi<ExpenseStore> | null>(
  null,
);

export interface ExpenseStoreProviderProps {
  children: ReactNode;
}

export const ExpenseStoreProvider = ({
  children,
}: ExpenseStoreProviderProps) => {
  const [store] = useState(() => createExpenseStore());

  return (
    <ExpenseStoreContext.Provider value={store}>
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
