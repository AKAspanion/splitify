"use client";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useParams, useSearchParams } from "next/navigation";
import { GroupCombobox } from "./group-combobox";
import { useState } from "react";
import { Group } from "@prisma/client";
import { useAction } from "@/hooks/use-action";
import { createExpense } from "@/actions/create-expense";

type FormProps = { groups: Group[] };

export const Form = ({ groups }: FormProps) => {
  const params = useSearchParams();
  const groupId = params.get("groupId") || "";

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(groupId.toString());
  //   const router = useRouter();
  const { execute, fieldErrors } = useAction(createExpense, {
    onSuccess: (data) => {
      // router.push(`/groups/${data.id}`);
      console.log(data);
    },
    onError: () => {},
  });

  const onSubmit = (formData: FormData) => {
    const description = formData.get("description") as string;
    const amount = parseInt(formData.get("amount") as string);
    execute({ description, amount });
  };

  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <GroupCombobox
        label="Group name"
        value={value}
        open={open}
        groups={groups}
        setValue={setValue}
        setOpen={setOpen}
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
        />
      </div>
      <FormSubmit>Create</FormSubmit>
    </form>
  );
};
