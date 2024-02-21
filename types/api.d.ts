type CreateExpenseNotificationBody = {
  userId: string;
  groupId: string;
  expenseId: string;
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
