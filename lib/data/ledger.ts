import type { GetGroupLedgerData } from "@dataconnect/app";
import type { User } from "@/generated/prisma/browser";
import type { ExpenseWithPaymentWithSplit } from "@/types/shared";

type LedgerExpense = GetGroupLedgerData["expenses"][number];

// The split engine reads only ids and amounts; the rest of a person is not in the ledger.
const stubUser = (id: string): User =>
  ({
    id,
    uid: id,
    email: "",
    name: null,
    firstName: null,
    lastName: null,
    image_url: null,
    profile_image_url: null,
    fromClerk: null,
    createdAt: new Date(0),
    updatedAt: null,
  }) as User;

/**
 * Turns `GetGroupLedger`'s expenses into the `ExpenseWithPaymentWithSplit` shape `calcGroupSplits`,
 * `calcExpenseSplits` and `evaluateTotals` read, so the split engine runs unchanged.
 */
export function toLedgerExpenses(
  ledger: GetGroupLedgerData["expenses"],
): ExpenseWithPaymentWithSplit[] {
  return ledger.map((expense: LedgerExpense) => {
    const createdAt = new Date(expense.createdAt);
    return {
      id: expense.id,
      amount: expense.amount,
      currency: null,
      description: expense.description,
      category: null,
      settlement: expense.tag === "SETTLEMENT",
      tag: expense.tag,
      type: expense.type,
      groupId: null,
      createrId: "",
      createdAt,
      updatedAt: null,
      payments: expense.payments.map((p) => ({
        id: "",
        amount: p.amount,
        currency: null,
        userId: p.user.id,
        expenseId: expense.id,
        createdAt,
        updatedAt: null,
        user: stubUser(p.user.id),
      })),
      splits: expense.splits.map((s) => ({
        id: "",
        amount: s.amount,
        currency: null,
        percent: s.percent ?? null,
        userId: s.user.id,
        expenseId: expense.id,
        createdAt,
        updatedAt: null,
        user: stubUser(s.user.id),
      })),
    };
  });
}
