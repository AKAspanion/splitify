import {
  dehydrate,
  hydrate,
  MutationObserver,
  onlineManager,
  QueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExpensePage } from "@/lib/data/groups";
import type { CreateExpenseVars } from "@/lib/data/expense-writes";
import { createExpense, createSettlement } from "@/lib/data/expense-writes";
import { queryKeys } from "@/lib/data/client";
import { toast } from "sonner";
import {
  CREATE_EXPENSE_KEY,
  CREATE_SETTLEMENT_KEY,
  isDuplicateIdError,
  registerQueuedWrites,
  withPending,
} from "./queued-writes";

vi.mock("@/lib/data/expense-writes", () => ({
  createExpense: vi.fn(),
  createSettlement: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const G = "11111111111141118111111111111111";
const OTHER = "33333333333343338333333333333333";
const EXPENSE_UUID = "22222222-2222-4222-8222-222222222222";
const EXPENSE_ID = "22222222222242228222222222222222";

// What SQL Connect answers when the expense's id is already in the table (see lib/data/expense-writes.rules.test.ts).
const duplicateError = Object.assign(
  new Error(
    'DataConnect error while performing request: [{"message":"violates SQL unique constraint: expense_pkey\\nNot found (aborted)\\nOnly members of this group can be added to an expense (aborted)","path":["query"],"extensions":{"code":"ALREADY_EXISTS"}},{"message":"(aborted)","path":["expense_insert"],"extensions":{"code":"ABORTED"}}]',
  ),
  { code: "partial-error" },
);
const notFoundError = Object.assign(
  new Error(
    'DataConnect error while performing request: [{"message":"Not found (aborted)","path":["query"],"extensions":{"code":"ABORTED"}}]',
  ),
  { code: "partial-error" },
);

const expenseVars = (): CreateExpenseVars => ({
  id: EXPENSE_UUID,
  groupId: G,
  amount: 300,
  description: "Dinner",
  category: "food",
  type: "EQUAL",
  payments: [{ id: "p1", userId: "alice", amount: 300 }],
  splits: [
    { id: "s1", userId: "alice", amount: 150 },
    { id: "s2", userId: "bob", amount: 150 },
  ],
  activityId: "a1",
});

const settlementVars = () => ({
  id: EXPENSE_UUID,
  groupId: G,
  amount: 50,
  fromUserId: "alice",
  toUserId: "bob",
  paymentId: "p1",
  splitId: "s1",
  activityId: "a1",
});

type Row = { id: string; pending?: boolean };
const listKey = (groupId = G) =>
  queryKeys.ListGroupExpenses({ groupId, search: "" });
const ledgerKey = (groupId = G) => queryKeys.GetGroupLedger({ groupId });

function seed(client: QueryClient, groupId = G) {
  client.setQueryData<InfiniteData<ExpensePage, number>>(listKey(groupId), {
    pages: [
      {
        expenses: [{ id: "old" } as unknown as ExpensePage["expenses"][number]],
        total: 1,
        offset: 0,
      },
    ],
    pageParams: [0],
  });
  client.setQueryData(ledgerKey(groupId), [{ id: "old", amount: 10 }]);
}

const firstPage = (client: QueryClient) =>
  client.getQueryData<InfiniteData<ExpensePage, number>>(listKey())!.pages[0];
const listRows = (client: QueryClient, groupId = G): Row[] =>
  (
    client.getQueryData<InfiniteData<ExpensePage, number>>(listKey(groupId)) as
      InfiniteData<ExpensePage, number> | undefined
  )?.pages.flatMap((p) => p.expenses as unknown as Row[]) ?? [];
const ledgerRows = (client: QueryClient, groupId = G): Row[] =>
  client.getQueryData<Row[]>(ledgerKey(groupId)) ?? [];

function send(
  client: QueryClient,
  key: readonly unknown[],
  vars: unknown,
): Promise<unknown> {
  const observer = new MutationObserver(client, { mutationKey: key });
  return observer.mutate(vars as never).catch(() => undefined);
}

const settled = (client: QueryClient) =>
  vi.waitFor(() => {
    expect(
      client
        .getMutationCache()
        .getAll()
        .every((m) => !m.state.isPaused && m.state.status !== "pending"),
    ).toBe(true);
  });

const newClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { networkMode: "online" },
    },
  });

