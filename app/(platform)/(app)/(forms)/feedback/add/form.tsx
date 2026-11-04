"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormErrors } from "@/components/form/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toUserMessage } from "@/lib/data/errors";
import {
  FEEDBACK_DESCRIPTION_MAX,
  FEEDBACK_TITLE_MAX,
  useSendFeedback,
} from "@/lib/data/feedback";

type FieldErrors = { title?: string[]; description?: string[] };

const validate = (title: string, description: string): FieldErrors => {
  const errors: FieldErrors = {};
  if (title.length < 3) errors.title = ["Minimum 3 chars required"];
  else if (title.length > FEEDBACK_TITLE_MAX)
    errors.title = [`Title can be at most ${FEEDBACK_TITLE_MAX} characters`];
  if (description.length > FEEDBACK_DESCRIPTION_MAX)
    errors.description = [
      `Description can be at most ${FEEDBACK_DESCRIPTION_MAX} characters`,
    ];
  return errors;
};

const Form = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { mutate, isPending } = useSendFeedback();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const errors = validate(trimmedTitle, description);
    setFieldErrors(errors);
    if (errors.title || errors.description) return;

    mutate(
      { title: trimmedTitle, description },
      {
        onSuccess: () => toast.success("Feedback sent successfully"),
        // What was typed stays in the form, so a failed send can be tried again.
        onError: (error) => toast.error(toUserMessage(error)),
      },
    );
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="w-full">
          <Label
            htmlFor="title"
            className="text-sm font-semi-bold text-neutral-700 dark:text-neutral-50"
          >
            Title
          </Label>
          <div className="mt-1 w-full">
            <Input
              id="title"
              name="title"
              placeholder="Feedback title"
              value={title}
              disabled={isPending}
              onChange={(e) => setTitle(e.target.value)}
              aria-describedby="title-error"
            />
            <FormErrors id="title" errors={fieldErrors.title} />
          </div>
        </div>
        <div className="w-full">
          <Label
            htmlFor="description"
            className="text-sm font-semi-bold text-neutral-700 dark:text-neutral-50"
          >
            Description
          </Label>
          <div className="mt-1 w-full">
            <Input
              id="description"
              name="description"
              placeholder="Feedback description"
              value={description}
              disabled={isPending}
              onChange={(e) => setDescription(e.target.value)}
              aria-describedby="description-error"
            />
            <FormErrors id="description" errors={fieldErrors.description} />
          </div>
        </div>
      </div>
      <div className="flex justify-end items-center">
        <Button type="submit" loading={isPending} disabled={isPending}>
          Send
        </Button>
      </div>
    </form>
  );
};

export default Form;
