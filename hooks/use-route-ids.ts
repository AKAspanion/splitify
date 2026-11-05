"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export type RouteIds = {
  groupId: string | null;
  expenseId: string | null;
  friendId: string | null;
  activityId: string | null;
};

const UUID =
  /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const USER_ID = /^[A-Za-z0-9_-]{1,128}$/;
const GROUP_PAGES = new Set([
  "edit",
  "settle",
  "settings",
  "add-member",
  "activity",
  "expense",
]);

const NONE: RouteIds = {
  groupId: null,
  expenseId: null,
  friendId: null,
  activityId: null,
};

const uuid = (s: string | undefined): string | null =>
  s && UUID.test(s) ? s : null;
// "_" is the placeholder the static pages are built with: never a real id.
const userId = (s: string | undefined): string | null =>
  s && s !== "_" && USER_ID.test(s) ? s : null;

/** Reads the real ids from a pathname by the route's pattern. Anything that is not a valid id is `null`. */
export function routeIdsFromPath(pathname: string): RouteIds {
  const parts = pathname.split("/").filter((s) => s !== "");
  const [area, id, third, fourth] = parts;
  const rest = parts.length;

  if (area === "groups") {
    if (rest === 2) return { ...NONE, groupId: uuid(id) };
    if (rest === 3 && GROUP_PAGES.has(third))
      return { ...NONE, groupId: uuid(id) };
    if (rest === 4 && third === "expense")
      return { ...NONE, groupId: uuid(id), expenseId: uuid(fourth) };
  } else if (area === "expense") {
    if (rest === 3 && third === "edit") return { ...NONE, expenseId: uuid(id) };
  } else if (area === "friends") {
    if (rest === 2) return { ...NONE, friendId: userId(id) };
    if (rest === 4 && third === "edit" && fourth === "contact")
      return { ...NONE, friendId: userId(id) };
  } else if (area === "activity") {
    if (rest === 2) return { ...NONE, activityId: uuid(id) };
  }
  return NONE;
}

export function useRouteIds(): RouteIds {
  const pathname = usePathname();
  return useMemo(() => routeIdsFromPath(pathname ?? ""), [pathname]);
}
