type CreateExpenseNotificationBody = {
  userId: string;
  groupId: string;
  expenseId: string;
};

type DeleteExpenseNotificationBody = {
  userId: string;
  groupId: string;
  expenseDesc: string;
};

type UpdateGroupMemberNotificationBody = {
  userId: string;
  groupId: string;
  friendId: string;
};

type CreateFriendNotificationBody = {
  userId: string;
  friendId: string;
};

type GenerateGroupReportBody = {
  groupId: string;
};

type GenerateExpenseReportBody = {
  expenseId: string;
};
