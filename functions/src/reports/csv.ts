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

// A spreadsheet runs a cell that starts with one of these as a formula (`=HYPERLINK(...)`), so a text cell that does
// gets a leading `'`, which it shows as text (OWASP, CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;
const asText = (value: string): string =>
  FORMULA_START.test(value) ? `'${value}` : value;

/** A cell someone wrote (a description, a title), safe in a spreadsheet: never a formula, quoted where it needs it. */
export const textCell = (value: string): string => csvCell(asText(value));

// The amount is a number the report wrote itself, so it is left as a number.
const AMOUNT = EXPENSE_HEADERS.indexOf("Amount");

/** An expense's comma-separated line, for every report format that writes one (the CSV and the text file). */
export const expenseLine = (e: LedgerExpense): string =>
  expenseCells(e)
    .map((cell, i) => (i === AMOUNT ? csvCell(cell) : textCell(cell)))
    .join(",");

/** The header line the old report started with, then one line per expense, quoted where a cell needs it. */
export function buildCsv(expenses: LedgerExpense[]): string {
  const lines = [EXPENSE_HEADERS.join(",")];
  for (const e of expenses) lines.push(expenseLine(e));
  return lines.join("\n") + "\n";
}
