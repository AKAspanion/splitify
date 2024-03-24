import { Expense } from "@prisma/client";
import { createStore } from "zustand/vanilla";
// import { persist, createJSONStorage } from "zustand/middleware";
import { getExpenses } from "@/actions/get-expense";

type ShareDataObj = { text: string; color: string };
export type ExpenseState = {
  expenses: Record<string, Expense[]>;
  pageLoading: boolean;
  page: number;
  count: number;
  whoPaid: Record<string, string>;
  whoPaidLoading: Record<string, boolean>;
  yourShare: Record<string, ShareDataObj>;
  yourShareLoading: Record<string, boolean>;
};

export type ExpenseActions = {
  addExpenses: (groupId: string) => void;
  clearExpenses: (groupId: string) => void;
  setLoading: (val: boolean) => void;
  setPage: (val: number) => void;
  setWhoPaid: (expenseId: string, val: string) => void;
  setWhoPaidLoading: (expenseId: string, val: boolean) => void;
  setYourShare: (expenseId: string, val: ShareDataObj) => void;
  setYourShareLoading: (expenseId: string, val: boolean) => void;
};

export type ExpenseStore = ExpenseState & ExpenseActions;

export const defaultInitState: ExpenseState = {
  expenses: {},
  pageLoading: false,
  page: 0,
  count: 0,
  whoPaid: {},
  whoPaidLoading: {},
  yourShare: {},
  yourShareLoading: {},
};

export const createExpenseStore = (
  propState: Partial<ExpenseState> = defaultInitState,
) => {
  const initState = { ...defaultInitState, ...propState };
  return createStore<ExpenseStore>()(
    // persist(
    (set, get) => ({
      ...initState,
      addExpenses: async (grp) => {
        const page = get().page;
        const totalCount = get().count;
        const expensesCount = get().expenses?.[grp]?.length || 0;

        const canLoad = expensesCount < totalCount;
        if (!canLoad) {
          return;
        }
        set(() => ({ pageLoading: true }));

        const nextPage = page + 1;
        const { data: nextExpenses = [] } = await getExpenses(nextPage, grp);
        if (nextExpenses?.length) {
          set((state) => ({
            page: nextPage,
            pageLoading: false,
            expenses: {
              ...(state?.expenses || {}),
              [grp]: [...(state?.expenses?.[grp] || []), ...nextExpenses],
            },
          }));
        }
        set(() => ({ pageLoading: false }));
      },
      clearExpenses: (grp) =>
        set((state) => ({
          expenses: { ...(state?.expenses || {}), [grp]: [] },
        })),
      setLoading: (v) => set(() => ({ pageLoading: v })),
      setPage: (v) => set(() => ({ page: v })),
      setYourShare: (eid, share) =>
        set((state) => ({
          yourShare: { ...(state?.yourShare || {}), [eid]: share },
        })),
      setWhoPaid: (eid, who) =>
        set((state) => ({
          whoPaid: { ...(state?.whoPaid || {}), [eid]: who },
        })),
      setYourShareLoading: (eid, load) =>
        set((state) => ({
          yourShareLoading: {
            ...(state?.yourShareLoading || {}),
            [eid]: load,
          },
        })),
      setWhoPaidLoading: (eid, load) =>
        set((state) => ({
          whoPaidLoading: { ...(state?.whoPaidLoading || {}), [eid]: load },
        })),
    }),
    //   {
    //     name: "expense-storage",
    //     storage: createJSONStorage(() => sessionStorage),
    //   },
    // ),
  );
};
