import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import { getAuth } from "firebase/auth";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import {
  resetDatabase,
  seed,
  seedGroup,
  seedUser,
  signInTestUser,
  type TestUser,
} from "../../../dataconnect/test-utils/emulator";
import { reports } from ".";

vi.mock("firebase-functions/logger", () => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

const G = "11111111-1111-4111-8111-111111111111";
const MISSING_G = "99999999-9999-4999-8999-999999999999";
const E = (n: number) => `33333333-3333-4333-8333-33333333333${n}`;

let alice: TestUser;
let bob: TestUser;
let aliceToken: string;
let bobToken: string;

beforeAll(async () => {
  alice = await signInTestUser("alice");
  bob = await signInTestUser("bob");
  aliceToken = await getAuth(alice.dc.app).currentUser!.getIdToken();
  bobToken = await getAuth(bob.dc.app).currentUser!.getIdToken();
});

beforeEach(async () => {
  await resetDatabase();
  await seedUser({
    id: alice.uid,
    email: alice.email,
    signedUp: true,
    name: "Alice",
  });
  await seedUser({
    id: bob.uid,
    email: bob.email,
    signedUp: true,
    name: "Bob",
  });
  // Bob is not a member of G.
  await seedGroup({ id: G, title: "Goa trip", memberIds: [alice.uid] });
  const expenses = [
    { n: 1, description: "Dinner", amount: 90, category: "food" },
    { n: 2, description: "Taxi, airport", amount: 30, category: null },
    { n: 3, description: "Hotel", amount: 300, category: "stay" },
  ];
  for (const e of expenses) {
    await seed(
      `mutation($g: UUID!, $e: UUID!, $p: UUID!, $s: UUID!, $desc: String!, $amount: Float!, $category: String) {
        expense_insert(data: { id: $e, groupId: $g, amount: $amount, description: $desc, category: $category, type: EQUAL, tag: EXPENSE, creatorId: "${alice.uid}" })
        userPayment_insert(data: { id: $p, expenseId: $e, userId: "${alice.uid}", amount: $amount })
        userSplit_insert(data: { id: $s, expenseId: $e, userId: "${alice.uid}", amount: $amount })
      }`,
      {
        g: G,
        e: E(e.n),
        p: `44444444-4444-4444-8444-44444444444${e.n}`,
        s: `55555555-5555-4555-8555-55555555555${e.n}`,
        desc: e.description,
        amount: e.amount,
        category: e.category,
      },
    );
  }
});

type Answer = {
  status?: number;
  body?: unknown;
  sent?: Buffer | string;
  headers: Record<string, string>;
};

const jsonHeaders = (token: string) => ({
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
});

const call = async (
  body: unknown,
  headers: Record<string, string> = jsonHeaders(aliceToken),
): Promise<Answer> => {
  const answer: Answer = { headers: {} };
  const raw =
    body === null
      ? undefined
      : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
  const req = {
    headers,
    method: "POST",
    rawBody: raw,
    body: undefined,
  } as unknown as Request;
  const res = {
    status(code: number) {
      answer.status = code;
      return this;
    },
    setHeader(name: string, value: string) {
      answer.headers[name.toLowerCase()] = value;
      return this;
    },
    json(b: unknown) {
      answer.body = b;
      return this;
    },
    send(b: Buffer | string) {
      answer.sent = b;
      return this;
    },
  } as unknown as Response;
  await (reports as unknown as (q: Request, s: Response) => Promise<void>)(
    req,
    res,
  );
  return answer;
};

describe("reports", () => {
  it("gives a member an .xlsx workbook laid out like the old route's", async () => {
    const a = await call({ groupId: G, format: "excel" });
    expect(a.status).toBe(200);
    expect(a.headers["content-type"]).toBe("application/vnd.ms-excel");
    expect(a.headers["content-disposition"]).toContain(
      'filename="Goa trip.xlsx"',
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(a.sent as never);
    const sheet = workbook.getWorksheet("Goa trip")!;
    const rows = [2, 3, 4, 5, 6, 7, 8].map((n) =>
      (sheet.getRow(n).values as unknown[]).slice(1),
    );
    expect(rows[0]).toEqual([
      "Description",
      "Amount",
      "Category",
      "Type",
      "Name",
      "Paid",
      "Owed",
    ]);
    // Each expense, then a row for each person who paid or owes on it.
    const expenseRows = rows.slice(1).filter((r) => r[0]);
    expect(expenseRows.map((r) => r.slice(0, 4))).toEqual(
      expect.arrayContaining([
        ["Dinner", 90, "food", "EQUAL"],
        ["Hotel", 300, "stay", "EQUAL"],
      ]),
    );
    expect(expenseRows).toHaveLength(3);
    const people = rows
      .slice(1)
      .filter((r) => r[4])
      .map((r) => r.slice(4));
    expect(people).toHaveLength(3);
    expect(people).toEqual(
      expect.arrayContaining([
        ["Alice", 30, 30],
        ["Alice", 300, 300],
        ["Alice", 90, 90],
      ]),
    );
  });

  it("gives a member a CSV that starts with the old header line", async () => {
    const a = await call({ groupId: G, format: "csv" });
    expect(a.status).toBe(200);
    expect(a.headers["content-type"]).toContain("text/csv");
    expect(a.headers["content-disposition"]).toContain(
      'filename="Goa trip.csv"',
    );
    const lines = (a.sent as string).trim().split("\n");
    expect(lines[0]).toBe("Description,Amount,Category,Type");
    expect(lines).toHaveLength(4);
    expect(lines).toContain('"Taxi, airport",30,,EQUAL');
  });

  it("writes a description a spreadsheet would run as a formula with a leading quote", async () => {
    await seed(
      `mutation { userSplit_deleteMany(all: true) userPayment_deleteMany(all: true) expense_deleteMany(all: true) }`,
    );
    const descriptions = [
      '=HYPERLINK("http://x")',
      "+1",
      "-1",
      "@SUM(A1)",
      "\tTab",
      "\rReturn",
      "Dinner",
    ];
    for (const [i, description] of descriptions.entries()) {
      await seed(
        `mutation($g: UUID!, $e: UUID!, $desc: String!, $at: Timestamp!) {
          expense_insert(data: { id: $e, groupId: $g, amount: 10, description: $desc, type: EQUAL, tag: EXPENSE, creatorId: "${alice.uid}", createdAt: $at })
        }`,
        {
          g: G,
          e: `66666666-6666-4666-8666-66666666666${i}`,
          desc: description,
          // Oldest first, so the report (newest first) lists them in reverse.
          at: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
        },
      );
    }
    const a = await call({ groupId: G, format: "csv" });
    expect(a.status).toBe(200);
    const body = a.sent as string;
    for (const line of [
      `"'=HYPERLINK(""http://x"")",10,,EQUAL`,
      "'+1,10,,EQUAL",
      "'-1,10,,EQUAL",
      "'@SUM(A1),10,,EQUAL",
      "'\tTab,10,,EQUAL",
      `"'\rReturn",10,,EQUAL`,
      "Dinner,10,,EQUAL",
    ])
      expect(body.split("\n")).toContain(line);
  });

  it("gives a member a text file that starts with the group's title", async () => {
    const a = await call({ groupId: G, format: "text" });
    expect(a.status).toBe(200);
    expect(a.headers["content-type"]).toContain("text/plain");
    const lines = (a.sent as string).split("\n");
    expect(lines[0]).toBe("Goa trip");
    expect(lines[1]).toBe("Description,Amount,Category,Type");
  });

  it("keeps a hostile group title out of the file name header", async () => {
    await seed(
      `mutation($g: UUID!, $t: String!) { group_update(key: { id: $g }, data: { title: $t }) }`,
      { g: G, t: 'a"b\r\nX-Evil: 1/é' },
    );
    const a = await call({ groupId: G, format: "csv" });
    expect(a.status).toBe(200);
    const header = a.headers["content-disposition"];
    expect(header).not.toMatch(/[\r\n]/);
    expect(header).toMatch(
      /^attachment; filename="[\x20-\x7e]*\.csv"; filename\*=UTF-8''[A-Za-z0-9%._~'-]*$/,
    );
    expect(header).not.toMatch(/filename="[^"]*"[^"]*"/);
  });

  it.each([
    ["a non-member", () => bobToken, G],
    ["a group that does not exist", () => aliceToken, MISSING_G],
    ["an id that is not a UUID", () => aliceToken, "not-a-uuid"],
  ])("answers %s with 404 and no file", async (_name, token, groupId) => {
    const a = await call({ groupId, format: "excel" }, jsonHeaders(token()));
    expect(a.status).toBe(404);
    expect(a.body).toEqual({ message: "Not found" });
    expect(a.sent).toBeUndefined();
  });

  it.each([
    ["an unknown format", { groupId: G, format: "pdf" }],
    ["a missing groupId", { format: "csv" }],
    ["a missing format", { groupId: G }],
    ["a groupId that is not a string", { groupId: 5, format: "csv" }],
    [
      "a format named like an object key",
      { groupId: G, format: "constructor" },
    ],
    ["no body at all", null],
  ])("answers %s with 400", async (_name, body) => {
    const a = await call(body);
    expect(a.status).toBe(400);
    expect(a.body).toEqual({ message: "Choose a report format." });
    expect(a.sent).toBeUndefined();
  });

  it("answers a request without a token with 401, through the guard", async () => {
    const a = await call(
      { groupId: G, format: "csv" },
      { "content-type": "application/json" },
    );
    expect(a.status).toBe(401);
    expect(a.body).toEqual({ message: "Sign in again to continue." });
    expect(a.sent).toBeUndefined();
  });

  it("answers a group with no expenses with 404", async () => {
    await seed(
      `mutation { userSplit_deleteMany(all: true) userPayment_deleteMany(all: true) expense_deleteMany(all: true) }`,
    );
    const a = await call({ groupId: G, format: "csv" });
    expect(a.status).toBe(404);
    expect(a.body).toEqual({ message: "No expenses found" });
  });
});
