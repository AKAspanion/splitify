import type { ActivityType, Expense } from "@/generated/prisma/browser";
import { RUPEE_SYMBOL } from "@/constants/ui";

/**
 * What an action records as activity and sends as a push. `content` is the push text every recipient gets;
 * `actorContent`, when set, replaces it for the person who made the change ("You added ..." instead of their name).
 */
export type ActivityMessage = {
  type: ActivityType;
  message: string;
  heading: string;
  content: string;
  url: string;
  actorContent?: string;
};

type GroupRef = { id: string; title: string };

/** An expense with the title of its group, which the expense messages quote. */
export type ExpenseForMessage = Expense & { group?: { title: string } | null };

const who = (name: string) => name || "Someone";

const expenseUrl = (expense: Expense) =>
  `/groups/${expense.groupId || ""}/expense/${expense.id}`;

export function groupCreated(
  actorName: string,
  group: GroupRef,
): ActivityMessage {
  return {
    type: "GROUP_PLUS",
    heading: "Created group",
    content: `You created group ${group.title || ""}`,
    message: `${who(actorName)} created group ${group.title || ""}`,
    url: `/groups/${group.id}`,
  };
}

export function groupUpdated(
  actorName: string,
  group: GroupRef,
): ActivityMessage {
  return {
    type: "GROUP_UPDATE",
    heading: "Updated group",
    content: `You updated group ${group.title || ""}`,
    message: `${who(actorName)} updated group ${group.title || ""}`,
    url: `/groups/${group.id}`,
  };
}

export function groupDeleted(
  actorName: string,
  groupName: string,
): ActivityMessage {
  return {
    type: "GROUP_MINUS",
    heading: "Deleted group",
    content: `You deleted group ${groupName || ""}`,
    message: `${who(actorName)} deleted group ${groupName || ""}`,
    url: `/groups`,
  };
}

/** `content` goes to the person added; `actorContent` to the person who added them. */
export function memberAdded(
  actorName: string,
  memberName: string,
  group: GroupRef,
): ActivityMessage {
  return {
    type: "MEMBER_PLUS",
    heading: "Added to group",
    content: `You have been added in group "${group.title || ""}" by ${who(actorName)}`,
    actorContent: `You added ${who(memberName)} in group "${group.title || ""}"`,
    message: `${who(actorName)} added ${who(memberName)} in group "${group.title || ""}"`,
    url: `/groups/${group.id}`,
  };
}

function expenseChange(
  type: "EXPENSE_PLUS" | "EXPENSE_UPDATE",
  heading: string,
  verb: string,
  actorName: string,
  expense: ExpenseForMessage,
): ActivityMessage {
  const rest = `expense "${expense.description || ""}" in group "${expense.group?.title || ""}"`;
  return {
    type,
    heading,
    content: `${who(actorName)} ${verb} ${rest}`,
    actorContent: `You ${verb} ${rest}`,
    message: `${who(actorName)} ${verb} ${rest}`,
    url: expenseUrl(expense),
  };
}

export function expenseCreated(
  actorName: string,
  expense: ExpenseForMessage,
): ActivityMessage {
  return expenseChange(
    "EXPENSE_PLUS",
    "Expense added",
    "added",
    actorName,
    expense,
  );
}

export function expenseUpdated(
  actorName: string,
  expense: ExpenseForMessage,
): ActivityMessage {
  return expenseChange(
    "EXPENSE_UPDATE",
    "Expense updated",
    "updated",
    actorName,
    expense,
  );
}

export function expenseDeleted(
  actorName: string,
  expense: ExpenseForMessage,
): ActivityMessage {
  const settlement = !!expense.settlement || expense.tag === "SETTLEMENT";
  const kind = settlement ? "settlement" : "expense";
  const rest = `${kind} "${expense.description || ""}" in group "${expense.group?.title || ""}"`;
  return {
    type: settlement ? "SETTLEMENT_MINUS" : "EXPENSE_MINUS",
    heading: "Expense deleted",
    content: `${who(actorName)} deleted ${rest}`,
    actorContent: `You deleted ${rest}`,
    message: `${who(actorName)} deleted ${rest}`,
    url: `/groups/${expense.groupId || ""}`,
  };
}

export function settlementCreated(
  actorName: string,
  expense: ExpenseForMessage,
): ActivityMessage {
  const title = expense.group?.title || "";
  return {
    type: "SETTLEMENT_PLUS",
    heading: "Settlement added",
    content: `${who(actorName)} added settlement "${expense.description}" in group "${title}"`,
    actorContent: `You added settlement "${expense.description}" in group "${title}"`,
    message: `${expense.description || ""} ${RUPEE_SYMBOL}${expense.amount || 0} in group ${title}`,
    url: expenseUrl(expense),
  };
}
