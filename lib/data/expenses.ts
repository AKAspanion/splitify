"use client";

import {
  deleteExpense,
  getExpense,
  listGroupMembers,
  listMyGroups,
  updateExpense,
  type GetExpenseData,
  type ListGroupMembersData,
} from "@dataconnect/app";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { User } from "@/generated/prisma/browser";
import { dc, FRESH, queryKeys } from "./client";
import {
  createExpense,
  createSettlement,
  type CreateExpenseVars,
  type CreateSettlementVars,
} from "./expense-writes";
import { fixedNum } from "@/utils/validate";
import type { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { toLedgerExpenses } from "./ledger";

export type ExpenseDetail = NonNullable<GetExpenseData["expense"]>;
export type GroupMember = ListGroupMembersData["groupMembers"][number]["user"];
export type MyGroup = {
  id: string;
  title: string;
  type: string | null;
};

type ExpenseInput = Omit<
  CreateExpenseVars,
  "id" | "activityId" | "payments" | "splits"
> & {
  payments: { userId: string; amount: number }[];
  splits: { userId: string; amount: number; percent?: number | null }[];
};
type SettlementInput = Omit<
  CreateSettlementVars,
  "id" | "paymentId" | "splitId" | "activityId"
>;

type WriteOp =
  "CreateExpense" | "CreateSettlement" | "UpdateExpense" | "DeleteExpense";

/**
 * The query keys a write makes stale: the group's ledger, expense list and page, and the caller's activity;
 * an edit or a delete also the expense itself. A key without variables matches every variation of the query.
 */
export function invalidatedByExpenseWrite(
  op: WriteOp,
  groupId: string,
  expenseId?: string,
): readonly unknown[][] {
  const keys: readonly unknown[][] = [
    [...queryKeys.GetGroupLedger({ groupId })],
    [...queryKeys.ListGroupExpenses({ groupId })],
    [...queryKeys.GetGroup({ id: groupId })],
    [...queryKeys.ListMyActivity()],
  ];
  if ((op === "UpdateExpense" || op === "DeleteExpense") && expenseId)
    return [...keys, [...queryKeys.GetExpense({ id: expenseId })]];
  return keys;
}

/** SQL Connect answers UUIDs as 32 hex digits; the address bar may carry the dashed form. */
export const normalizeId = (id: string): string =>
  id.replace(/-/g, "").toLowerCase();

const newId = () => crypto.randomUUID();

/** Makes every id of a new expense in the browser: the expense's, each payment's and split's, the activity's. */
export function prepareExpense(input: ExpenseInput): CreateExpenseVars {
  return {
    ...input,
    id: newId(),
    payments: input.payments.map((p) => ({ ...p, id: newId() })),
    splits: input.splits.map((s) => ({ ...s, id: newId() })),
    activityId: newId(),
  };
}

export function prepareSettlement(
  input: SettlementInput,
): CreateSettlementVars {
  return {
    ...input,
    id: newId(),
    paymentId: newId(),
    splitId: newId(),
    activityId: newId(),
  };
}

export type ExpenseFieldErrors = Partial<
  Record<"description" | "amount" | "groupId" | "payments" | "splits", string[]>
>;

/** The expense form's checks, run before anything is sent. `null` means the input is fine. */
export function validateExpense(input: {
  description: string;
  amount: number;
  groupId: string;
  payments: { amount: number }[];
  splits: { amount: number }[];
}): ExpenseFieldErrors | null {
  const errors: ExpenseFieldErrors = {};
  const sum = (rows: { amount: number }[]) =>
    rows.reduce((s, r) => s + (isNaN(r.amount) ? 0 : r.amount), 0);

  if (!input.description || input.description.trim().length < 3)
    errors.description = ["Minimum 3 chars required"];
  if (!input.amount || isNaN(input.amount))
    errors.amount = ["Please enter an amount"];
  if (!input.groupId) errors.groupId = ["Please select a group"];
  if (
    !isNaN(input.amount) &&
    fixedNum(sum(input.payments), 0) !== fixedNum(input.amount, 0)
  )
    errors.payments = ["All paid amount don't add up to total amount"];
  if (
    !isNaN(input.amount) &&
    fixedNum(sum(input.splits), 0) !== fixedNum(input.amount, 0)
  )
    errors.splits = ["All split amount don't add up to total amount"];

  return Object.keys(errors).length ? errors : null;
}

/** A person from SQL Connect in the shape the people lists (`UserCard`, the avatars) draw. */
export function toUser(person: {
  id: string;
  name?: string | null;
  email?: string;
  imageUrl?: string | null;
  signedUp?: boolean;
}): User {
  return {
    id: person.id,
    uid: person.id,
    email: person.email ?? "",
    name: person.name ?? null,
    firstName: person.name?.split(" ")[0] || null,
    lastName: null,
    image_url: null,
    profile_image_url: person.imageUrl ?? null,
    fromClerk: person.signedUp ?? true,
    createdAt: new Date(0),
    updatedAt: null,
  } as User;
}

/**
 * The expense in the shape the split engine and the people lists read, with each payer and splitter drawn
 * from the group's members where they are in it, and the people the screen lists.
 */
export function toExpenseView(
  expense: ExpenseDetail,
  members: GroupMember[],
): { expense: ExpenseWithPaymentWithSplit; users: User[] } {
  const known = new Map(members.map((m) => [m.id, toUser(m)]));
  const person = (u: { id: string; name?: string | null; email: string }) =>
    known.get(u.id) ?? toUser(u);
  const ledger = toLedgerExpenses([expense])[0];
  return {
    expense: {
      ...ledger,
      payments: ledger.payments.map((p, i) => ({
        ...p,
        user: person(expense.payments[i].user),
      })),
      splits: ledger.splits.map((x, i) => ({
        ...x,
        user: person(expense.splits[i].user),
      })),
    },
    users: [...known.values()],
  };
}

/** The expense, or `null` when it is missing or the caller is not in its group. */
export function useExpense(
  expenseId: string | null,
): UseQueryResult<ExpenseDetail | null> {
  return useQuery({
    queryKey: [...queryKeys.GetExpense({ id: expenseId })],
    enabled: !!expenseId,
    queryFn: async () => {
      const result = await getExpense(dc(), { id: expenseId as string }, FRESH);
      return result.data.expense ?? null;
    },
  });
}

/** The people in a group, as the expense screens use them. */
export function useExpenseGroupMembers(
  groupId: string | null,
): UseQueryResult<GroupMember[]> {
  return useQuery({
    queryKey: [...queryKeys.ListGroupMembers({ groupId }), "expense"],
    enabled: !!groupId,
    queryFn: async () => {
      const result = await listGroupMembers(
        dc(),
        { groupId: groupId as string },
        FRESH,
      );
      return result.data.groupMembers.map((m) => m.user);
    },
  });
}

/** The groups the caller is in, for the group picker of the add form. */
export function useExpenseGroups(): UseQueryResult<MyGroup[]> {
  return useQuery({
    queryKey: [...queryKeys.ListMyGroups({}), "expense"],
    queryFn: async () => {
      const result = await listMyGroups(dc(), {}, FRESH);
      return result.data.groups.map((g) => ({
        id: g.id,
        title: g.title,
        type: g.type ?? null,
      }));
    },
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return (op: WriteOp, groupId: string, expenseId?: string) =>
    Promise.all(
      invalidatedByExpenseWrite(op, groupId, expenseId).map((queryKey) =>
        client.invalidateQueries({
          queryKey,
          // A deleted expense would refetch as "not found" while the screen is still leaving.
          refetchType:
            op === "DeleteExpense" && queryKey[0] === "GetExpense"
              ? "none"
              : "active",
        }),
      ),
    );
}

export function useCreateExpense(): UseMutationResult<
  { id: string },
  Error,
  ExpenseInput
> {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(prepareExpense(input)),
    onSuccess: (_data, input) => invalidate("CreateExpense", input.groupId),
  });
}

export function useCreateSettlement(): UseMutationResult<
  { id: string },
  Error,
  SettlementInput
> {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: SettlementInput) =>
      createSettlement(prepareSettlement(input)),
    onSuccess: (_data, input) => invalidate("CreateSettlement", input.groupId),
  });
}

export function useUpdateExpense(): UseMutationResult<
  void,
  Error,
  { id: string; description: string; groupId: string }
> {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, description }) => {
      await updateExpense(dc(), { id, description, activityId: newId() });
    },
    onSuccess: (_data, v) => invalidate("UpdateExpense", v.groupId, v.id),
  });
}

export function useDeleteExpense(): UseMutationResult<
  void,
  Error,
  { id: string; groupId: string }
> {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id }) => {
      await deleteExpense(dc(), { id, activityId: newId() });
    },
    onSuccess: (_data, v) => invalidate("DeleteExpense", v.groupId, v.id),
  });
}
