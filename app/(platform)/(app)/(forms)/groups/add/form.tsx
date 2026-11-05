"use client";

import { FormInput } from "@/components/form/form-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GROUP_CATEGORY_ICONS, GROUP_TYPES, GroupType } from "@/constants/ui";
import { toUserMessage } from "@/lib/data/errors";
import { useCreateGroup } from "@/lib/data/groups";
import { Label } from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type FieldErrors = { title?: string[]; description?: string[] };

const validate = (title: string, description: string): FieldErrors => {
  const errors: FieldErrors = {};
  if (title.trim().length < 3) errors.title = ["Minimum 3 chars required"];
  else if (title.length > 100) errors.title = ["Maximum 100 chars allowed"];
  if (description.length > 500)
    errors.description = ["Maximum 500 chars allowed"];
  return errors;
};

const Form = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GroupType | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { mutate, isPending } = useCreateGroup();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validate(title, description);
    setFieldErrors(errors);
    if (errors.title || errors.description) return;

    // What was typed stays in the fields if the write fails.
    mutate(
      { title: title.trim(), description: description.trim(), type },
      {
        onSuccess: ({ id }) => {
          router.push(`/groups/${id}`);
          toast.success("Group created successfully");
        },
        onError: (error) => toast.error(toUserMessage(error)),
      },
    );
  };

  const handleTypeChange = (t: GroupType) => {
    setType((s) => (s === t ? undefined : t));
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <FormInput
          label="Group name"
          id="title"
          name="title"
          placeholder="Enter a group name"
          errors={fieldErrors.title}
          value={title}
          disabled={isPending}
          onChange={(e) => setTitle(e.target.value)}
        />
        <FormInput
          label="Description"
          id="description"
          name="description"
          placeholder="Enter a description"
          errors={fieldErrors.description}
          value={description}
          disabled={isPending}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <Label className="text-sm font-semi-bold text-neutral-700 dark:text-neutral-50">
            {"Type"}
          </Label>
          <div className="w-full flex flex-wrap gap-3 items-center pt-3">
            {GROUP_TYPES.map((b) => {
              const GroupIcon = GROUP_CATEGORY_ICONS[b];
              return (
                <Badge
                  key={b}
                  className="cursor-pointer capitalize flex gap-2 items-center"
                  variant={b === type ? "default" : "outline"}
                  onClick={() => handleTypeChange(b)}
                >
                  <GroupIcon className={"w-4 h-4"} />
                  {b}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex justify-end items-center">
        <Button type="submit" loading={isPending} disabled={isPending}>
          Create
        </Button>
      </div>
    </form>
  );
};

export default Form;
