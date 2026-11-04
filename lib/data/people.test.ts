import { beforeEach, describe, expect, it, vi } from "vitest";

const addFriend = vi.fn();
vi.mock("@dataconnect/app", () => ({
  addFriend: (...args: unknown[]) => addFriend(...args),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  getFriend: vi.fn(),
  listFriends: vi.fn(),
  listGroupMembers: vi.fn(),
  listMyGroups: vi.fn(),
  searchUserByEmail: vi.fn(),
}));
vi.mock("./client", () => ({
  dc: () => "dc-handle",
  queryKeys: {},
}));

import {
  addFriendRequest,
  addFriendVariables,
  contactId,
  normaliseEmail,
  validateContact,
} from "./people";

const GROUP = "0123456789abcdef0123456789abcdef";

describe("normaliseEmail", () => {
  it("trims and lower-cases", () => {
    expect(normaliseEmail("  Dev@Example.TEST ")).toBe("dev@example.test");
  });
});

describe("validateContact", () => {
  it("stores the trimmed name and the normalised email", () => {
    expect(
      validateContact({ name: "  Dev Friend ", email: " Dev@Example.TEST " }),
    ).toEqual({
      ok: true,
      value: { name: "Dev Friend", email: "dev@example.test" },
    });
  });

  it("reports each wrong field", () => {
    const result = validateContact({ name: "ab", email: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBe("Minimum 3 chars required");
      expect(result.errors.email).toBe("Please enter valid email");
    }
  });

  it("refuses an over-long name or email", () => {
    expect(validateContact({ name: "a".repeat(101), email: "a@b.co" }).ok).toBe(
      false,
    );
    expect(
      validateContact({ name: "abc", email: `${"a".repeat(250)}@b.co` }).ok,
    ).toBe(false);
  });
});

describe("contactId", () => {
  it("starts with spuser_ and differs per call", () => {
    const a = contactId();
    const b = contactId();
    expect(a.startsWith("spuser_")).toBe(true);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{1,128}$/);
  });
});

describe("useAddFriend's request", () => {
  beforeEach(() => addFriend.mockReset().mockResolvedValue({}));

  it("sends withGroup: false and no group without a group", () => {
    const vars = addFriendVariables({ friendId: "u1" });
    expect(vars.withGroup).toBe(false);
    expect(vars.groupId ?? null).toBeNull();
    expect(vars.friendId).toBe("u1");
    expect(vars.activityId).toMatch(/^[0-9a-f-]{36}$/);
    expect(
      addFriendVariables({ friendId: "u1", groupId: null }).withGroup,
    ).toBe(false);
  });

  it("sends withGroup: true and the group id with a group", () => {
    const vars = addFriendVariables({ friendId: "u1", groupId: GROUP });
    expect(vars.withGroup).toBe(true);
    expect(vars.groupId).toBe(GROUP);
  });

  it("calls the SQL Connect mutation with those variables", async () => {
    await addFriendRequest({ friendId: "u1", groupId: GROUP });
    expect(addFriend).toHaveBeenCalledTimes(1);
    const [handle, vars] = addFriend.mock.calls[0];
    expect(handle).toBe("dc-handle");
    expect(vars).toMatchObject({
      friendId: "u1",
      groupId: GROUP,
      withGroup: true,
    });
  });
});
