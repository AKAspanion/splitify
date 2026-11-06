"use client";

import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { GroupCombobox } from "./group-combobox";
import { Suspense, useMemo, useState } from "react";
import { PaymentDrawer } from "./payment-drawer";
import { SplitDrawer } from "./split-drawer";
import { useAuth } from "@/hooks/use-auth";
import { useOnline } from "@/hooks/use-online";
import { toUserMessage } from "@/lib/data/errors";
import {
  normalizeId,
  toUser,
  useCreateExpense,
  useExpenseGroupMembers,
  validateExpense,
  type ExpenseFieldErrors,
  type MyGroup,
} from "@/lib/data/expenses";
import { FormErrors } from "@/components/form/form-errors";
import { ExpenseType } from "@/lib/splitify/model/expense/expense-type";
import { fixedNum } from "@/utils/validate";
import { toast } from "sonner";
import { CategoryCombobox } from "./category-combobox";
import { RUPEE_SYMBOL } from "@/constants/ui";
import type { User } from "@/types/shared";

type FormProps = { groups: MyGroup[] };

// The ticks someone changed in the equal split, with the users they were made for (`usersKey`). The split is derived
// from them while rendering rather than reset in an effect: when the users change, the edits no longer apply.
export type EqualSplitEdits = {
  usersKey: string;
  values: Record<string, boolean>;
} | null;

// Every user ticked, with the edits laid over it while they were made for these same users.
export function equalSplitFor(
  users: User[],
  usersKey: string,
  edits: EqualSplitEdits,
): Record<string, boolean> {
  const everyone = Object.fromEntries(users.map((u) => [u.id, true]));
  return edits?.usersKey === usersKey
    ? { ...everyone, ...edits.values }
    : everyone;
}

// The edits after `values` is ticked or unticked for the current users.
export function withEqualSplitEdit(
  users: User[],
  usersKey: string,
  edits: EqualSplitEdits,
  values: Record<string, boolean>,
): EqualSplitEdits {
  return {
    usersKey,
    values: { ...equalSplitFor(users, usersKey, edits), ...values },
  };
}

