export const replaceUserWithYou = (
  userId?: string | null,
  currUserId?: string | null,
  currUserName?: string | null,
) => {
  return userId ? (userId === currUserId ? "You" : currUserName || "") : "";
};