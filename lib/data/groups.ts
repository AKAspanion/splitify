"use client";

// Everything the group screens read and write, over SQL Connect connector `app` (dataconnect/app/groups.gql and
// expenses.gql). A screen never calls the SDK itself: it uses these hooks, so a write's cache refresh lives in one
// place (`invalidatedByGroupWrite`).
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroup,
  getGroupLedger,
  listGroupExpenses,
  listFriends,
  listGroupMembers,
  listMyGroups,
  updateGroup,
  type GetGroupData,
  type ListGroupExpensesData,
  type ListGroupMembersData,
  type ListMyGroupsData,
} from "@dataconnect/app";
import type { Group, User } from "@/types/shared";
import type { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { dc, FRESH, queryKeys } from "./client";
import { escapeSearch } from "./search";
import { toLedgerExpenses } from "./ledger";

/** How many of a group's expenses one page of `useGroupExpenses` holds. */
export const EXPENSES_PAGE_SIZE = 10;

export type GroupSummary = ListMyGroupsData["groups"][number];
export type GroupDetail = GetGroupData["groups"][number];
export type Member = ListGroupMembersData["groupMembers"][number]["user"];
export type GroupExpense = ListGroupExpensesData["expenses"][number];
export type ExpensePage = {
  expenses: GroupExpense[];
  /** Every expense matching the search, not only this page's. */
  total: number;
  offset: number;
};

type GroupWrite =
  "CreateGroup" | "UpdateGroup" | "DeleteGroup" | "AddGroupMember";

/** The query keys a write makes stale. A key holding variables matches every query that has those variables. */
export function invalidatedByGroupWrite(
  op: GroupWrite,
  groupId: string,
): readonly unknown[][] {
  const list = [...queryKeys.ListMyGroups()];
  const group = [...queryKeys.GetGroup({ id: groupId })];
  const members = [...queryKeys.ListGroupMembers({ groupId })];
  switch (op) {
    case "CreateGroup":
      return [list];
    case "UpdateGroup":
      return [list, group];
    case "DeleteGroup":
      return [
        list,
        group,
        members,
        [...queryKeys.GetGroupLedger({ groupId })],
        [...queryKeys.ListGroupExpenses({ groupId })],
      ];
    case "AddGroupMember":
      return [members, group];
  }
}

// What the existing screens' components read, so they keep their props: the SQL Connect rows in the shape of the
// Prisma models they were written for.
export function toGroupModel(group: GroupSummary | GroupDetail): Group {
  return {
    id: group.id,
    title: group.title,
    currency: group.currency,
    description: group.description ?? null,
    image_url: group.imageUrl ?? null,
    type: group.type ?? null,
    mute: group.mute,
    createdAt: new Date(group.createdAt),
    updatedAt: null,
  };
}

export const AVATAR_FALLBACK = "/images/placeholder/avatar.jpeg";

export function toUserModel(member: Member): User {
  return {
    uid: member.id,
    id: member.id,
    email: member.email,
    name: member.name ?? null,
    firstName: null,
    lastName: null,
    image_url: null,
    profile_image_url: member.imageUrl ?? AVATAR_FALLBACK,
    fromClerk: member.signedUp,
    createdAt: new Date(0),
    updatedAt: null,
  };
}

const selectFirstGroup = (data: GetGroupData): GroupDetail | null =>
  data.groups[0] ?? null;

const selectMembers = (data: ListGroupMembersData): Member[] =>
  data.groupMembers.map((m) => m.user);

const selectLedger = (
  data: Awaited<ReturnType<typeof getGroupLedger>>["data"],
): ExpenseWithPaymentWithSplit[] => toLedgerExpenses(data.expenses);

/** The caller's groups, newest first. An empty `search` lists them all. */
export function useMyGroups(
  search: string,
  limit: number,
): UseQueryResult<GroupSummary[]> {
  const text = escapeSearch(search.trim());
  return useQuery({
    queryKey: queryKeys.ListMyGroups({ search: text, limit }),
    queryFn: async () => {
      const { data } = await listMyGroups(
        dc(),
        {
          search: text || undefined,
          limit,
        },
        FRESH,
      );
      return data.groups;
    },
  });
}

/** One group, or `null` when it doesn't exist or the caller isn't a member. */
export function useGroup(
  groupId: string | null,
): UseQueryResult<GroupDetail | null> {
  return useQuery({
    queryKey: queryKeys.GetGroup({ id: groupId }),
    enabled: groupId !== null,
    queryFn: async () => {
      const { data } = await getGroup(dc(), { id: groupId as string }, FRESH);
      return selectFirstGroup(data);
    },
  });
}

export function useGroupMembers(
  groupId: string | null,
): UseQueryResult<Member[]> {
  return useQuery({
    queryKey: queryKeys.ListGroupMembers({ groupId }),
    enabled: groupId !== null,
    queryFn: async () => {
      const { data } = await listGroupMembers(
        dc(),
        {
          groupId: groupId as string,
        },
        FRESH,
      );
      return selectMembers(data);
    },
  });
}

/**
 * The caller's friends, for choosing who to add to a group. Its key carries `for`, so it never shares a cache entry
 * with another screen's friends list, but a write that refreshes every `ListFriends` still refreshes it.
 */
export function useFriendsToAdd(): UseQueryResult<Member[]> {
  return useQuery({
    queryKey: queryKeys.ListFriends({ for: "add-member", limit: 500 }),
    queryFn: async () => {
      const { data } = await listFriends(dc(), { limit: 500 }, FRESH);
      return data.friendships.map((f) => f.friend);
    },
  });
}

/** Every expense of the group with who paid and who owes, in the shape the split engine reads. */
export function useGroupLedger(
  groupId: string | null,
): UseQueryResult<ExpenseWithPaymentWithSplit[]> {
  return useQuery({
    queryKey: queryKeys.GetGroupLedger({ groupId }),
    enabled: groupId !== null,
    queryFn: async () => {
      const result = await getGroupLedger(
        dc(),
        {
          groupId: groupId as string,
        },
        FRESH,
      );
      return selectLedger(result.data);
    },
  });
}

/** The group's expenses, newest first, `EXPENSES_PAGE_SIZE` at a time. */
export function useGroupExpenses(
  groupId: string | null,
  search: string,
): UseInfiniteQueryResult<InfiniteData<ExpensePage, number>> {
  const text = escapeSearch(search.trim());
  return useInfiniteQuery({
    queryKey: queryKeys.ListGroupExpenses({ groupId, search: text }),
    enabled: groupId !== null,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<ExpensePage> => {
      const { data } = await listGroupExpenses(
        dc(),
        {
          groupId: groupId as string,
          limit: EXPENSES_PAGE_SIZE,
          offset: pageParam,
          search: text || undefined,
        },
        FRESH,
      );
      return {
        expenses: data.expenses,
        total: data.total[0]?.count ?? 0,
        offset: pageParam,
      };
    },
    getNextPageParam: (last) => {
      const loaded = last.offset + last.expenses.length;
      return last.expenses.length > 0 && loaded < last.total
        ? loaded
        : undefined;
    },
  });
}

function useRefreshAfter(op: GroupWrite) {
  const queryClient = useQueryClient();
  return async (groupId: string) => {
    await Promise.all(
      invalidatedByGroupWrite(op, groupId).map((queryKey) =>
        queryClient.invalidateQueries({
          queryKey,
          // A deleted group's own screens are still mounted until the person is sent away: don't refetch them
          // into a "not found" flash, only mark them stale.
          refetchType:
            op === "DeleteGroup" && queryKey[0] !== "ListMyGroups"
              ? "none"
              : "active",
        }),
      ),
    );
  };
}

export function useCreateGroup(): UseMutationResult<
  { id: string },
  Error,
  { title: string; description?: string; type?: string }
> {
  const refresh = useRefreshAfter("CreateGroup");
  return useMutation({
    mutationFn: async ({ title, description, type }) => {
      // The caller makes every UUID, so a retry of the same write fails on its key and changes nothing.
      const id = crypto.randomUUID();
      await createGroup(dc(), {
        id,
        title,
        description: description || null,
        type: type ?? null,
        activityId: crypto.randomUUID(),
      });
      return { id };
    },
    onSuccess: ({ id }) => refresh(id),
  });
}

export function useUpdateGroup(): UseMutationResult<
  void,
  Error,
  { id: string; title: string; description?: string; type?: string }
> {
  const refresh = useRefreshAfter("UpdateGroup");
  return useMutation({
    mutationFn: async ({ id, title, description, type }) => {
      await updateGroup(dc(), {
        id,
        title,
        description: description || null,
        type: type ?? null,
        activityId: crypto.randomUUID(),
      });
    },
    onSuccess: (_data, { id }) => refresh(id),
  });
}

export function useDeleteGroup(): UseMutationResult<
  void,
  Error,
  { id: string }
> {
  const refresh = useRefreshAfter("DeleteGroup");
  return useMutation({
    mutationFn: async ({ id }) => {
      await deleteGroup(dc(), { id });
    },
    onSuccess: (_data, { id }) => refresh(id),
  });
}

export function useAddGroupMember(): UseMutationResult<
  void,
  Error,
  { groupId: string; userId: string }
> {
  const refresh = useRefreshAfter("AddGroupMember");
  return useMutation({
    mutationFn: async ({ groupId, userId }) => {
      await addGroupMember(dc(), {
        groupId,
        userId,
        activityId: crypto.randomUUID(),
      });
    },
    onSuccess: (_data, { groupId }) => refresh(groupId),
  });
}