const FormComp = ({ groups }: FormProps) => {
  const { user } = useAuth();
  const userId = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsGroupId = searchParams.get("groupId") || "";

  const [groupOpen, setGroupOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [tag, setTag] = useState<string>("expense");
  const [category, setCategory] = useState<string>("general");
  const [splitType, setSplitType] = useState<ExpenseType>(ExpenseType.EQUAL);
  const [payment, setPayment] = useState<Record<string, number>>({});
  const [groupId, setGroupId] = useState(normalizeId(paramsGroupId));

  const online = useOnline();
  const create = useCreateExpense();
  const loading = create.isPending;
  const [fieldErrors, setFieldErrors] = useState<ExpenseFieldErrors>();

  // Not a form action: React would clear what was typed when the action ends, and it has to stay on an error.
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const description = formData.get("description") as string;
    const total = parseFloat((formData.get("amount") as string) || "");

    const payments = Object.entries(payment)
      .map(([key, value]) => ({
        key,
        value,
      }))
      .filter((a) => !!a.value)
      .map(({ key, value }) => {
        return { amount: fixedNum(value), userId: key };
      });

    let splits: { amount: number; percent?: number; userId: string }[] = [];

    if (splitType === ExpenseType.EQUAL) {
      const ids = Object.entries(equalSplit).filter(([_, value]) => value);
      const am = total / ids.length;
      splits = ids.map(([userId]) => ({
        amount: fixedNum(am),
        userId,
      }));
    } else if (splitType === ExpenseType.EXACT) {
      const ids = Object.entries(exactSplit).filter(
        ([_, value]) => !isNaN(value) && value,
      );
      splits = ids.map(([userId, am]) => ({
        amount: fixedNum(am),
        userId,
      }));
    } else if (splitType === ExpenseType.PERCENT) {
      const ids = Object.entries(percentSplit).filter(
        ([_, value]) => !isNaN(value) && value,
      );
      splits = ids.map(([userId, percent]) => ({
        amount: fixedNum((total * percent) / 100),
        percent: fixedNum(percent),
        userId,
      }));
    }

    const errors = validateExpense({
      description,
      amount: total,
      groupId,
      payments,
      splits,
    });
    setFieldErrors(errors ?? undefined);
    if (errors || !userId) return;

    const input = {
      amount: fixedNum(total),
      description,
      payments,
      splits,
      groupId,
      category,
      type: splitType,
    };
    if (!online) {
      // Offline the write waits for the connection, so don't wait for it: it shows in the group as waiting to sync.
      create.mutate(input);
      toast.success("Expense saved. It will sync when you're back online.");
      router.push(`/groups/${groupId}`);
      return;
    }
    try {
      await create.mutateAsync(input);
    } catch {
      return;
    }
    toast.success("Expense created successfully");
    router.push(`/groups/${groupId}`);
  };

  const { data: members } = useExpenseGroupMembers(groupId || null);

  const users = useMemo(() => {
    const gs = (members || []).map(toUser);
    return [
      ...gs.filter((u) => u?.id === userId),
      ...gs.filter((u) => u?.id !== userId),
    ];
  }, [members, userId]);

  const currUserId = useMemo(() => {
    return users?.find((u) => u.id === userId)?.id;
  }, [userId, users]);

  const usersKey = useMemo(() => JSON.stringify(users), [users]);
  const [equalSplitEdits, setEqualSplitEdits] = useState<EqualSplitEdits>(null);
  const equalSplit = equalSplitFor(users, usersKey, equalSplitEdits);
  const [exactSplit, setExactSplit] = useState<Record<string, number>>({});
  const [percentSplit, setPercentSplit] = useState<Record<string, number>>({});

  const onTotalChange = (value: string) => {
    if (currUserId) {
      setTotal(() => parseFloat(value || ""));
      setPayment(() => ({ [currUserId]: parseFloat(value || "") }));
    }
  };

  const onPaymentChange = (id: string, value: string) => {
    setPayment((p) => ({ ...p, [id]: parseFloat(value || "") }));
  };

  const handleEqualSplitChange = (values: Record<string, boolean>) => {
    setEqualSplitEdits((edits) =>
      withEqualSplitEdit(users, usersKey, edits, values),
    );
  };

  const handleExactSplitChange = (values: Record<string, number>) => {
    setExactSplit((p) => ({ ...p, ...values }));
  };

  const handlePercentSplitChange = (values: Record<string, number>) => {
    setPercentSplit((p) => ({ ...p, ...values }));
  };

  const handleSplitTypeChange = (v: ExpenseType) => {
    setSplitType(() => v);
  };

  const onGroupChange = (gid: string) => {
    setGroupId(gid);
    if (currUserId && total) {
      setPayment(() => ({ [currUserId]: total }));
      setEqualSplitEdits(null);
    }
  };

  const onCategoryChange = (c: string) => {
    setCategory(() => c);
  };

  return (
    <form className="flex flex-col gap-4 sm:gap-6" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <GroupCombobox
            disabled={loading}
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
            disabled={loading}
            label="Category"
            open={categoryOpen}
            value={category}
            setOpen={setCategoryOpen}
            setValue={onCategoryChange}
          />
        </div>
        <FormInput
          id="description"
          name="description"
          label="Description"
          placeholder="Enter a description"
          errors={fieldErrors?.description}
          disabled={loading}
        />
        <FormInput
          id="amount"
          name="amount"
          label={`Amount(${RUPEE_SYMBOL})`}
          type="number"
          step={0.01}
          placeholder={"0.00"}
          errors={fieldErrors?.amount}
          disabled={loading}
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
            exactSplit={exactSplit}
            percentSplit={percentSplit}
            splitType={splitType}
            onEqualSplitChange={handleEqualSplitChange}
            onSplitTypeChange={handleSplitTypeChange}
            onExactSplitChange={handleExactSplitChange}
            onPercentSplitChange={handlePercentSplitChange}
          />
        </div>
        <FormErrors id="payments" errors={fieldErrors?.payments} />
        <FormErrors id="splits" errors={fieldErrors?.splits} />
      </div>
      <FormErrors
        id="create-expense"
        errors={create.error ? [toUserMessage(create.error)] : undefined}
      />
      <div className="flex justify-end items-center">
        <Button type="submit" loading={loading} disabled={loading}>
          Add
        </Button>
      </div>
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
