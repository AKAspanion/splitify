"use client";
import { createSettlement } from "@/actions/create-settlement";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { RUPPEE_SYMBOL } from "@/constants/ui";
import { useAction } from "@/hooks/use-action";
import { NotificationService } from "@/lib/notification/service";
import { fixedNum } from "@/utils/validate";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

type FormProps = {
  user1Id: string;
  user2Id: string;
  amount: number;
  groupId: string;
};

const FormComp = ({ amount, groupId, user1Id, user2Id }: FormProps) => {
  const router = useRouter();

  const { loading, execute, fieldErrors } = useAction(createSettlement, {
    onSuccess: ({ expense, userId }) => {
      toast.success("Settlement created successfully");
      router.push(`/groups/${expense?.groupId || ""}`);
      if (expense) {
        NotificationService.createExpense(userId, expense);
      }
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const [total, setTotal] = useState(amount);

  const onTotalChange = (value: string) => {
    setTotal(() => parseFloat(value || ""));
  };

  const onSubmit = (formData: FormData) => {
    const owes = parseFloat((formData.get("amount") as string) || "");

    execute({ amount: fixedNum(owes), groupId, user1Id, user2Id });
  };

  return (
    <form className="flex flex-col gap-4 sm:gap-6" action={onSubmit}>
      <FormInput
        id="amount"
        name="amount"
        placeholder="Settlement amount..."
        step={0.01}
        type="number"
        value={total}
        disabled={loading}
        label={`Amount(${RUPPEE_SYMBOL})`}
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
