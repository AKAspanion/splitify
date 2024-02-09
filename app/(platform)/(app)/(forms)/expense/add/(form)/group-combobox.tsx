"use client";

import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Group } from "@prisma/client";
import { Label } from "@radix-ui/react-dropdown-menu";
import { GroupWIthUsers } from "./type";

type GroupComboboxProps = {
  label?: string;
  value: string;
  open?: boolean;
  disabled?: boolean;
  groups?: GroupWIthUsers[];
  setOpen?: (open: boolean) => void;
  setValue: (value: string) => void;
};

export function GroupCombobox(props: GroupComboboxProps) {
  const {
    label,
    value,
    open,
    disabled,
    groups = [],
    setOpen,
    setValue,
  } = props;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div>
        {label ? (
          <Label className="mb-1 text-sm font-semi-bold text-neutral-700 dark:text-neutral-50">
            {label}
          </Label>
        ) : null}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? groups.find((group) => group.id === value)?.title
              : "Select group..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="p-0" side="bottom" align="end">
        <Command>
          {/* <CommandInput placeholder="Search group..." /> */}
          <CommandEmpty>No group found.</CommandEmpty>
          <CommandGroup>
            {groups.map((group) => (
              <CommandItem
                key={group.id}
                value={group.id}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue);
                  setOpen && setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === group.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="truncate w-full">{group.title}</div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
