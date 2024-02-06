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
      // console.log("data", data);
      router.push(`/groups/${data.id}`);
    },
    onError: (error) => {
      // console.log("error", error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;

    execute({ title, type });
  };

  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <div className="flex flex-col gap-4">
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
