type AnyErrorObject = any;
type ErrorMessage = { message: string };

export const fixedNum = (value: number, decimalPlaces = 2) => {
  return Number(
    Math.round(parseFloat(value + "e" + decimalPlaces)) + "e-" + decimalPlaces,
  );
};

export const convertAllValues = <T>(obj: Record<string, T>, value: T) =>
  Object.keys(obj).reduce(
    (acc, key) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, T>,
  );

export const convertToObject = <T, S>(arr: T[], key: keyof T, value: S) =>
  arr?.reduce(
    // @ts-ignore
    (obj, item) => Object.assign(obj, { [item[key]]: value }),
    {},
  ) || {};

export const getErrorMessage = (
  error: AnyErrorObject,
  message = "Oops! Something went wrong!",
): ErrorMessage => {
  const generic = { message };

  if (error?.response) {
    return error.response.data || { ...generic };
  }

  if (error?.message) {
    return { message: error.message };
  }

  return generic;
};

export const getOwsKeyword = (name?: string) => {
  return name?.toLowerCase() === "you" ? "owe" : "owes";
};

export const getVerbKeyword = (name?: string) => {
  return name?.toLowerCase() === "you" ? "are" : "is";
};

export const getYouKeyword = (id1: string, id2: string, name: string) => {
  return id1 === id2 ? "You" : name || "Someone";
};
