"use client";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAction } from "@/hooks/use-action";
import { toast } from "sonner";
import { NotificationService } from "@/lib/notification/service";
import { updateExpense } from "@/actions/update-expense";

type FormProps = { id: string; description: string };

const FormComp = ({ id, description }: FormProps) => {
  const router = useRouter();

  const { loading, execute, fieldErrors } = useAction(updateExpense, {
    onSuccess: ({ expense, userId }) => {
      toast.success("Expense updated successfully");
      router.push(
        `/groups/${expense?.groupId || ""}/expense/${expense?.id || ""}`,
      );
      NotificationService.updateExpense(userId, expense);
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const description = formData.get("description") as string;

    execute({ id, description });
  };

  return (
    <form className="flex flex-col gap-4 sm:gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <FormInput
          id="description"
          name="description"
          label="Description"
          placeholder="Enter a description"
          errors={fieldErrors?.description}
          defaultValue={description || ""}
          disabled={loading}
        />
      </div>
      <FormSubmit>Update</FormSubmit>
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
