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
import { useUser } from "@clerk/nextjs";
import { FormErrors } from "@/components/form/form-errors";
import { ExpenseType } from "@prisma/client";
import { convertToObject, fixedNum } from "@/utils/validate";
import { toast } from "sonner";
import { CategoryCombobox } from "./category-combobox";
import { GroupWIthUsers } from "@/types/shared";
import { NotificationService } from "@/lib/notification/service";
import { CurrencyCombobox } from "../../../../_components/currency-combobox";
import { getCurrencies, getCurrencySymbol } from "@/utils/currency";

type FormProps = { groups: GroupWIthUsers[] };

const FormComp = ({ groups }: FormProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsGroupId = searchParams.get("groupId") || "";

  const currGroup = groups?.find((g) => g.id === paramsGroupId);

  const [groupOpen, setGroupOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [tag, setTag] = useState<string>("expense");
  const [category, setCategory] = useState<string>("general");
  const [splitType, setSplitType] = useState<ExpenseType>("EQUAL");
  const [payment, setPayment] = useState<Record<string, number>>({});
  const [groupId, setGroupId] = useState(paramsGroupId.toString());
  const [currency, setCurrency] = useState(currGroup?.currency || "inr");

  const { loading, execute, fieldErrors } = useAction(createExpense, {
    onSuccess: ({ expense, userId }) => {
      toast.success("Expense created successfully");
      router.push(`/groups/${expense?.groupId || ""}`);
      NotificationService.createExpense(userId, expense);
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
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

    let splits: { type: ExpenseType; amount: number; userId: string }[] = [];

    if (splitType === ExpenseType.EQUAL) {
      const ids = Object.entries(equalSplit).filter(([_, value]) => value);
      const am = total / ids.length;
      splits = ids.map(([userId]) => ({
        type: ExpenseType.EQUAL,
        amount: fixedNum(am),
        userId,
      }));
    } else if (splitType === ExpenseType.EXACT) {
      const ids = Object.entries(exactSplit).filter(
        ([_, value]) => !isNaN(value) && value,
      );
      splits = ids.map(([userId, am]) => ({
        type: ExpenseType.EXACT,
        amount: fixedNum(am),
        userId,
      }));
    } else if (splitType === ExpenseType.PERCENT) {
      const ids = Object.entries(percentSplit).filter(
        ([_, value]) => !isNaN(value) && value,
      );
      splits = ids.map(([userId, percent]) => ({
        type: ExpenseType.PERCENT,
        amount: fixedNum((total * percent) / 100),
        percent: fixedNum(percent),
        userId,
      }));
    }

    if (user?.id) {
      execute({
        amount: fixedNum(total),
        description,
        payments,
        splits,
        groupId,
        category,
        currency,
        createrId: user?.id,
        type: splitType,
      });
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
  const [exactSplit, setExactSplit] = useState<Record<string, number>>({});
  const [percentSplit, setPercentSplit] = useState<Record<string, number>>({});

  const currencies = useMemo(() => getCurrencies(), []);

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
    setEqualSplit((p) => ({ ...p, ...values }));
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
    setCurrency(groups.find((g) => g.id === gid)?.currency || "inr");
    if (currUserId && total) {
      setPayment(() => ({ [currUserId]: total }));
      setEqualSplit(() => convertToObject(users || [], "id", true));
    }
  };

  const onCategoryChange = (c: string) => {
    setCategory(() => c);
  };

  const onCurrencyChange = (c: string) => {
    setCurrency(() => c);
  };

  const effectUsers = useMemo(() => JSON.stringify(users), [users]);

  useEffect(() => {
    setEqualSplit(() => convertToObject(users || [], "id", true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectUsers]);

  const symbol = getCurrencySymbol(currency);

  return (
    <form className="flex flex-col gap-4 sm:gap-6" action={onSubmit}>
      <div>
        <CurrencyCombobox
          label="Currency"
          disabled={loading}
          value={currency}
          open={currencyOpen}
          currencies={currencies}
          setOpen={setCurrencyOpen}
          setValue={onCurrencyChange}
        />
      </div>
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
          <FormErrors id="group" errors={fieldErrors?.category} />
        </div>
        <FormInput
          id="description"
          name="description"
          label="Description"
          placeholder="Enter a description"
          errors={fieldErrors?.description}
        />
        <FormInput
          id="amount"
          name="amount"
          label={`Amount (${symbol}) `}
          type="number"
          step={0.01}
          placeholder={"0.00"}
          errors={fieldErrors?.amount}
          onChange={(e) => onTotalChange(e.target.value)}
        />
      </div>
      <div>
        <div className="flex gap-2 justify-between items-center">
          <PaymentDrawer
            symbol={symbol}
            users={users}
            total={total}
            payment={payment}
            disabled={loading}
            currUserId={currUserId}
            onChange={onPaymentChange}
          />
          <div className="pt-1">and</div>
          <SplitDrawer
            symbol={symbol}
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
      <FormSubmit>Add</FormSubmit>
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
