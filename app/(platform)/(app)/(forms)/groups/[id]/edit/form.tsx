"use client";

import { FormErrors } from "@/components/form/form-errors";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { Badge } from "@/components/ui/badge";
import { NotificationService } from "@/lib/notification/service";
import { GROUP_CATEGORY_ICONS, GROUP_TYPES, GroupType } from "@/constants/ui";
import { useAction } from "@/hooks/use-action";
import { Label } from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateGroup } from "@/actions/update-group";

type FormProps = {
  id: string;
  title: string;
  type?: string | null;
  description?: string | null;
};

const Form = ({
  id,
  type: typeProp,
  title: titleProp,
  description: descriptionProp,
}: FormProps) => {
  const router = useRouter();
  // const [title, setTitle] = useState(titleProp);
  // const [description, setDescription] = useState(descriptionProp || "");
  const [type, setType] = useState<GroupType | undefined>(
    typeProp as GroupType,
  );

  const { execute, fieldErrors } = useAction(updateGroup, {
    onSuccess: ({ group, userId }) => {
      router.push(`/groups/${group.id}`);
      toast.success("Group updated successfully");
      NotificationService.updateGroup(userId, group.id);
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const onSubmit = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    execute({ title, type, description, groupId: id });
  };

  const handleTypeChange = (t: GroupType) => {
    setType((s) => (s === t ? undefined : t));
  };

  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <FormInput
          label="Group name"
          id="title"
          name="title"
          placeholder="Enter a group name"
          errors={fieldErrors?.title}
          defaultValue={titleProp}
        />
        <FormInput
          label="Description"
          id="escription"
          name="description"
          placeholder="Enter a description"
          defaultValue={descriptionProp || ""}
          errors={fieldErrors?.description}
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
        <FormErrors errors={fieldErrors?.type} />
      </div>
      <FormSubmit>Update</FormSubmit>
    </form>
  );
};

export default Form;
