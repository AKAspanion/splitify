"use client";

import { GroupWIthUsers } from "@/types/shared";
import { CurrencyCombobox } from "../../../_components/currency-combobox";
import { useMemo, useState } from "react";
import { getCurrency } from "@/utils/currency";
import { GET_METHOD_CALLBACK } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const BalancesCurrency = ({
  group,
  currency,
  onCurrencyChange,
}: {
  currency: string;
  group: GroupWIthUsers | null;
  onCurrencyChange: (c: string) => void;
}) => {
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const { data: uniqueCurrencies, isLoading } = useQuery<string[]>({
    queryKey: [`group-${group?.id}-currencies`],
    queryFn: GET_METHOD_CALLBACK(
      `/api/app/group/${group?.id || ""}/currencies`,
      {},
    ),
    enabled: true,
  });

  const currencies = useMemo(() => {
    const defaultCurrency = group?.currency || "inr";
    if (Array.isArray(uniqueCurrencies)) {
      const all = new Set([...uniqueCurrencies, defaultCurrency]);

      return Array.from(all)
        .map((c) => {
          const v = getCurrency(c);
          if (v) {
            return v;
          } else {
            return false;
          }
        })
        .filter((s) => s !== false);
    }

    const grp = getCurrency(defaultCurrency);
    if (grp) {
      return [grp];
    } else {
      return [];
    }
  }, [group?.currency, uniqueCurrencies]);

  return (
    <CurrencyCombobox
      disabled={isLoading}
      value={currency}
      open={currencyOpen}
      currencies={currencies}
      setOpen={setCurrencyOpen}
      setValue={onCurrencyChange}
    />
  );
};
