"use client";

import { FormErrors } from "@/components/form/form-errors";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { toast } from "sonner";
import { createFeedback } from "@/actions/create-feedback";

const Form = () => {
  const { execute, fieldErrors } = useAction(createFeedback, {
    onSuccess: () => {
      toast.success("Feedback sent successfully");
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const onSubmit = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    execute({ title, description });
  };
  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <FormInput
          label="Title"
          id="title"
          name="title"
          placeholder="Feedback title"
          errors={fieldErrors?.title}
        />
        <FormInput
          label="Description"
          id="escription"
          name="description"
          placeholder="Feedback description"
          errors={fieldErrors?.description}
        />
      </div>
      <FormSubmit>Send</FormSubmit>
    </form>
  );
};

export default Form;
