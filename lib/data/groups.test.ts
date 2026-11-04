import { describe, expect, it } from "vitest";
import { invalidatedByGroupWrite } from "./groups";

const GROUP = "0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b";

describe("invalidatedByGroupWrite", () => {
  it("makes CreateGroup refresh the group list only", () => {
    expect(invalidatedByGroupWrite("CreateGroup", GROUP)).toEqual([
      ["ListMyGroups"],
    ]);
  });

  it("makes UpdateGroup refresh the list and that group", () => {
    expect(invalidatedByGroupWrite("UpdateGroup", GROUP)).toEqual([
      ["ListMyGroups"],
      ["GetGroup", { id: GROUP }],
    ]);
  });

  it("makes DeleteGroup refresh the list and every key of that group", () => {
    expect(invalidatedByGroupWrite("DeleteGroup", GROUP)).toEqual([
      ["ListMyGroups"],
      ["GetGroup", { id: GROUP }],
      ["ListGroupMembers", { groupId: GROUP }],
      ["GetGroupLedger", { groupId: GROUP }],
      ["ListGroupExpenses", { groupId: GROUP }],
    ]);
  });

  it("makes AddGroupMember refresh the members and that group", () => {
    expect(invalidatedByGroupWrite("AddGroupMember", GROUP)).toEqual([
      ["ListGroupMembers", { groupId: GROUP }],
      ["GetGroup", { id: GROUP }],
    ]);
  });

  it("scopes the keys to the group it was given", () => {
    const other = "1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c";
    const keys = invalidatedByGroupWrite("DeleteGroup", other);
    expect(JSON.stringify(keys)).not.toContain(GROUP);
    expect(JSON.stringify(keys)).toContain(other);
  });
});
