"use client";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useRouter, useSearchParams } from "next/navigation";
import { GroupCombobox } from "./group-combobox";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAction } from "@/hooks/use-action";
import { createExpense } from "@/actions/create-expense";
import { PaymentDrawer } from "./payment-drawer";
import { SplitDrawer } from "./split-drawer";
import { GroupWIthUsers } from "./type";
import { useUser } from "@clerk/nextjs";
import { FormErrors } from "@/components/form/form-errors";
import { ExpenseType } from "@prisma/client";
import { convertToObject, fixedNum } from "@/utils/validate";
import { toast } from "sonner";
import { CategoryCombobox } from "./category-combobox";

type FormProps = { groups: GroupWIthUsers[] };

const FormComp = ({ groups }: FormProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsGroupId = searchParams.get("groupId") || "";

  const [groupOpen, setGroupOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [category, setCategory] = useState<string>("");
  const [splitType, setSplitType] = useState<ExpenseType>("EQUAL");
  const [payment, setPayment] = useState<Record<string, number>>({});
  const [groupId, setGroupId] = useState(paramsGroupId.toString());

  const { loading, execute, fieldErrors } = useAction(createExpense, {
    onSuccess: (data) => {
      router.push(`/groups/${data?.groupId || ""}`);
      toast.success("Expense created successfully");
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const description = formData.get("description") as string;
    const total = parseFloat((formData.get("amount") as string) || "0");

    const payments = Object.entries(payment)
      .map(([key, value]) => ({
        key,
        value,
      }))
      .filter((a) => !!a.value)
      .map(({ key, value }) => {
        return { amount: fixedNum(value), userId: key };
      });

    let splits: { type: ExpenseType; amount: number; userId: string }[] = [];

    if (splitType === ExpenseType.EQUAL) {
      const ids = Object.entries(equalSplit).filter(([_, value]) => value);
      const am = total / ids.length;
      splits = ids.map(([userId]) => ({
        type: ExpenseType.EQUAL,
        amount: fixedNum(am),
        userId,
      }));
      if (user?.id) {
        execute({
          amount: fixedNum(total),
          description,
          payments,
          splits,
          groupId,
          createrId: user?.id,
          type: splitType,
        });
      }
    }
  };

  const users = useMemo(() => {
    const gs = groups?.find((g) => g.id === groupId)?.users || [];
    return [
      ...gs.filter((u) => u?.id === user?.id),
      ...gs.filter((u) => u?.id !== user?.id),
    ];
  }, [groups, groupId, user?.id]);

  const currUserId = useMemo(() => {
    return users?.find((u) => u.id === user?.id)?.id;
  }, [user?.id, users]);

  const [equalSplit, setEqualSplit] = useState<Record<string, boolean>>({});

  const onTotalChange = (value: string) => {
    if (currUserId) {
      setTotal(() => parseFloat(value || "0"));
      setPayment(() => ({ [currUserId]: parseFloat(value || "0") }));
      setEqualSplit(() => convertToObject(users || [], "id", true));
    }
  };

  const onPaymentChange = (id: string, value: string) => {
    setPayment((p) => ({ ...p, [id]: parseFloat(value || "0") }));
  };

  const handleEqualSplitChange = (values: Record<string, boolean>) => {
    setEqualSplit((p) => ({ ...p, ...values }));
  };

  const handleSplitTypeChange = (v: ExpenseType) => {
    setSplitType(() => v);
  };

  const onGroupChange = (gid: string) => {
    setGroupId(gid);
    if (currUserId && total) {
      setPayment(() => ({ [currUserId]: total }));
      setEqualSplit(() => convertToObject(users || [], "id", true));
    }
  };

  const onCategoryChange = (c: string) => {
    setCategory(() => c);
  };

  const effectUsers = useMemo(() => JSON.stringify(users), [users]);

  useEffect(() => {
    setEqualSplit(() => convertToObject(users || [], "id", true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectUsers]);

  return (
    <form className="flex flex-col gap-4 sm:gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <GroupCombobox
            label="Group name"
            open={groupOpen}
            groups={groups}
            value={groupId}
            setOpen={setGroupOpen}
            setValue={onGroupChange}
          />
          <FormErrors id="group" errors={fieldErrors?.groupId} />
        </div>
        <div>
          <CategoryCombobox
            label="Category"
            open={categoryOpen}
            value={category}
            setOpen={setCategoryOpen}
            setValue={onCategoryChange}
          />
          <FormErrors id="group" errors={fieldErrors?.category} />
        </div>
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
            disabled={loading}
            currUserId={currUserId}
            onChange={onPaymentChange}
          />
          <div className="pt-1">and</div>
          <SplitDrawer
            users={users}
            total={total}
            disabled={loading}
            currUserId={currUserId}
            equalSplit={equalSplit}
            splitType={splitType}
            onEqualSplitChange={handleEqualSplitChange}
            onSplitTypeChange={handleSplitTypeChange}
          />
        </div>
        <FormErrors id="payments" errors={fieldErrors?.payments} />
      </div>
      <FormSubmit>Add</FormSubmit>
    </form>
  );
};

export function Form(props: FormProps) {
  return (
    <Suspense>
      <FormComp {...props} />
    </Suspense>
  );
}
