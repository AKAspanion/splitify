import { RUPEE_SYMBOL } from "@/constants/ui";
import { UserPaymentWithUser } from "@/types/shared";
import { fixedNum } from "@/utils/validate";
import { User, UserPayment, UserSplit } from "@prisma/client";

export const whoPaidExpense = (
  payments?: Partial<UserPaymentWithUser>[],
  currUserId?: string,
) => {
  let paid = "";
  if (payments && payments?.length) {
    const name =
      currUserId === payments[0]?.user?.id
        ? "You"
        : payments[0]?.user?.firstName || payments[0]?.user?.name || "-";

    paid =
      payments?.length > 1 ? `${payments.length} People paid` : `${name} paid`;
  }

  return paid;
};

export const yourShareInExpense = (
  userId: string,
  users: User[],
  payments: UserPayment[],
  splits: UserSplit[],
) => {
  const u = users?.find((x) => x?.id === userId);
  if (!u) {
    return { text: `You are not involved`, color: "" };
  }

  const paid = payments?.find((p) => p.userId === u.id)?.amount || 0;
  const owed = splits?.find((s) => s.userId === u.id)?.amount || 0;

  if (!paid && !owed) {
    return { text: `You are not involved`, color: "" };
  }

  const normalizedAmount = fixedNum(paid - owed);

  return normalizedAmount > 0
    ? {
        text: `You get back ${RUPEE_SYMBOL} ${Math.abs(normalizedAmount)}`,
        color: "text-sparkle",
      }
    : {
        text: `You owe ${RUPEE_SYMBOL} ${Math.abs(owed)}`,
        color: "text-destructive",
      };
};
