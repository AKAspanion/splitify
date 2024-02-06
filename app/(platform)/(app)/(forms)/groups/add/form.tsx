"use client";

import { createGroup } from "@/actions/create-group";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { useRouter } from "next/navigation";

export const Form = () => {
  const router = useRouter();
  const { execute, fieldErrors } = useAction(createGroup, {
    onSuccess: (data) => {
      router.push(`/groups/${data.id}`);
    },
    onError: () => {},
  });

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;

    execute({ title, type });
  };

  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <FormInput
          label="Group name"
          id="title"
          name="title"
          errors={fieldErrors?.title}
        />
        <FormInput
          id="type"
          name="type"
          label="Type"
          errors={fieldErrors?.type}
        />
      </div>
      <FormSubmit>Create</FormSubmit>
    </form>
  );
};
