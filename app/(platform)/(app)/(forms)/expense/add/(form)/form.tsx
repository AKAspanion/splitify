"use client";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useSearchParams } from "next/navigation";
import { GroupCombobox } from "./group-combobox";
import { useMemo, useState } from "react";
import { useAction } from "@/hooks/use-action";
import { createExpense } from "@/actions/create-expense";
import { PaymentDrawer } from "./payment-drawer";
import { SplitDrawer } from "./split-drawer";
import { GroupWIthUsers } from "./type";
import { useUser } from "@clerk/nextjs";
import { FormErrors } from "@/components/form/form-errors";
import { ExpenseType } from "@prisma/client";

type FormProps = { groups: GroupWIthUsers[] };

export const Form = ({ groups }: FormProps) => {
  const { user } = useUser();
  const params = useSearchParams();
  const groupId = params.get("groupId") || "";

  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [payment, setPayment] = useState<Record<string, number>>({});
  const [split, setSplit] = useState<
    Record<ExpenseType, Record<string, number>>
  >({ EQUAL: {}, EXACT: {}, PERCENT: {} });
  const [selectedGroupId, setSelectedGroupId] = useState(groupId.toString());

  const { execute, fieldErrors } = useAction(createExpense, {
    onSuccess: (data) => {
      // router.push(`/groups/${data.id}`);
      // console.log(data);
    },
    onError: (error) => {
      // console.log(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const description = formData.get("description") as string;
    const amount = parseFloat((formData.get("amount") as string) || "0");

    const payers = Object.entries(payment)
      .map(([key, value]) => ({
        key,
        value,
      }))
      .filter((a) => !!a.value)
      .map(({ key, value }) => {
        return { amount: value, userId: key };
      });
    execute({ description, amount, payers, splits: [] });
  };

  const users = useMemo(() => {
    const gs = groups?.find((g) => g.id === selectedGroupId)?.users || [];
    return [
      ...gs.filter((u) => u?.clerk_id === user?.id),
      ...gs.filter((u) => u?.clerk_id !== user?.id),
    ];
  }, [groups, selectedGroupId, user?.id]);

  const currUserId = useMemo(() => {
    return users?.find((u) => u.clerk_id === user?.id)?.id;
  }, [user?.id, users]);

  const onTotalChange = (value: string) => {
    if (currUserId) {
      setTotal(() => parseFloat(value || "0"));
      setPayment((p) => ({ ...p, [currUserId]: parseFloat(value || "0") }));
    }
  };

  const onPaymentChange = (id: string, value: string) => {
    setPayment((p) => ({ ...p, [id]: parseFloat(value || "0") }));
  };

  const onSplitChange = (type: ExpenseType, values: Record<string, number>) => {
    setSplit((p) => ({ ...p, [type]: { ...p[type], ...values } }));
  };

  const onGroupChange = (gid: string) => {
    setSelectedGroupId(gid);
    if (currUserId && total) {
      setPayment((p) => ({ [currUserId]: total }));
    }
  };

  return (
    <form className="flex flex-col gap-4 sm:gap-6" action={onSubmit}>
      <GroupCombobox
        label="Group name"
        open={open}
        groups={groups}
        value={selectedGroupId}
        setOpen={setOpen}
        setValue={onGroupChange}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <FormInput
          id="description"
          name="description"
          label="Description"
          errors={fieldErrors?.description}
        />
        <FormInput
          id="amount"
          name="amount"
          label="Amount (₹)"
          type="number"
          errors={fieldErrors?.amount}
          onChange={(e) => onTotalChange(e.target.value)}
        />
      </div>
      <div>
        <div className="flex gap-2 justify-between items-center">
          <PaymentDrawer
            users={users}
            total={total}
            payment={payment}
            currUserId={currUserId}
            onChange={onPaymentChange}
          />
          <div className="pt-1">and</div>
          <SplitDrawer
            users={users}
            total={total}
            split={split}
            currUserId={currUserId}
            onChange={onSplitChange}
          />
        </div>
        <FormErrors id="payers" errors={fieldErrors?.payers} />
      </div>
      <FormSubmit>Create</FormSubmit>
    </form>
  );
};
