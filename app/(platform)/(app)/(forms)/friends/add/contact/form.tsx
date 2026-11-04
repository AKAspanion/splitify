"use client";

import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/data/errors";
import {
  normaliseEmail,
  peopleHref,
  useCreateContact,
  validateContact,
  type ContactFieldErrors,
} from "@/lib/data/people";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mail || "");
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const { mutate, isPending } = useCreateContact();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const check = validateContact({ name, email });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});

    mutate(check.value, {
      onSuccess: () => {
        router.push(
          peopleHref("/friends/add", {
            groupId,
            back: backTo,
            email: normaliseEmail(check.value.email),
          }),
        );
        toast.success("Contact added successfully");
      },
      // What was typed stays in the fields.
      onError: (error) => toast.error(toUserMessage(error)),
    });
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <FormInput
          label="Name"
          id="name"
          name="name"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          errors={errors.name ? [errors.name] : undefined}
        />
        <FormInput
          label="Email"
          id="email"
          name="email"
          placeholder="Enter an email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          errors={errors.email ? [errors.email] : undefined}
        />
      </div>
      <div className="text-sm">
        Contact added here is synced up after your friend signs up with the same
        email id. Make sure you are using the correct email id.
      </div>
      <div className="flex justify-end items-center">
        <Button type="submit" loading={isPending} disabled={isPending}>
          Add
        </Button>
      </div>
    </form>
  );
};

export default Form;
