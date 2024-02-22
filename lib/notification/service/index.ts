import { Expense } from "@prisma/client";

const ContentType = "application/json";

export class NotificationService {
  public static async sendNotification(
    heading: string,
    content: string,
    external_id: string[],
    options?: SendNotificationOptions,
  ) {
    try {
      const data = await fetch("/api/push-notification", {
        method: "POST",
        headers: { "Content-Type": ContentType },
        body: JSON.stringify({
          heading,
          content,
          external_id,
          options,
        } satisfies SendNotificationUserbody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  public static async createFriend(userId: string, friendId: string) {
    try {
      const data = await fetch("/api/push-notification/update-group-member", {
        method: "POST",
        headers: { "Content-Type": ContentType },
        body: JSON.stringify({
          userId,
          friendId,
        } satisfies CreateFriendNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  public static async updateGroupMember(
    userId: string,
    friendId: string,
    groupId: string,
  ) {
    try {
      const data = await fetch("/api/push-notification/update-group-member", {
        method: "POST",
        headers: { "Content-Type": ContentType },
        body: JSON.stringify({
          userId,
          friendId,
          groupId,
        } satisfies UpdateGroupMemberNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  public static async createExpense(userId: string, exp: Expense) {
    try {
      const data = await fetch("/api/push-notification/create-expense", {
        method: "POST",
        headers: { "Content-Type": ContentType },
        body: JSON.stringify({
          groupId: exp?.groupId || "",
          expenseId: exp?.id || "",
          userId,
        } satisfies CreateExpenseNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  public static async deleteExpense(
    userId: string,
    expenseDesc: string,
    groupId?: string,
  ) {
    try {
      const data = await fetch("/api/push-notification/delete-expense", {
        method: "POST",
        headers: { "Content-Type": ContentType },
        body: JSON.stringify({
          groupId: groupId || "",
          expenseDesc,
          userId,
        } satisfies DeleteExpenseNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }
}
