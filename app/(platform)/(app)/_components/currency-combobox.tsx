"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@radix-ui/react-dropdown-menu";

import { useFormStatus } from "react-dom";
import { CurrencyType } from "@/types/shared";

type ComboboxProps = {
  label?: string;
  value: string;
  open?: boolean;
  disabled?: boolean;
  currencies: (CurrencyType | undefined)[];
  setOpen?: (open: boolean) => void;
  setValue: (value: string) => void;
};

export function CurrencyCombobox({
  label,
  open,
  disabled,
  value: v,
  currencies,
  setOpen,
  setValue,
}: ComboboxProps) {
  const value = v.toUpperCase();
  const { pending } = useFormStatus();

  const currency = currencies.find((c) => c?.abbreviation === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="w-full">
        {label ? (
          <Label className="mb-1 text-sm font-semi-bold text-neutral-700 dark:text-neutral-50">
            {label}
          </Label>
        ) : null}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={pending || disabled}
            className="w-full justify-between"
          >
            {`${currency?.symbol || ""} `}
            {value ? currency?.currency : "Select currency..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="p-0" side="bottom" align="end">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {currencies.map((c) => (
                <CommandItem
                  key={c?.abbreviation}
                  value={c?.abbreviation}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen && setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === c?.abbreviation ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {c?.currency} - {`${c?.symbol || ""} `}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
