import { getExpense } from "@/actions/get-expense";
import { getGroup } from "@/actions/get-group";
import { getGroupUsers } from "@/actions/get-group-users";
import { ExpenseWithUser } from "@/types/shared";
import { Group, User } from "@prisma/client";
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
  setGroup: (groupId: string) => void;
  setExpense: (expenseId: string, groupId: string) => void;
  setGroupLoading: (groupId: string, val: boolean) => void;
  setGroupUsers: (groupId: string) => void;
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
      setExpense: async (expenseId, grp) => {
        const expenseStore = get().expenses?.[expenseId];
        const expenseStoreLoading = get().expenseLoading?.[expenseId];

        if (expenseStore) {
          return;
        }

        if (expenseStoreLoading) {
          return;
        }

        set((state) => ({
          expenseLoading: { ...(state?.expenseLoading || {}), [grp]: true },
        }));

        const { data: expense } = await getExpense(expenseId, grp);
        if (expense) {
          set((state) => ({
            expenses: { ...(state?.expenses || {}), [expenseId]: expense },
          }));
        }
        set((state) => ({
          expenseLoading: { ...(state?.expenseLoading || {}), [grp]: false },
        }));
      },
      setGroupUsers: async (grp) => {
        const groupUsersStore = get().groupUsers?.[grp];
        const groupUsersStoreLoading = get().groupUsersLoading?.[grp];

        if (groupUsersStore) {
          return;
        }

        if (groupUsersStoreLoading) {
          return;
        }

        set((state) => ({
          groupUsersLoading: {
            ...(state?.groupUsersLoading || {}),
            [grp]: true,
          },
        }));

        const { data: users } = await getGroupUsers(grp);
        if (users?.length) {
          set((state) => ({
            groupUsers: { ...(state?.groupUsers || {}), [grp]: users },
          }));
        }
        set((state) => ({
          groupUsersLoading: {
            ...(state?.groupUsersLoading || {}),
            [grp]: false,
          },
        }));
      },
      setGroupUsersLoading: (gid, load) =>
        set((state) => ({
          groupUsersLoading: {
            ...(state?.groupUsersLoading || {}),
            [gid]: load,
          },
        })),
      setGroup: async (grp) => {
        const groupStore = get().groups?.[grp];
        const groupStoreLoading = get().groupLoading?.[grp];

        if (groupStore) {
          return;
        }

        if (groupStoreLoading) {
          return;
        }

        set((state) => ({
          groupLoading: { ...(state?.groupLoading || {}), [grp]: true },
        }));

        const { data: dataGroup } = await getGroup(grp);
        if (dataGroup) {
          set((state) => ({
            groups: {
              ...(state?.groups || {}),
              [grp]: dataGroup,
            },
          }));
        }
        set((state) => ({
          groupLoading: { ...(state?.groupLoading || {}), [grp]: false },
        }));
      },
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