let client: QueryClient;

beforeEach(() => {
  vi.mocked(createExpense).mockReset();
  vi.mocked(createSettlement).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(createExpense).mockResolvedValue({ id: EXPENSE_UUID });
  vi.mocked(createSettlement).mockResolvedValue({ id: EXPENSE_UUID });
  client = newClient();
  registerQueuedWrites(client);
  seed(client);
});

afterEach(() => {
  onlineManager.setOnline(true);
});

describe("isDuplicateIdError", () => {
  it("is true for SQL Connect's duplicate-key answer for the expense's id", () => {
    expect(isDuplicateIdError(duplicateError)).toBe(true);
  });

  it("is false for Not found and for a network error", () => {
    expect(isDuplicateIdError(notFoundError)).toBe(false);
    expect(isDuplicateIdError(new TypeError("Failed to fetch"))).toBe(false);
    expect(isDuplicateIdError(undefined)).toBe(false);
  });
});

describe("withPending", () => {
  it("puts the pending rows first, marked, and drops a stored row they replace", () => {
    const rows = [{ id: "a" }, { id: "b" }];
    expect(withPending(rows, [{ id: "b" }, { id: "c" }])).toEqual([
      { id: "b", pending: true },
      { id: "c", pending: true },
      { id: "a" },
    ]);
  });
});

