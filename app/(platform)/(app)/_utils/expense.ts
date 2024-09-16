import { RUPEE_SYMBOL } from "@/constants/ui";
import { UserPaymentWithUser } from "@/types/shared";

export const whoPaidExpense = (
  amount?: number,
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

    if (amount) {
      paid = paid + ` ${RUPEE_SYMBOL}${amount}`;
    }
  }

  return paid;
};
