const getLatestExchangeRate = async (currency: string) => {
  const resp = await fetch(
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency.toLowerCase()}.json`,
  );
  const values = await resp.json();
  return values[currency] as Record<string, number>;
};

export class CurrencyExchangeService {
  static async getRate(from: string, to: string) {
    try {
      if (from === to) {
        return 1;
      }
      const exchangeRates = await getLatestExchangeRate(from);

      const rate = exchangeRates[to];
      return rate;
    } catch (error) {
      return 1;
    }
  }
}
