"use client";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateContact } from "@/actions/update-contact";

const Form = ({
  backTo,
  id,
  name: nameProp,
  mail: mailProp,
}: {
  backTo: string;
  id: string;
  mail?: string;
  name?: string;
}) => {
  const router = useRouter();
  const { execute, fieldErrors } = useAction(updateContact, {
    onSuccess: ({ user }) => {
      toast.success("Contact updated successfully");
      router.push(backTo);
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const onSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    execute({ id, name, email });
  };

  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <FormInput
          label="Name"
          id="name"
          name="name"
          defaultValue={nameProp}
          placeholder="Enter name"
          errors={fieldErrors?.name}
        />
        <FormInput
          label="Email"
          id="email"
          name="email"
          defaultValue={mailProp}
          placeholder="Enter an email"
          errors={fieldErrors?.email}
        />
      </div>
      <FormSubmit>Update</FormSubmit>
    </form>
  );
};

export default Form;
