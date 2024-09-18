"use client";

import { createGroup } from "@/actions/create-group";
import { FormErrors } from "@/components/form/form-errors";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { Badge } from "@/components/ui/badge";
import { NotificationService } from "@/lib/notification/service";
import { GROUP_CATEGORY_ICONS, GROUP_TYPES, GroupType } from "@/constants/ui";
import { useAction } from "@/hooks/use-action";
import { randomNumber } from "@/utils/func";
import { Label } from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CurrencyCombobox } from "../../../_components/currency-combobox";
import { getCurrencies } from "@/utils/currency";

const Form = () => {
  const router = useRouter();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const [currency, setCurrency] = useState("inr");
  const [type, setType] = useState<GroupType | undefined>(undefined);
  const { execute, fieldErrors } = useAction(createGroup, {
    onSuccess: ({ group, userId }) => {
      router.push(`/groups/${group.id}`);
      toast.success("Group created successfully");
      NotificationService.createGroup(userId, group.id);
    },
    onError: (error, debug) => {
      console.error(debug);
      toast.error(error);
    },
  });

  const currencies = useMemo(() => getCurrencies(), []);

  const onSubmit = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    const imageId = randomNumber(1, 20);
    let image_url = `/images/placeholder/groups/${imageId}.png`;

    execute({ title, type, currency, image_url, description });
  };

  const handleTypeChange = (t: GroupType) => {
    setType((s) => (s === t ? undefined : t));
  };

  const onCurrencyChange = (c: string) => {
    setCurrency(() => c);
  };

  return (
    <form className="flex flex-col gap-6" action={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <CurrencyCombobox
          label="Currency"
          value={currency}
          open={currencyOpen}
          currencies={currencies}
          setOpen={setCurrencyOpen}
          setValue={onCurrencyChange}
        />
        <FormInput
          label="Group name"
          id="title"
          name="title"
          placeholder="Enter a group name"
          errors={fieldErrors?.title}
        />
        <FormInput
          label="Description"
          id="description"
          name="description"
          placeholder="Enter a description"
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
      <FormSubmit>Create</FormSubmit>
    </form>
  );
};

export default Form;
