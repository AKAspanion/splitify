import { formatRelative } from "date-fns";

export const relativeDate = (date: string) => {
  return formatRelative(indiaDate(date), indiaDate(new Date()));
};

export const indiaDate = (date: string | number | Date) => {
  return new Date(date).toLocaleDateString(undefined, {
    timeZone: "Asia/Kolkata",
  });
};
