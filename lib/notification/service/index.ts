import { Expense } from "@prisma/client";

const ContentType = "application/json";

const options = { method: "POST", headers: { "Content-Type": ContentType } };

export class NotificationService {
  public static async sendNotification(
    heading: string,
    content: string,
    external_id: string[],
    options?: SendNotificationOptions,
  ) {
    try {
      const data = await fetch("/api/push-notification", {
        ...options,
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

  public static async createGroup(userId: string, groupId: string) {
    try {
      const data = await fetch("/api/push-notification/create-group", {
        ...options,
        body: JSON.stringify({
          userId,
          groupId,
        } satisfies CreateGroupNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  public static async updateGroup(userId: string, groupId: string) {
    try {
      const data = await fetch("/api/push-notification/update-group", {
        ...options,
        body: JSON.stringify({
          userId,
          groupId,
        } satisfies UpdateGroupNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  public static async deleteGroup(
    userId: string,
    groupId: string,
    groupName: string,
  ) {
    try {
      const data = await fetch("/api/push-notification/delete-group", {
        ...options,
        body: JSON.stringify({
          userId,
          groupId,
          groupName,
        } satisfies DeleteGroupNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  public static async createFriend(
    userId: string,
    friendId: string,
    groupId: string,
  ) {
    try {
      const data = await fetch("/api/push-notification/update-group-member", {
        ...options,
        body: JSON.stringify({
          userId,
          friendId,
          groupId,
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
        ...options,
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
        ...options,
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

  public static async updateExpense(userId: string, exp: Expense) {
    try {
      const data = await fetch("/api/push-notification/update-expense", {
        ...options,
        body: JSON.stringify({
          groupId: exp?.groupId || "",
          expenseId: exp?.id || "",
          userId,
        } satisfies UpdateExpenseNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  public static async createSettlement(userId: string, exp: Expense) {
    try {
      const data = await fetch("/api/push-notification/create-settlement", {
        ...options,
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
    expenseTag: string,
    groupId?: string,
  ) {
    try {
      const data = await fetch("/api/push-notification/delete-expense", {
        ...options,
        body: JSON.stringify({
          groupId: groupId || "",
          expenseDesc,
          expenseTag,
          userId,
        } satisfies DeleteExpenseNotificationBody),
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }
}
