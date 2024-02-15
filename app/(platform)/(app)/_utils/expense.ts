import { RUPPEE_SYMBOL } from "@/constants/ui";
import { UserPaymentWithUser } from "@/types/shared";

export const whoPaidExpense = (
  amount?: number,
  payments?: UserPaymentWithUser[],
) => {
  let paid = "";
  if (payments && payments?.length) {
    paid =
      payments?.length > 1
        ? `${payments.length} People Paid`
        : `${payments[0]?.user?.name} Paid`;

    if (amount) {
      paid = paid + ` ${RUPPEE_SYMBOL}${amount}`;
    }
  }

  return paid;
};
