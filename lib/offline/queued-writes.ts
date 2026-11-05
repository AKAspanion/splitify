import {
  onlineManager,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/data/client";
import { toUserMessage } from "@/lib/data/errors";
import {
  createExpense,
  createSettlement,
  type CreateExpenseVars,
  type CreateSettlementVars,
} from "@/lib/data/expense-writes";
import { invalidatedByExpenseWrite, normalizeId } from "@/lib/data/expenses";
import type { ExpensePage, GroupExpense } from "@/lib/data/groups";
import { toLedgerExpenses } from "@/lib/data/ledger";
import type { ExpenseWithPaymentWithSplit } from "@/types/shared";

/** The keys the mutations are registered under, so one paused before a reload can be resumed after it. */
export const CREATE_EXPENSE_KEY = ["CreateExpense"] as const;
export const CREATE_SETTLEMENT_KEY = ["CreateSettlement"] as const;

type Pending = { pending?: boolean };
type ListRow = GroupExpense & Pending;
type LedgerRow = ExpenseWithPaymentWithSplit & Pending;
type ListData = InfiniteData<ExpensePage, number>;
type Op = "CreateExpense" | "CreateSettlement";

/** Set when the write was made offline, and kept with the paused mutation across a reload. */
type WriteContext = { queued: boolean };

/**
 * An "already exists" answer for the write's own expense id: SQL Connect rejects the insert on `expense_pkey`
 * (code `ALREADY_EXISTS`), which means an earlier send of the same write got through.
 */
export function isDuplicateIdError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    message.includes("ALREADY_EXISTS") &&
    message.includes("expense_pkey")
  );
}

const sameId = (a: string, b: string) => normalizeId(a) === normalizeId(b);

/** `rows` with the pending ones first, marked, and any stored row they replace left out. */
export function withPending<T extends { id: string }>(
  rows: T[],
  pending: T[],
): (T & Pending)[] {
  return [
    ...pending.map((row) => ({ ...row, pending: true })),
    ...rows.filter((row) => !pending.some((p) => sameId(p.id, row.id))),
  ];
}

const withoutMark = <T extends Pending>(row: T): T => {
  const { pending: _pending, ...rest } = row;
  void _pending;
  return rest as T;
};

/** The group's expense lists without a search: a row matching nobody's search text isn't put in a filtered list. */
function listQueries(client: QueryClient, groupId: string) {
  return client
    .getQueryCache()
    .findAll({ queryKey: [...queryKeys.ListGroupExpenses({ groupId })] })
    .filter((query) => {
      const variables = query.queryKey[1] as { search?: string } | undefined;
      return !variables?.search;
    });
}

function changeList(
  client: QueryClient,
  groupId: string,
  change: (page: ExpensePage, first: boolean) => ExpensePage,
) {
  for (const query of listQueries(client, groupId)) {
    client.setQueryData<ListData>(query.queryKey, (data) =>
      data && data.pages.length
        ? { ...data, pages: data.pages.map((p, i) => change(p, i === 0)) }
        : data,
    );
  }
}

function changeLedger(
  client: QueryClient,
  groupId: string,
  change: (rows: LedgerRow[]) => LedgerRow[],
) {
  client.setQueryData<LedgerRow[]>(
    [...queryKeys.GetGroupLedger({ groupId })],
    (rows) => (rows ? change(rows) : rows),
  );
}

function insertRow(
  client: QueryClient,
  groupId: string,
  list: ListRow,
  ledger: LedgerRow,
) {
  changeList(client, groupId, (page, first) => ({
    ...page,
    expenses: first
      ? withPending(page.expenses, [list])
      : page.expenses.filter((e) => !sameId(e.id, list.id)),
    total: page.total + 1,
  }));
  changeLedger(client, groupId, (rows) => withPending(rows, [ledger]));
}

function removeRow(client: QueryClient, groupId: string, id: string) {
  changeList(client, groupId, (page) => {
    const expenses = page.expenses.filter((e) => !sameId(e.id, id));
    return {
      ...page,
      expenses,
      total: Math.max(0, page.total - (page.expenses.length - expenses.length)),
    };
  });
  changeLedger(client, groupId, (rows) =>
    rows.filter((r) => !sameId(r.id, id)),
  );
}

function clearMark(client: QueryClient, groupId: string, id: string) {
  const clear = <T extends { id: string } & Pending>(row: T): T =>
    sameId(row.id, id) ? withoutMark(row) : row;
  changeList(client, groupId, (page) => ({
    ...page,
    expenses: (page.expenses as ListRow[]).map(clear),
  }));
  changeLedger(client, groupId, (rows) => rows.map(clear));
}

