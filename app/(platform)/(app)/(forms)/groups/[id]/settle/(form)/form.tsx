"use client";
import { FormErrors } from "@/components/form/form-errors";
import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { RUPEE_SYMBOL } from "@/constants/ui";
import { toUserMessage } from "@/lib/data/errors";
import { useCreateSettlement } from "@/lib/data/expenses";
import { fixedNum } from "@/utils/validate";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type FormProps = {
  user1Id: string;
  user2Id: string;
  amount: number;
  groupId: string;
};

const Form = ({ amount, groupId, user1Id, user2Id }: FormProps) => {
  const router = useRouter();
  const settle = useCreateSettlement();
  const [total, setTotal] = useState(amount);
  const [amountError, setAmountError] = useState<string[] | undefined>();

  const onTotalChange = (value: string) => {
    setTotal(() => parseFloat(value || ""));
  };

  // Not a form action: React would clear what was typed when the action ends, and it has to stay on an error.
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const owes = fixedNum(total);
    if (!owes || isNaN(owes) || owes <= 0) {
      setAmountError(["Please enter an amount"]);
      return;
    }
    setAmountError(undefined);
    try {
      await settle.mutateAsync({
        amount: owes,
        groupId,
        fromUserId: user1Id,
        toUserId: user2Id,
      });
    } catch {
      return;
    }
    toast.success("Settlement created successfully");
    router.push(`/groups/${groupId}`);
  };

  return (
    <form className="flex flex-col gap-4 sm:gap-6" onSubmit={onSubmit}>
      <FormInput
        id="amount"
        name="amount"
        placeholder="Settlement amount..."
        step={0.01}
        type="number"
        value={Number.isNaN(total) ? "" : total}
        disabled={settle.isPending}
        label={`Amount(${RUPEE_SYMBOL})`}
        errors={amountError}
        onChange={(e) => onTotalChange(e.target.value)}
      />
      <FormErrors
        id="settle"
        errors={settle.error ? [toUserMessage(settle.error)] : undefined}
      />
      <div className="flex justify-end items-center">
        <Button
          type="submit"
          loading={settle.isPending}
          disabled={settle.isPending}
        >
          Settle
        </Button>
      </div>
    </form>
  );
};

export default Form;
