// The text of a push (and of a feed row) for an activity. No imports: it runs in Cloud Functions and in the app.
export type ActivityType =
  | "SETTLEMENT_MINUS"
  | "SETTLEMENT_PLUS"
  | "EXPENSE_MINUS"
  | "EXPENSE_PLUS"
  | "EXPENSE_UPDATE"
  | "MEMBER_MINUS"
  | "MEMBER_PLUS"
  | "GROUP_MINUS"
  | "GROUP_PLUS"
  | "GROUP_UPDATE"
  | "SYSTEM"
  | "USER";

export type ActivityForText = {
  type: ActivityType;
  title: string;
  amount: number | null;
  groupId: string | null;
  expenseId: string | null;
  actorId: string;
  subjectId: string | null;
};
export type PushText = { title: string; body: string; link: string };

const RUPEE = "₹";

const name = (value: string | null) => value || "Someone";

/** `" for ₹ 300"`, or nothing when the activity has no amount. Rounded to paise. */
function forAmount(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) return "";
  return ` for ${RUPEE} ${Math.round(amount * 100) / 100}`;
}

/**
 * The title, body and in-app link for an activity. The wording follows `lib/notification/messages.ts`, written out
 * here because that file imports Prisma types. `activity.title` is the group's title for group and member
 * activity, the expense's description for expense activity and the friend's name for `USER`.
 */
export function activityText(
  activity: ActivityForText,
  names: { actor: string | null; subject: string | null },
): PushText {
  const actor = name(names.actor);
  const subject = name(names.subject);
  const { title, groupId, expenseId } = activity;
  const group = groupId ? `/groups/${groupId}` : "/groups";
  const expense =
    groupId && expenseId ? `${group}/expense/${expenseId}` : group;
  const amount = forAmount(activity.amount);

  switch (activity.type) {
    case "GROUP_PLUS":
      return {
        title: "Created group",
        body: `${actor} created group ${title}`,
        link: group,
      };
    case "GROUP_UPDATE":
      return {
        title: "Updated group",
        body: `${actor} updated group ${title}`,
        link: group,
      };
    case "GROUP_MINUS":
      return {
        title: "Deleted group",
        body: `${actor} deleted group ${title}`,
        link: "/groups",
      };
    case "MEMBER_PLUS":
      return {
        title: "Added to group",
        body: `${actor} added ${subject} in group "${title}"`,
        link: group,
      };
    case "MEMBER_MINUS":
      return {
        title: "Removed from group",
        body: `${actor} removed ${subject} from group "${title}"`,
        link: group,
      };
    case "EXPENSE_PLUS":
      return {
        title: "Expense added",
        body: `${actor} added ${title}${amount}`,
        link: expense,
      };
    case "EXPENSE_UPDATE":
      return {
        title: "Expense updated",
        body: `${actor} updated ${title}${amount}`,
        link: expense,
      };
    case "EXPENSE_MINUS":
      return {
        title: "Expense deleted",
        body: `${actor} deleted ${title}${amount}`,
        link: group,
      };
    case "SETTLEMENT_PLUS":
      return {
        title: "Settlement added",
        body: `${actor} added settlement${amount}`,
        link: expense,
      };
    case "SETTLEMENT_MINUS":
      return {
        title: "Settlement deleted",
        body: `${actor} deleted settlement${amount}`,
        link: group,
      };
    case "USER":
      return {
        title: "New friend",
        body: `${actor} added you as a friend`,
        link: activity.subjectId
          ? `/friends/${activity.subjectId}`
          : "/friends",
      };
    case "SYSTEM":
      return { title: "Splitify", body: title, link: "/groups" };
  }
}
