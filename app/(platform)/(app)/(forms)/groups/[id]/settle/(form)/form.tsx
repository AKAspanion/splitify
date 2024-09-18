"use client";
import { createSettlement } from "@/actions/create-settlement";
import { CurrencyCombobox } from "@/app/(platform)/(app)/_components/currency-combobox";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { RUPEE_SYMBOL } from "@/constants/ui";
import { useAction } from "@/hooks/use-action";
import { NotificationService } from "@/lib/notification/service";
import { getCurrencies, getCurrencySymbol } from "@/utils/currency";
import { fixedNum } from "@/utils/validate";
import { useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";

type FormProps = {
  user1Id: string;
  user2Id: string;
  amount: number;
  currency: string;
  groupId: string;
};

const FormComp = ({
  amount,
  currency,
  groupId,
  user1Id,
  user2Id,
}: FormProps) => {
  const router = useRouter();

  const { loading, execute, fieldErrors } = useAction(createSettlement, {
    onSuccess: ({ expense, userId }) => {
      toast.success("Settlement created successfully");
      router.push(`/groups/${expense?.groupId || ""}`);
      if (expense) {
        NotificationService.createSettlement(userId, expense);
      }
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const [total, setTotal] = useState(amount);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [settlementCurrency, setSettlementCurrency] = useState(currency);

  const currencies = useMemo(() => getCurrencies(), []);

  const onTotalChange = (value: string) => {
    setTotal(() => parseFloat(value || ""));
  };

  const onSubmit = (formData: FormData) => {
    const owes = parseFloat((formData.get("amount") as string) || "");

    execute({
      amount: fixedNum(owes),
      currency: settlementCurrency,
      groupId,
      user1Id,
      user2Id,
    });
  };

  const onCurrencyChange = (c: string) => {
    setSettlementCurrency(() => c);
  };

  const symbol = getCurrencySymbol(settlementCurrency);

  return (
    <form className="flex flex-col gap-4 sm:gap-6" action={onSubmit}>
      <CurrencyCombobox
        label="Currency"
        disabled={loading}
        value={currency}
        open={currencyOpen}
        currencies={currencies}
        setOpen={setCurrencyOpen}
        setValue={onCurrencyChange}
      />
      <FormInput
        id="amount"
        name="amount"
        placeholder="Settlement amount..."
        step={0.01}
        type="number"
        value={total}
        disabled={loading}
        label={`Amount(${symbol})`}
        errors={fieldErrors?.amount}
        onChange={(e) => onTotalChange(e.target.value)}
      />
      <FormSubmit>Settle</FormSubmit>
    </form>
  );
};

export default function Form(props: FormProps) {
  return (
    <Suspense>
      <FormComp {...props} />
    </Suspense>
  );
}
