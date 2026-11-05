import { EXPENSE_HEADERS, expenseCells, type LedgerExpense } from "./csv";

/** The group's title, then the old text report: a header line and one comma-separated line per expense. */
export function buildText(title: string, expenses: LedgerExpense[]): string {
  let text = `${title}\n${EXPENSE_HEADERS.join(",")}\n`;
  for (const e of expenses) text += expenseCells(e).join(",") + "\n";
  return text;
}
