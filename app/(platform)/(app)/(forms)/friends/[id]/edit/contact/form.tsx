"use client";

import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { OnlineOnly } from "@/components/offline/online-only";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/data/errors";
import {
  useUpdateContact,
  validateContact,
  type ContactFieldErrors,
} from "@/lib/data/people";

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
  const [name, setName] = useState(nameProp || "");
  const [email, setEmail] = useState(mailProp || "");
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const { mutate, isPending } = useUpdateContact();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const check = validateContact({ name, email });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});

    mutate(
      { id, ...check.value },
      {
        onSuccess: () => {
          toast.success("Contact updated successfully");
          router.push(backTo);
        },
        // What was typed stays in the fields.
        onError: (error) => toast.error(toUserMessage(error)),
      },
    );
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <FormInput
          label="Name"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          placeholder="Enter name"
          errors={errors.name ? [errors.name] : undefined}
        />
        <FormInput
          label="Email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          placeholder="Enter an email"
          errors={errors.email ? [errors.email] : undefined}
        />
      </div>
      <div className="flex flex-col items-end">
        <OnlineOnly>
          {(offline) => (
            <Button
              type="submit"
              loading={isPending}
              disabled={isPending || offline}
            >
              Update
            </Button>
          )}
        </OnlineOnly>
      </div>
    </form>
  );
};

export default Form;
