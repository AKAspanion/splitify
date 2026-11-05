"use client";

import { FormErrors } from "@/components/form/form-errors";
import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/data/errors";
import { useUpdateExpense } from "@/lib/data/expenses";

type FormProps = { id: string; description: string; groupId: string };

const Form = ({ id, description, groupId }: FormProps) => {
  const router = useRouter();
  const update = useUpdateExpense();
  const [fieldError, setFieldError] = useState<string[] | undefined>();

  // Not a form action: React would clear what was typed when the action ends, and it has to stay on an error.
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = (
      new FormData(event.currentTarget).get("description") as string
    ).trim();
    if (text.length < 3) {
      setFieldError(["Minimum 3 chars required"]);
      return;
    }
    setFieldError(undefined);
    try {
      await update.mutateAsync({ id, description: text, groupId });
    } catch {
      return;
    }
    toast.success("Expense updated successfully");
    router.push(`/groups/${groupId}/expense/${id}`);
  };

  return (
    <form className="flex flex-col gap-4 sm:gap-6" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <FormInput
          id="description"
          name="description"
          label="Description"
          placeholder="Enter a description"
          errors={fieldError}
          defaultValue={description || ""}
          disabled={update.isPending}
        />
      </div>
      <FormErrors
        id="update-expense"
        errors={update.error ? [toUserMessage(update.error)] : undefined}
      />
      <div className="flex justify-end items-center">
        <Button
          type="submit"
          loading={update.isPending}
          disabled={update.isPending}
        >
          Update
        </Button>
      </div>
    </form>
  );
};

export default Form;
