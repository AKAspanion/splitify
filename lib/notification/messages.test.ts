import { describe, expect, it } from "vitest";
import type { Expense } from "@/generated/prisma/browser";
import {
  expenseCreated,
  expenseDeleted,
  expenseUpdated,
  groupCreated,
  groupDeleted,
  groupUpdated,
  memberAdded,
  settlementCreated,
} from "./messages";

// Expected strings are copied from the deleted routes in app/api/push-notification/*.
const group = { id: "g1", title: "Goa trip" };
const expense = {
  id: "e1",
  groupId: "g1",
  description: "Dinner",
  amount: 450,
  settlement: null,
  tag: "EXPENSE",
  group: { title: "Goa trip" },
} as unknown as Expense & { group: { title: string } };

describe("message builders", () => {
  it("groupCreated matches create-group", () => {
    expect(groupCreated("Asha", group)).toEqual({
      type: "GROUP_PLUS",
      heading: "Created group",
      content: "You created group Goa trip",
      message: "Asha created group Goa trip",
      url: "/groups/g1",
    });
  });

  it("groupUpdated matches update-group", () => {
    expect(groupUpdated("Asha", group)).toEqual({
      type: "GROUP_UPDATE",
      heading: "Updated group",
      content: "You updated group Goa trip",
      message: "Asha updated group Goa trip",
      url: "/groups/g1",
    });
  });

  it("groupDeleted matches delete-group", () => {
    expect(groupDeleted("Asha", "Goa trip")).toEqual({
      type: "GROUP_MINUS",
      heading: "Deleted group",
      content: "You deleted group Goa trip",
      message: "Asha deleted group Goa trip",
      url: "/groups",
    });
  });

  it("memberAdded matches update-group-member", () => {
    expect(memberAdded("Asha", "Ravi", group)).toEqual({
      type: "MEMBER_PLUS",
      heading: "Added to group",
      content: 'You have been added in group "Goa trip" by Asha',
      actorContent: 'You added Ravi in group "Goa trip"',
      message: 'Asha added Ravi in group "Goa trip"',
      url: "/groups/g1",
    });
  });

  it("expenseCreated matches create-expense", () => {
    expect(expenseCreated("Asha", expense)).toEqual({
      type: "EXPENSE_PLUS",
      heading: "Expense added",
      content: 'Asha added expense "Dinner" in group "Goa trip"',
      actorContent: 'You added expense "Dinner" in group "Goa trip"',
      message: 'Asha added expense "Dinner" in group "Goa trip"',
      url: "/groups/g1/expense/e1",
    });
  });

  it("expenseUpdated matches update-expense", () => {
    expect(expenseUpdated("Asha", expense)).toEqual({
      type: "EXPENSE_UPDATE",
      heading: "Expense updated",
      content: 'Asha updated expense "Dinner" in group "Goa trip"',
      actorContent: 'You updated expense "Dinner" in group "Goa trip"',
      message: 'Asha updated expense "Dinner" in group "Goa trip"',
      url: "/groups/g1/expense/e1",
    });
  });

  it("expenseDeleted matches delete-expense for an expense", () => {
    expect(expenseDeleted("Asha", expense)).toEqual({
      type: "EXPENSE_MINUS",
      heading: "Expense deleted",
      content: 'Asha deleted expense "Dinner" in group "Goa trip"',
      actorContent: 'You deleted expense "Dinner" in group "Goa trip"',
      message: 'Asha deleted expense "Dinner" in group "Goa trip"',
      url: "/groups/g1",
    });
  });

  it("expenseDeleted is SETTLEMENT_MINUS for a settlement", () => {
    const settlement = {
      ...expense,
      tag: "SETTLEMENT" as const,
      settlement: true,
    };
    const msg = expenseDeleted("Asha", settlement);
    expect(msg.type).toBe("SETTLEMENT_MINUS");
    expect(msg.message).toBe(
      'Asha deleted settlement "Dinner" in group "Goa trip"',
    );
  });

  it("settlementCreated matches create-settlement", () => {
    expect(settlementCreated("Asha", expense)).toEqual({
      type: "SETTLEMENT_PLUS",
      heading: "Settlement added",
      content: 'Asha added settlement "Dinner" in group "Goa trip"',
      actorContent: 'You added settlement "Dinner" in group "Goa trip"',
      message: "Dinner ₹450 in group Goa trip",
      url: "/groups/g1/expense/e1",
    });
  });

  it("names an unnamed actor Someone, as the routes did", () => {
    expect(groupCreated("", group).message).toBe(
      "Someone created group Goa trip",
    );
  });
});
