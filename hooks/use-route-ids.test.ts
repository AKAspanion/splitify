import { describe, expect, it } from "vitest";
import { routeIdsFromPath } from "./use-route-ids";

const G = "0123456789abcdef0123456789abcdef";
const E = "fedcba9876543210fedcba9876543210";
const A = "11112222333344445555666677778888";
const none = {
  groupId: null,
  expenseId: null,
  friendId: null,
  activityId: null,
};

describe("routeIdsFromPath", () => {
  it("reads the group id", () => {
    expect(routeIdsFromPath(`/groups/${G}/`)).toEqual({ ...none, groupId: G });
    expect(routeIdsFromPath(`/groups/${G}`)).toEqual({ ...none, groupId: G });
  });

  it("reads the group id on each group sub-page", () => {
    for (const sub of [
      "edit",
      "settle",
      "settings",
      "add-member",
      "activity",
      "expense",
    ]) {
      expect(routeIdsFromPath(`/groups/${G}/${sub}/`)).toEqual({
        ...none,
        groupId: G,
      });
    }
  });

  it("reads both ids on a group's expense", () => {
    expect(routeIdsFromPath(`/groups/${G}/expense/${E}/`)).toEqual({
      ...none,
      groupId: G,
      expenseId: E,
    });
  });

  it("accepts a dashed UUID", () => {
    const dashed = "01234567-89ab-cdef-0123-456789abcdef";
    expect(routeIdsFromPath(`/groups/${dashed}/`).groupId).toBe(dashed);
  });

  it("reads the expense id on /expense/[id]/edit", () => {
    expect(routeIdsFromPath(`/expense/${E}/edit/`)).toEqual({
      ...none,
      expenseId: E,
    });
  });

  it("gives null for the placeholder, a bad id and a traversal", () => {
    expect(routeIdsFromPath("/groups/_/")).toEqual(none);
    expect(routeIdsFromPath("/groups/not-an-id/")).toEqual(none);
    expect(routeIdsFromPath("/groups/../x")).toEqual(none);
    expect(routeIdsFromPath(`/groups/${G}x/`).groupId).toBeNull();
    expect(routeIdsFromPath(`/groups/_/expense/${E}/`)).toEqual({
      ...none,
      expenseId: E,
    });
    expect(routeIdsFromPath(`/groups/${G}/expense/_/`)).toEqual({
      ...none,
      groupId: G,
    });
  });

  it("reads a friend's user id, at most 128 characters", () => {
    expect(routeIdsFromPath("/friends/spuser_abc/")).toEqual({
      ...none,
      friendId: "spuser_abc",
    });
    expect(routeIdsFromPath("/friends/spuser_abc/edit/contact/").friendId).toBe(
      "spuser_abc",
    );
    expect(routeIdsFromPath(`/friends/${"a".repeat(128)}/`).friendId).toBe(
      "a".repeat(128),
    );
    expect(
      routeIdsFromPath(`/friends/${"a".repeat(129)}/`).friendId,
    ).toBeNull();
    expect(routeIdsFromPath("/friends/_/").friendId).toBeNull();
    expect(routeIdsFromPath("/friends/a%2Fb/").friendId).toBeNull();
  });

  it("reads the activity id", () => {
    expect(routeIdsFromPath(`/activity/${A}/`)).toEqual({
      ...none,
      activityId: A,
    });
    expect(routeIdsFromPath("/activity/").activityId).toBeNull();
  });

  it("gives null for routes without an id and for extra segments", () => {
    expect(routeIdsFromPath("/groups/")).toEqual(none);
    expect(routeIdsFromPath("/profile/")).toEqual(none);
    expect(routeIdsFromPath(`/groups/${G}/edit/extra/`)).toEqual(none);
  });
});
