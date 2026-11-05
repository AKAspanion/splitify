import { describe, expect, it } from "vitest";
import {
  activityText,
  type ActivityForText,
  type ActivityType,
} from "./activity-text";

const G = "11111111-1111-4111-8111-111111111111";
const E = "33333333-3333-4333-8333-333333333333";

const base: ActivityForText = {
  type: "EXPENSE_PLUS",
  title: "Dinner",
  amount: 300,
  groupId: G,
  expenseId: E,
  actorId: "alice",
  subjectId: null,
};
const names = { actor: "Alice", subject: "Bob" };
const none = { actor: null, subject: null };

const group = { title: "Goa trip", amount: null, expenseId: null };

type Row = [ActivityType, Partial<ActivityForText>, string, string, string];
const rows: Row[] = [
  [
    "GROUP_PLUS",
    group,
    "Created group",
    "Alice created group Goa trip",
    `/groups/${G}`,
  ],
  [
    "GROUP_UPDATE",
    group,
    "Updated group",
    "Alice updated group Goa trip",
    `/groups/${G}`,
  ],
  [
    "GROUP_MINUS",
    { ...group, groupId: null },
    "Deleted group",
    "Alice deleted group Goa trip",
    "/groups",
  ],
  [
    "MEMBER_PLUS",
    { ...group, subjectId: "bob" },
    "Added to group",
    'Alice added Bob in group "Goa trip"',
    `/groups/${G}`,
  ],
  [
    "MEMBER_MINUS",
    { ...group, subjectId: "bob" },
    "Removed from group",
    'Alice removed Bob from group "Goa trip"',
    `/groups/${G}`,
  ],
  [
    "EXPENSE_UPDATE",
    {},
    "Expense updated",
    "Alice updated Dinner for ₹ 300",
    `/groups/${G}/expense/${E}`,
  ],
  [
    "EXPENSE_MINUS",
    {},
    "Expense deleted",
    "Alice deleted Dinner for ₹ 300",
    `/groups/${G}`,
  ],
  [
    "SETTLEMENT_PLUS",
    { title: "Settlement", subjectId: "bob" },
    "Settlement added",
    "Alice added settlement for ₹ 300",
    `/groups/${G}/expense/${E}`,
  ],
  [
    "SETTLEMENT_MINUS",
    { title: "Settlement" },
    "Settlement deleted",
    "Alice deleted settlement for ₹ 300",
    `/groups/${G}`,
  ],
  [
    "USER",
    {
      title: "Bob",
      amount: null,
      groupId: null,
      expenseId: null,
      subjectId: "bob",
    },
    "New friend",
    "Alice added you as a friend",
    "/friends/bob",
  ],
  [
    "SYSTEM",
    {
      title: "Welcome to Splitify",
      amount: null,
      groupId: null,
      expenseId: null,
    },
    "Splitify",
    "Welcome to Splitify",
    "/groups",
  ],
];

describe("activityText", () => {
  it("words an added expense with the amount in rupees and links to the expense", () => {
    expect(activityText(base, names)).toEqual({
      title: "Expense added",
      body: "Alice added Dinner for ₹ 300",
      link: `/groups/${G}/expense/${E}`,
    });
  });

  it("says Someone when the actor has no name", () => {
    expect(activityText(base, none).body).toBe(
      "Someone added Dinner for ₹ 300",
    );
  });

  it.each(rows)("%s: title, body and link", (type, over, title, body, link) => {
    expect(activityText({ ...base, ...over, type }, names)).toEqual({
      title,
      body,
      link,
    });
  });

  it("covers every activity type", () => {
    const types: ActivityType[] = [
      "SETTLEMENT_MINUS",
      "SETTLEMENT_PLUS",
      "EXPENSE_MINUS",
      "EXPENSE_PLUS",
      "EXPENSE_UPDATE",
      "MEMBER_MINUS",
      "MEMBER_PLUS",
      "GROUP_MINUS",
      "GROUP_PLUS",
      "GROUP_UPDATE",
      "SYSTEM",
      "USER",
    ];
    const tested = new Set<string>(["EXPENSE_PLUS", ...rows.map((r) => r[0])]);
    expect(types.filter((t) => !tested.has(t))).toEqual([]);
  });

  it("uses Someone for a missing actor or subject", () => {
    const text = activityText(
      { ...base, type: "MEMBER_PLUS", ...group, subjectId: "bob" },
      none,
    );
    expect(text.body).toBe('Someone added Someone in group "Goa trip"');
    expect(
      activityText(
        {
          ...base,
          type: "USER",
          subjectId: "bob",
          groupId: null,
          expenseId: null,
          amount: null,
        },
        none,
      ).body,
    ).toBe("Someone added you as a friend");
  });

  it("leaves the amount out when there is none and rounds it to two places", () => {
    expect(activityText({ ...base, amount: null }, names).body).toBe(
      "Alice added Dinner",
    );
    expect(activityText({ ...base, amount: 12.346 }, names).body).toBe(
      "Alice added Dinner for ₹ 12.35",
    );
  });

  it("falls back to the group, then to /groups, when an expense or a group id is missing", () => {
    expect(activityText({ ...base, expenseId: null }, names).link).toBe(
      `/groups/${G}`,
    );
    expect(
      activityText({ ...base, expenseId: null, groupId: null }, names).link,
    ).toBe("/groups");
  });
});
