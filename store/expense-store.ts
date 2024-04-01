import { Expense } from "@prisma/client";
import { createStore } from "zustand/vanilla";
// import { persist, createJSONStorage } from "zustand/middleware";
import { getExpenses } from "@/actions/get-expenses";

type ShareDataObj = { text: string; color: string };
export type ExpenseState = {
  expenses: Record<string, Expense[]>;
  pageLoading: Record<string, boolean>;
  page: Record<string, number>;
  count: Record<string, number | undefined>;
  whoPaid: Record<string, string>;
  whoPaidLoading: Record<string, boolean>;
  yourShare: Record<string, ShareDataObj>;
  yourShareLoading: Record<string, boolean>;
};

export type ExpenseActions = {
  addExpenses: (groupId: string) => void;
  clearExpenses: (groupId: string) => void;
  // setPage: (groupId: string, val: number) => void;
  setWhoPaid: (expenseId: string, val: string) => void;
  setWhoPaidLoading: (expenseId: string, val: boolean) => void;
  setYourShare: (expenseId: string, val: ShareDataObj) => void;
  setYourShareLoading: (expenseId: string, val: boolean) => void;
};

export type ExpenseStore = ExpenseState & ExpenseActions;

export const defaultInitState: ExpenseState = {
  expenses: {},
  pageLoading: {},
  page: {},
  count: {},
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
        const page = get().page?.[grp] || 0;
        const tCount = get().count?.[grp];
        const totalCount = tCount === undefined ? Infinity : tCount;
        const expensesCount = get().expenses?.[grp]?.length || 0;

        const canLoad = expensesCount < totalCount;
        if (!canLoad) {
          return;
        }
        set((state) => ({
          pageLoading: { ...(state?.pageLoading || {}), [grp]: true },
        }));

        const nextPage = page + 1;
        const { data, error } = await getExpenses(nextPage, grp);
        if (!error) {
          set((state) => ({
            page: { ...(state?.page || {}), [grp]: nextPage },
            count: { ...(state?.count || {}), [grp]: data?.count },
            expenses: {
              ...(state?.expenses || {}),
              [grp]: [
                ...(state?.expenses?.[grp] || []),
                ...(data?.expenses || []),
              ],
            },
          }));
        }
        set((state) => ({
          pageLoading: { ...(state?.pageLoading || {}), [grp]: false },
        }));
      },
      clearExpenses: (grp) =>
        set((state) => ({
          expenses: { ...(state?.expenses || {}), [grp]: [] },
        })),
      // setPage: (grp, v) =>
      //   set((state) => ({
      //     expenses: { ...(state?.page || {}), [grp]: v },
      //   })),
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
