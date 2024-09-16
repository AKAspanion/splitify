import currenciesRaw from "@/constants/currency-data.json";
import { RUPEE_SYMBOL } from "@/constants/ui";

export const getCurrencies = () => {
  return currenciesRaw.map((c) => ({
    ...c,
    symbol: _currencyCode(c.symbol),
  }));
};

export const getCurrency = (abv: string) => {
  return getCurrencies().find((c) => c.abbreviation === abv.toUpperCase());
};

export const getCurrencySymbol = (abv?: string | null) => {
  return getCurrency(abv || "inr")?.symbol || RUPEE_SYMBOL;
};

const _currencyCode = (code: string) => {
  try {
    const values = code
      .split(";")
      .map((c) => {
        const dec = Number(c.replace("&#", ""));
        return isNaN(dec) ? 0 : dec;
      })
      .filter(Boolean);
    return values.map((n) => String.fromCharCode(n)).join("");
  } catch (error) {
    return "";
  }
};
