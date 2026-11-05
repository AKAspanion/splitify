import { describe, expect, it } from "vitest";
import type { User } from "@/types/shared";
import { equalSplitFor, withEqualSplitEdit } from "./form";

const user = (id: string, name = id) => ({ id, name }) as User;

const groupA = [user("a"), user("b"), user("c")];
const groupB = [user("a"), user("d")];
const keyOf = (users: User[]) => JSON.stringify(users);

describe("the expense form's equal split", () => {
  it("ticks every user while nothing has been edited", () => {
    expect(equalSplitFor(groupA, keyOf(groupA), null)).toEqual({
      a: true,
      b: true,
      c: true,
    });
  });

  it("keeps an edit while the users stay the same", () => {
    const edits = withEqualSplitEdit(groupA, keyOf(groupA), null, {
      b: false,
    });

    expect(equalSplitFor(groupA, keyOf(groupA), edits)).toEqual({
      a: true,
      b: false,
      c: true,
    });
    // The same users in a new array, as a refetch returns them, are the same users.
    const refetched = groupA.map((u) => ({ ...u }));
    expect(equalSplitFor(refetched, keyOf(refetched), edits)).toEqual({
      a: true,
      b: false,
      c: true,
    });
  });

  it("adds each edit to the ones before it", () => {
    const first = withEqualSplitEdit(groupA, keyOf(groupA), null, {
      b: false,
    });
    const second = withEqualSplitEdit(groupA, keyOf(groupA), first, {
      c: false,
    });

    expect(equalSplitFor(groupA, keyOf(groupA), second)).toEqual({
      a: true,
      b: false,
      c: false,
    });
  });

  it("resets to the new users, every one ticked, when the users change", () => {
    const edits = withEqualSplitEdit(groupA, keyOf(groupA), null, {
      a: false,
      b: false,
    });

    expect(equalSplitFor(groupB, keyOf(groupB), edits)).toEqual({
      a: true,
      d: true,
    });
  });

  it("resets when a user's details change, as the users list itself changed", () => {
    const edits = withEqualSplitEdit(groupA, keyOf(groupA), null, {
      b: false,
    });
    const renamed = [user("a"), user("b", "Bea"), user("c")];

    expect(equalSplitFor(renamed, keyOf(renamed), edits)).toEqual({
      a: true,
      b: true,
      c: true,
    });
  });

  it("starts an edit after a change of users from the new users, not the old edits", () => {
    const old = withEqualSplitEdit(groupA, keyOf(groupA), null, { a: false });
    const edits = withEqualSplitEdit(groupB, keyOf(groupB), old, { d: false });

    expect(equalSplitFor(groupB, keyOf(groupB), edits)).toEqual({
      a: true,
      d: false,
    });
  });
});
