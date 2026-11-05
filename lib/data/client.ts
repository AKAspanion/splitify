import { getDataConnectClient } from "@/lib/firebase/app";
import type { DataConnect } from "firebase/data-connect";

/** The SQL Connect handle every browser read and write goes through. */
export function dc(): DataConnect {
  return getDataConnectClient();
}

/**
 * Options every generated query call passes. The SDK's default cache policy (PREFER_CACHE) answers a query it has
 * run before from its own copy and would hide a write made since; TanStack Query is the cache here.
 */
export const FRESH = { fetchPolicy: "SERVER_ONLY" } as const;

const key =
  (name: string) =>
  (variables?: unknown): readonly unknown[] =>
    variables === undefined ? [name] : [name, variables];

/**
 * One TanStack Query key per query operation in connector `app` (dataconnect/app/*.gql), keyed by operation
 * name: `queryKeys.ListMyGroups({ search, limit })` is `["ListMyGroups", { search, limit }]`.
 */
export const queryKeys: Record<
  string,
  (...args: unknown[]) => readonly unknown[]
> = {
  GetMe: key("GetMe"),
  GetExpense: key("GetExpense"),
  ListGroupExpenses: key("ListGroupExpenses"),
  GetGroupLedger: key("GetGroupLedger"),
  ListMyGroups: key("ListMyGroups"),
  GetGroup: key("GetGroup"),
  ListGroupMembers: key("ListGroupMembers"),
  ListMyActivity: key("ListMyActivity"),
  GetActivity: key("GetActivity"),
  SearchUserByEmail: key("SearchUserByEmail"),
  ListFriends: key("ListFriends"),
  GetFriend: key("GetFriend"),
};
