import {
  EXPENSE_HEADERS,
  expenseLine,
  textCell,
  type LedgerExpense,
} from "./csv";

/**
 * The group's title, then the old text report: a header line and one comma-separated line per expense. The cells are
 * escaped as the CSV's are, since a spreadsheet can import this file too.
 */
export function buildText(title: string, expenses: LedgerExpense[]): string {
  let text = `${textCell(title)}\n${EXPENSE_HEADERS.join(",")}\n`;
  for (const e of expenses) text += expenseLine(e) + "\n";
  return text;
}
