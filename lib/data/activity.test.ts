import { describe, expect, it } from "vitest";
import { activityLine, fetchGroupPage, type ActivityItem } from "./activity";

const item = (over: Partial<ActivityItem>): ActivityItem => ({
  id: "a1",
  type: "EXPENSE_PLUS",
  title: "Dinner",
  amount: 300,
  expenseId: "e1",
  groupId: "g1",
  createdAt: "2026-11-05T00:00:00.000Z",
  actorId: "me",
  actorName: "Asha Rao",
  subjectId: null,
  subjectName: null,
  ...over,
});

describe("activityLine", () => {
  it("names the viewer 'You' when the viewer is the actor", () => {
    const line = activityLine(item({}), "me");
    expect(line.body).toBe("You added Dinner for ₹ 300");
    expect(line.title).toBe("Expense added");
    expect(line.link).toBe("/groups/g1/expense/e1");
  });

  it("names the actor when someone else did it", () => {
    expect(activityLine(item({}), "other").body).toBe(
      "Asha Rao added Dinner for ₹ 300",
    );
  });

  it("falls back to 'Someone' for an actor without a name", () => {
    expect(activityLine(item({ actorName: null }), "other").body).toBe(
      "Someone added Dinner for ₹ 300",
    );
  });

  it("says 'You were added to' when a MEMBER_PLUS names the viewer", () => {
    const line = activityLine(
      item({
        type: "MEMBER_PLUS",
        title: "Goa trip",
        amount: null,
        expenseId: null,
        actorId: "boss",
        actorName: "Ravi",
        subjectId: "me",
        subjectName: "Asha Rao",
      }),
      "me",
    );
    expect(line.body).toBe('You were added to group "Goa trip"');
    expect(line.link).toBe("/groups/g1");
  });

  it("names both people when a MEMBER_PLUS is about someone else", () => {
    const line = activityLine(
      item({
        type: "MEMBER_PLUS",
        title: "Goa trip",
        actorId: "boss",
        actorName: "Ravi",
        subjectId: "x",
        subjectName: "Kim",
      }),
      "me",
    );
    expect(line.body).toBe('Ravi added Kim in group "Goa trip"');
  });
});

describe("fetchGroupPage", () => {
  const feed = (n: number, groupOf: (i: number) => string) =>
    Array.from({ length: n }, (_, i) =>
      item({ id: `a${i}`, groupId: groupOf(i) }),
    );

  it("keeps only the group's entries, ten to a page, and says where the next page starts", async () => {
    const all = feed(120, (i) => (i % 2 === 0 ? "g1" : "g2"));
    const fetchChunk = async (limit: number, offset: number) =>
      all.slice(offset, offset + limit);
    const first = await fetchGroupPage("g1", 0, fetchChunk);
    expect(first.items.map((a) => a.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `a${i * 2}`),
    );
    expect(first.items.every((a) => a.groupId === "g1")).toBe(true);
    expect(first.nextOffset).toBe(19);
    const second = await fetchGroupPage("g1", first.nextOffset!, fetchChunk);
    expect(second.items[0].id).toBe("a20");
  });

  it("matches a group id with or without dashes", async () => {
    const all = feed(3, () => "1111111111114111811111111111111");
    const dashed = "11111111-1111-4111-8111-111111111111";
    const plain = dashed.replaceAll("-", "");
    const rows = all.map((a) => ({ ...a, groupId: plain }));
    const page = await fetchGroupPage(dashed, 0, async () => rows);
    expect(page.items).toHaveLength(3);
  });

  it("ends when the feed does", async () => {
    const all = feed(7, () => "g1");
    const page = await fetchGroupPage("g1", 0, async (limit, offset) =>
      all.slice(offset, offset + limit),
    );
    expect(page.items).toHaveLength(7);
    expect(page.nextOffset).toBeNull();
  });
});
