"use client";

import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createContact } from "@/actions/create-contact";
import { urlEncode } from "@/utils/func";

const Form = ({
  groupId,
  backTo,
  mail,
}: {
  groupId?: string;
  backTo?: string;
  mail?: string;
}) => {
  const router = useRouter();
  const { execute, fieldErrors } = useAction(createContact, {
    onSuccess: ({ user }) => {
      const to = urlEncode({
        path: "/friends/add",
        query: {
          groupId: groupId || "",
          back: backTo || "",
          email: user.email,
        },
      });

      router.push(to);
      toast.success("Contact added successfully");
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const onSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    execute({ name, email });
  };

  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <FormInput
          label="Name"
          id="name"
          name="name"
          placeholder="Enter name"
          errors={fieldErrors?.name}
        />
        <FormInput
          label="Email"
          id="email"
          name="email"
          defaultValue={mail}
          placeholder="Enter an email"
          errors={fieldErrors?.email}
        />
      </div>
      <div className="text-sm">
        Contact added here is synced up after your friend signs up with the same
        email id. Make sure you are using the correct email id.
      </div>
      <FormSubmit>Add</FormSubmit>
    </form>
  );
};

export default Form;
