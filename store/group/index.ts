import type { ExpenseWithUser, Group, User } from "@/types/shared";
import { createStore } from "zustand/vanilla";
// import { persist, createJSONStorage } from "zustand/middleware";

export type GroupState = {
  expenses: Record<string, ExpenseWithUser>;
  expenseLoading: Record<string, boolean>;
  groups: Record<string, Group>;
  groupLoading: Record<string, boolean>;
  groupUsers: Record<string, User[]>;
  groupUsersLoading: Record<string, boolean>;
};

export type GroupActions = {
  setGroupLoading: (groupId: string, val: boolean) => void;
  setGroupUsersLoading: (groupId: string, val: boolean) => void;
};

export type GroupStore = GroupState & GroupActions;

export const defaultInitState: GroupState = {
  groups: {},
  groupLoading: {},
  expenses: {},
  expenseLoading: {},
  groupUsers: {},
  groupUsersLoading: {},
};

export const createGroupStore = (
  propState: Partial<GroupState> = defaultInitState,
) => {
  const initState = { ...defaultInitState, ...propState };
  return createStore<GroupStore>()(
    // persist(
    (set, get) => ({
      ...initState,
      setGroupUsersLoading: (gid, load) =>
        set((state) => ({
          groupUsersLoading: {
            ...(state?.groupUsersLoading || {}),
            [gid]: load,
          },
        })),
      setGroupLoading: (gid, load) =>
        set((state) => ({
          groupLoading: {
            ...(state?.groupLoading || {}),
            [gid]: load,
          },
        })),
    }),
    //   {
    //     name: "group-storage",
    //     storage: createJSONStorage(() => sessionStorage),
    //   },
    // ),
  );
};
