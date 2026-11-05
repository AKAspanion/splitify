/** One expense of the group's ledger, as the `GetGroupLedgerAdmin` query returns it. */
export type LedgerExpense = {
  description: string;
  amount: number;
  category: string | null;
  type: string;
  payments: { amount: number; user: { id: string; name: string | null } }[];
  splits: { amount: number; user: { id: string; name: string | null } }[];
};

export const EXPENSE_HEADERS = [
  "Description",
  "Amount",
  "Category",
  "Type",
] as const;

/** The cells of an expense's line, as the old reports printed them (`""` for an empty one). */
export const expenseCells = (e: LedgerExpense): string[] => [
  e.description || "",
  String(e.amount || ""),
  e.category || "",
  e.type || "",
];

const csvCell = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/** The header line the old report started with, then one line per expense, quoted where a cell needs it. */
export function buildCsv(expenses: LedgerExpense[]): string {
  const lines = [EXPENSE_HEADERS.join(",")];
  for (const e of expenses) lines.push(expenseCells(e).map(csvCell).join(","));
  return lines.join("\n") + "\n";
}
