import { format, formatRelative } from "date-fns";

export const relativeDate = (date: string) => {
  return formatRelative(indiaDate(date), indiaDate(new Date()));
};

export const indiaDate = (date: string | number | Date) => {
  return new Date(date).toLocaleString(undefined, {
    timeZone: "Asia/Kolkata",
  });
};

export const formateDate = (
  date: string | number | Date,
  formatStr: string,
) => {
  try {
    return format(date, formatStr);
  } catch (error) {
    return "";
  }
};
