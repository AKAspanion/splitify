export const fixedNum = (value: number, decimalPlaces = 2) => {
  return Number(
    Math.round(parseFloat(value + "e" + decimalPlaces)) + "e-" + decimalPlaces
  );
};