const ledgerRow = (
  id: string,
  amount: number,
  description: string,
  tag: "EXPENSE" | "SETTLEMENT",
  type: CreateExpenseVars["type"],
  payments: { userId: string; amount: number }[],
  splits: { userId: string; amount: number; percent?: number | null }[],
): LedgerRow =>
  toLedgerExpenses([
    {
      id,
      amount,
      description,
      tag,
      type,
      createdAt: new Date().toISOString(),
      payments: payments.map((p) => ({
        amount: p.amount,
        user: { id: p.userId },
      })),
      splits: splits.map((s) => ({
        amount: s.amount,
        percent: s.percent ?? null,
        user: { id: s.userId },
      })),
    },
  ] as unknown as Parameters<typeof toLedgerExpenses>[0])[0];

/** The rows the screens show for a write that hasn't been sent: the same shapes the server's lists answer with. */
function optimisticRows(
  op: Op,
  vars: CreateExpenseVars | CreateSettlementVars,
): { list: ListRow; ledger: LedgerRow } {
  const id = normalizeId(vars.id);
  const createdAt = new Date().toISOString();
  const creator = { id: "", name: null };
  if (op === "CreateExpense") {
    const v = vars as CreateExpenseVars;
    return {
      list: {
        id,
        amount: v.amount,
        currency: "inr",
        description: v.description,
        category: v.category ?? null,
        type: v.type,
        tag: "EXPENSE",
        createdAt,
        creator,
      } as ListRow,
      ledger: ledgerRow(
        id,
        v.amount,
        v.description,
        "EXPENSE",
        v.type,
        v.payments,
        v.splits,
      ),
    };
  }
  const v = vars as CreateSettlementVars;
  return {
    list: {
      id,
      amount: v.amount,
      currency: "inr",
      description: "Settlement",
      category: null,
      type: "EXACT",
      tag: "SETTLEMENT",
      createdAt,
      creator,
    } as ListRow,
    ledger: ledgerRow(
      id,
      v.amount,
      "Settlement",
      "SETTLEMENT",
      "EXACT",
      [{ userId: v.fromUserId, amount: v.amount }],
      [{ userId: v.toUserId, amount: v.amount }],
    ),
  };
}

// A send cut short by the network is tried again; the id is the write's own, so a repeat changes nothing.
const NETWORK_ERROR_MESSAGE = toUserMessage(new TypeError("Failed to fetch"));
const MAX_NETWORK_RETRIES = 3;

function register<V extends CreateExpenseVars | CreateSettlementVars>(
  client: QueryClient,
  op: Op,
  key: readonly unknown[],
  send: (vars: V) => Promise<{ id: string }>,
) {
  client.setMutationDefaults(key, {
    mutationFn: async (vars: V) => {
      try {
        return await send(vars);
      } catch (error) {
        // An earlier send got through: the write is on the server, which is what was wanted.
        if (isDuplicateIdError(error)) return { id: vars.id };
        throw error;
      }
    },
    retry: (count, error) =>
      count < MAX_NETWORK_RETRIES &&
      toUserMessage(error) === NETWORK_ERROR_MESSAGE,
    onMutate: async (vars: V): Promise<WriteContext> => {
      // A refetch already on its way would land over the row added below.
      await Promise.all([
        client.cancelQueries({
          queryKey: [...queryKeys.GetGroupLedger({ groupId: vars.groupId })],
        }),
        client.cancelQueries({
          queryKey: [...queryKeys.ListGroupExpenses({ groupId: vars.groupId })],
        }),
      ]);
      const { list, ledger } = optimisticRows(op, vars);
      insertRow(client, vars.groupId, list, ledger);
      return { queued: !onlineManager.isOnline() };
    },
    onError: (error: Error, vars: V, context?: WriteContext) => {
      removeRow(client, vars.groupId, vars.id);
      // A write made online reports its own error in its form; only a queued one needs telling.
      if (context?.queued)
        toast.error(
          `An expense you added offline couldn't be saved: ${toUserMessage(error)}`,
        );
    },
    onSettled: async (_data: unknown, error: Error | null, vars: V) => {
      if (!error) clearMark(client, vars.groupId, vars.id);
      await Promise.all(
        invalidatedByExpenseWrite(op, vars.groupId).map((queryKey) =>
          client.invalidateQueries({ queryKey: [...queryKey] }),
        ),
      );
    },
  });
}

/**
 * Registers `CreateExpense` and `CreateSettlement` on the client by key: the send, the optimistic row (marked
 * `pending`), the rollback and the refresh. A mutation paused by being offline is saved with the cache and, after
 * a reload, finds these again by its key; so this runs when the client is made, before the cache is restored.
 */
export function registerQueuedWrites(queryClient: QueryClient): void {
  register<CreateExpenseVars>(
    queryClient,
    "CreateExpense",
    CREATE_EXPENSE_KEY,
    createExpense,
  );
  register<CreateSettlementVars>(
    queryClient,
    "CreateSettlement",
    CREATE_SETTLEMENT_KEY,
    createSettlement,
  );
}