describe("an offline CreateExpense", () => {
  it("adds the row to the group's list and ledger at once, and pauses", async () => {
    onlineManager.setOnline(false);
    void send(client, CREATE_EXPENSE_KEY, expenseVars());

    await vi.waitFor(() => expect(listRows(client)[0]?.id).toBe(EXPENSE_ID));
    expect(listRows(client)[0].pending).toBe(true);
    expect(listRows(client).map((r) => r.id)).toEqual([EXPENSE_ID, "old"]);
    expect(ledgerRows(client).map((r) => r.id)).toEqual([EXPENSE_ID, "old"]);
    expect(ledgerRows(client)[0].pending).toBe(true);
    expect(firstPage(client).total).toBe(2);
    await vi.waitFor(() =>
      expect(client.getMutationCache().getAll()[0].state.isPaused).toBe(true),
    );
    expect(createExpense).not.toHaveBeenCalled();
  });

  it("leaves another group's caches alone", async () => {
    seed(client, OTHER);
    onlineManager.setOnline(false);
    void send(client, CREATE_EXPENSE_KEY, expenseVars());
    await vi.waitFor(() => expect(listRows(client)[0]?.id).toBe(EXPENSE_ID));
    expect(listRows(client, OTHER).map((r) => r.id)).toEqual(["old"]);
    expect(ledgerRows(client, OTHER).map((r) => r.id)).toEqual(["old"]);
  });

  it("clears the pending mark and invalidates the group's keys when the server says success", async () => {
    onlineManager.setOnline(false);
    void send(client, CREATE_EXPENSE_KEY, expenseVars());
    await vi.waitFor(() => expect(listRows(client)[0]?.pending).toBe(true));
    const invalidate = vi.spyOn(client, "invalidateQueries");

    onlineManager.setOnline(true);
    await client.resumePausedMutations();
    await settled(client);

    expect(createExpense).toHaveBeenCalledTimes(1);
    expect(createExpense).toHaveBeenCalledWith(expenseVars());
    await vi.waitFor(() => expect(listRows(client)[0].pending).toBeUndefined());
    expect(ledgerRows(client)[0].pending).toBeUndefined();
    const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey?.[0]);
    expect(keys).toContain("GetGroupLedger");
    expect(keys).toContain("ListGroupExpenses");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("counts a duplicate-id answer as success", async () => {
    vi.mocked(createExpense).mockRejectedValue(duplicateError);
    onlineManager.setOnline(false);
    void send(client, CREATE_EXPENSE_KEY, expenseVars());
    await vi.waitFor(() => expect(listRows(client)[0]?.pending).toBe(true));

    onlineManager.setOnline(true);
    await client.resumePausedMutations();
    await settled(client);

    await vi.waitFor(() => expect(listRows(client)[0].pending).toBeUndefined());
    expect(listRows(client).map((r) => r.id)).toEqual([EXPENSE_ID, "old"]);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("rolls the row and the ledger change back, and says why, when the server rejects it", async () => {
    vi.mocked(createExpense).mockRejectedValue(notFoundError);
    onlineManager.setOnline(false);
    void send(client, CREATE_EXPENSE_KEY, expenseVars());
    await vi.waitFor(() => expect(listRows(client)[0]?.pending).toBe(true));

    onlineManager.setOnline(true);
    await client.resumePausedMutations();
    await settled(client);

    await vi.waitFor(() =>
      expect(listRows(client).map((r) => r.id)).toEqual(["old"]),
    );
    expect(ledgerRows(client).map((r) => r.id)).toEqual(["old"]);
    expect(firstPage(client).total).toBe(1);
    expect(toast.error).toHaveBeenCalledWith(
      "An expense you added offline couldn't be saved: Not found",
    );
  });

  it("is still paused after a reload, and sends once when online", async () => {
    onlineManager.setOnline(false);
    void send(client, CREATE_EXPENSE_KEY, expenseVars());
    await vi.waitFor(() =>
      expect(client.getMutationCache().getAll()[0]?.state.isPaused).toBe(true),
    );
    // The row is added once onMutate has run, which can be after the pause shows.
    await vi.waitFor(() => expect(listRows(client)[0]?.pending).toBe(true));
    // What the persister writes to IndexedDB and reads back.
    const saved = JSON.parse(JSON.stringify(dehydrate(client)));

    const reloaded = newClient();
    registerQueuedWrites(reloaded);
    hydrate(reloaded, saved);

    expect(reloaded.getMutationCache().getAll()).toHaveLength(1);
    expect(reloaded.getMutationCache().getAll()[0].state.isPaused).toBe(true);
    expect(listRows(reloaded)[0].pending).toBe(true);
    await reloaded.resumePausedMutations();
    expect(createExpense).not.toHaveBeenCalled();

    onlineManager.setOnline(true);
    await reloaded.resumePausedMutations();
    await settled(reloaded);

    expect(createExpense).toHaveBeenCalledTimes(1);
    expect(createExpense).toHaveBeenCalledWith(expenseVars());
    await vi.waitFor(() =>
      expect(listRows(reloaded)[0].pending).toBeUndefined(),
    );
  });

  it("says nothing for a write made online that fails, since its form shows the error", async () => {
    vi.mocked(createExpense).mockRejectedValue(notFoundError);
    await send(client, CREATE_EXPENSE_KEY, expenseVars());
    expect(listRows(client).map((r) => r.id)).toEqual(["old"]);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("an offline CreateSettlement", () => {
  it("is queued the same way, and a duplicate id counts as success", async () => {
    vi.mocked(createSettlement).mockRejectedValue(duplicateError);
    onlineManager.setOnline(false);
    void send(client, CREATE_SETTLEMENT_KEY, settlementVars());
    await vi.waitFor(() => expect(listRows(client)[0]?.id).toBe(EXPENSE_ID));
    expect(listRows(client)[0].pending).toBe(true);
    expect(ledgerRows(client)[0].pending).toBe(true);

    onlineManager.setOnline(true);
    await client.resumePausedMutations();
    await settled(client);

    expect(createSettlement).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(listRows(client)[0].pending).toBeUndefined());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("rolls back and says why when the server rejects it", async () => {
    vi.mocked(createSettlement).mockRejectedValue(notFoundError);
    onlineManager.setOnline(false);
    void send(client, CREATE_SETTLEMENT_KEY, settlementVars());
    await vi.waitFor(() => expect(listRows(client)[0]?.pending).toBe(true));

    onlineManager.setOnline(true);
    await client.resumePausedMutations();
    await settled(client);

    await vi.waitFor(() =>
      expect(listRows(client).map((r) => r.id)).toEqual(["old"]),
    );
    expect(toast.error).toHaveBeenCalledWith(
      "An expense you added offline couldn't be saved: Not found",
    );
  });
});
